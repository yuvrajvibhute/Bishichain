// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {TrustSBT} from "./TrustSBT.sol";

/// @title Circle
/// @notice A single Bhishi chit-fund circle.
///
///         State machine:
///           Open ──► Active ──► Completed
///
///         Each round:
///           1. Members call deposit() before the deadline.
///           2. Anyone calls settleRound() after deadline (or early if all paid).
///           3. A winner is drawn from members who haven't won yet.
///           4. 70% of the pot goes to claimable[winner] immediately.
///              30% is held back until the circle completes (anti-ghost holdback).
///           5. Non-payers get their collateral slashed (up to one contribution).
///
///         Randomness: block.prevrandao — sufficient for testnet / hackathon.
///         ⚠️  WARNING: prevrandao can be biased by validators on mainnet.
///                      Replace with Chainlink VRF v2.5 before production use.
///
///         Holdback rationale: Early winners who stop paying would leave latecomers
///         short of a full pot. By withholding 30% until completion we ensure the
///         winner has "skin in the game" through the whole circle.
///
/// @custom:security ReentrancyGuard on claim(). Pull-payment pattern throughout.
contract Circle is ReentrancyGuard {
    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    enum State { Open, Active, Completed }

    struct MemberInfo {
        bool   joined;
        bool   hasWon;
        bool   paidThisRound;
        uint32 onTimeCount;   // rounds paid on time (for SBT)
        uint32 defaultCount;  // rounds defaulted (for SBT)
        uint256 collateral;   // remaining collateral held
        uint256 holdback;     // 30% pot withheld until circle ends
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────────────────
    error NotOpen();
    error NotActive();
    error AlreadyCompleted();
    error NotCreator();
    error NotEnoughMembers();
    error AlreadyJoined();
    error CircleFull();
    error WrongAmount();
    error AlreadyPaidThisRound();
    error DeadlinePassed();
    error DeadlineNotPassed();
    error NotAllPaidYet();
    error NothingToClaim();
    error TransferFailed();

    // ─────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Fraction of pot withheld from early winners (30% = 3000 / 10000).
    uint256 public constant HOLDBACK_BPS = 3000;
    uint256 public constant BPS          = 10_000;

    // ─────────────────────────────────────────────────────────────────────────
    // Immutables
    // ─────────────────────────────────────────────────────────────────────────

    address public immutable creator;
    uint256 public immutable contribution; // Native token per round per member
    uint8   public immutable maxMembers;
    uint64  public immutable roundDuration; // seconds
    TrustSBT public immutable trustSBT;

    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    State  public state;
    uint8  public currentRound;   // 1-indexed, 0 = not started
    uint64 public roundDeadline;  // unix timestamp

    address[] public members;
    mapping(address => MemberInfo) public memberInfo;

    /// @notice Pull-payment credits. Winner calls claim() to withdraw.
    mapping(address => uint256) public claimable;

    /// @notice History of winners per round.
    address[] public winnerHistory;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────
    event Joined(address indexed member, uint256 collateral);
    event Started(uint8 totalRounds, uint64 firstDeadline);
    event Deposited(address indexed member, uint8 round);
    event Slashed(address indexed member, uint256 amount, uint8 round);
    event RoundSettled(uint8 indexed round, address indexed winner, uint256 pot);
    event HoldbackReleased(address indexed member, uint256 amount);
    event Claimed(address indexed member, uint256 amount);
    event CircleCompleted(uint8 totalRounds);

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor(
        address _creator,
        uint256 _contribution,
        uint8   _maxMembers,
        uint64  _roundDuration,
        address _trustSBT
    ) {
        creator      = _creator;
        contribution = _contribution;
        maxMembers   = _maxMembers;
        roundDuration= _roundDuration;
        trustSBT     = TrustSBT(_trustSBT);
        state        = State.Open;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Join (Open state)
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Lock collateral and join the circle.
    ///         Collateral = exactly one contribution.
    function join() external payable {
        if (state != State.Open) revert NotOpen();
        if (memberInfo[msg.sender].joined) revert AlreadyJoined();
        if (members.length >= maxMembers) revert CircleFull();
        if (msg.value != contribution) revert WrongAmount();

        memberInfo[msg.sender] = MemberInfo({
            joined:        true,
            hasWon:        false,
            paidThisRound: false,
            onTimeCount:   0,
            defaultCount:  0,
            collateral:    msg.value,
            holdback:      0
        });
        members.push(msg.sender);

        emit Joined(msg.sender, msg.value);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Start (Open → Active)
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Creator starts the circle. Requires ≥ 2 members.
    function start() external {
        if (state != State.Open) revert NotOpen();
        if (msg.sender != creator) revert NotCreator();
        if (members.length < 2) revert NotEnoughMembers();

        state        = State.Active;
        currentRound = 1;
        roundDeadline= uint64(block.timestamp) + roundDuration;

        emit Started(uint8(members.length), roundDeadline);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Deposit (Active state, per round)
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Pay this round's contribution before the deadline.
    function deposit() external payable {
        if (state != State.Active) revert NotActive();
        if (memberInfo[msg.sender].paidThisRound) revert AlreadyPaidThisRound();
        if (block.timestamp >= roundDeadline) revert DeadlinePassed();
        if (msg.value != contribution) revert WrongAmount();
        if (!memberInfo[msg.sender].joined) revert NotEnoughMembers(); // reuse: not a member

        memberInfo[msg.sender].paidThisRound = true;

        emit Deposited(msg.sender, currentRound);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Settle round
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Settle the current round.
    ///         Can be called by anyone:
    ///         - After the deadline (for any state of payment), OR
    ///         - Before the deadline only if ALL members have paid.
    ///
    ///         Logic:
    ///         1. Slash non-payers (collateral → pot contribution).
    ///         2. Build the pot from paid contributions + slash proceeds.
    ///         3. Draw winner from unwinners; prefer payers; exclude defaulters if possible.
    ///         4. Credit 70% to claimable[winner], 30% held back in holdback[winner].
    ///         5. On final round: release all holdbacks, return collateral, write SBT.
    function settleRound() external {
        if (state != State.Active) revert NotActive();

        bool allPaid = _allPaid();
        bool pastDeadline = block.timestamp >= roundDeadline;

        if (!pastDeadline && !allPaid) revert DeadlineNotPassed();

        uint256 n = members.length;
        uint256 pot;

        // ── Step 1: slash non-payers ──────────────────────────────────────
        for (uint256 i; i < n; ++i) {
            address m = members[i];
            MemberInfo storage mi = memberInfo[m];
            if (!mi.paidThisRound) {
                // Slash up to one contribution from collateral
                uint256 slash = mi.collateral >= contribution
                    ? contribution
                    : mi.collateral;
                mi.collateral -= slash;
                mi.defaultCount += 1;
                pot += slash;
                emit Slashed(m, slash, currentRound);
            } else {
                mi.onTimeCount += 1;
                pot += contribution;
            }
        }

        // ── Step 2: draw winner ───────────────────────────────────────────
        // Priority: (a) paid AND not yet won; (b) not yet won (includes defaulters)
        address winner = _drawWinner();

        // ── Step 3: distribute pot with holdback ──────────────────────────
        bool isFinalRound = (currentRound == n);
        MemberInfo storage wi = memberInfo[winner];

        uint256 holdbackAmt;
        uint256 payout;

        if (!isFinalRound && !wi.hasWon) {
            // Apply holdback only on first win and not the final round
            holdbackAmt = (pot * HOLDBACK_BPS) / BPS;
            payout      = pot - holdbackAmt;
            wi.holdback += holdbackAmt;
        } else {
            payout = pot;
        }

        wi.hasWon = true;
        claimable[winner] += payout;
        winnerHistory.push(winner);

        emit RoundSettled(currentRound, winner, pot);

        // ── Step 4: reset paid flags ──────────────────────────────────────
        for (uint256 i; i < n; ++i) {
            memberInfo[members[i]].paidThisRound = false;
        }

        // ── Step 5: final round housekeeping ─────────────────────────────
        if (isFinalRound) {
            _finalizeCircle();
        } else {
            currentRound  += 1;
            roundDeadline  = uint64(block.timestamp) + roundDuration;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Claim (pull payment)
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Withdraw your claimable balance. ReentrancyGuard protected.
    function claim() external nonReentrant {
        uint256 amount = claimable[msg.sender];
        if (amount == 0) revert NothingToClaim();

        // Checks-effects-interactions: zero before transfer
        claimable[msg.sender] = 0;

        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Claimed(msg.sender, amount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View helpers
    // ─────────────────────────────────────────────────────────────────────────

    function getMembersLength() external view returns (uint256) {
        return members.length;
    }

    function getMembers() external view returns (address[] memory) {
        return members;
    }

    function getWinnerHistory() external view returns (address[] memory) {
        return winnerHistory;
    }

    function secondsToDeadline() external view returns (uint256) {
        if (block.timestamp >= roundDeadline) return 0;
        return roundDeadline - block.timestamp;
    }

    function totalRounds() external view returns (uint8) {
        return uint8(members.length);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

    function _allPaid() internal view returns (bool) {
        uint256 n = members.length;
        for (uint256 i; i < n; ++i) {
            if (!memberInfo[members[i]].paidThisRound) return false;
        }
        return true;
    }

    /// @dev Draw winner via prevrandao.
    ///      Priority 1: paid + not yet won.
    ///      Priority 2: not yet won (defaulters included only if no payer is eligible).
    ///      ⚠️ prevrandao is manipulable by validators. Replace with VRF for mainnet.
    function _drawWinner() internal view returns (address winner) {
        uint256 n = members.length;

        // Build eligible-payers list
        address[] memory payers = new address[](n);
        uint256 payerCount;
        address[] memory nonWinners = new address[](n);
        uint256 nonWinnerCount;

        for (uint256 i; i < n; ++i) {
            address m = members[i];
            MemberInfo storage mi = memberInfo[m];
            if (!mi.hasWon) {
                nonWinners[nonWinnerCount++] = m;
                if (mi.paidThisRound) {
                    payers[payerCount++] = m;
                }
            }
        }

        // Choose pool: prefer payers, fall back to all non-winners
        uint256 poolSize = payerCount > 0 ? payerCount : nonWinnerCount;
        address[] memory pool = payerCount > 0 ? payers : nonWinners;

        // prevrandao-based random index
        uint256 idx = uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            block.timestamp,
            currentRound,
            address(this)
        ))) % poolSize;

        return pool[idx];
    }

    /// @dev Called after the final round: release holdbacks, return collateral, write SBT.
    function _finalizeCircle() internal {
        uint256 n = members.length;
        state = State.Completed;

        for (uint256 i; i < n; ++i) {
            address m = members[i];
            MemberInfo storage mi = memberInfo[m];

            // Release holdback to claimable
            if (mi.holdback > 0) {
                claimable[m] += mi.holdback;
                emit HoldbackReleased(m, mi.holdback);
                mi.holdback = 0;
            }

            // Return remaining collateral to claimable
            if (mi.collateral > 0) {
                claimable[m] += mi.collateral;
                mi.collateral = 0;
            }

            // Write SBT record
            try trustSBT.writeRecord(m, mi.onTimeCount, mi.defaultCount) {} catch {}
        }

        emit CircleCompleted(uint8(n));
    }
}
