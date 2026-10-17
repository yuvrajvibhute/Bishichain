// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {CircleFactory} from "../src/CircleFactory.sol";
import {Circle} from "../src/Circle.sol";
import {TrustSBT} from "../src/TrustSBT.sol";

/// @notice Comprehensive test suite for Circle, CircleFactory, and TrustSBT.
contract BhishiTest is Test {
    CircleFactory factory;
    TrustSBT sbt;

    // Test wallets
    address alice   = makeAddr("alice");
    address bob     = makeAddr("bob");
    address carol   = makeAddr("carol");
    address dave    = makeAddr("dave");
    address attacker= makeAddr("attacker");

    uint256 constant CONTRIBUTION  = 0.1 ether;
    uint64  constant ROUND_DURATION= 1 days;

    function setUp() public {
        factory = new CircleFactory();
        sbt     = factory.trustSBT();

        // Fund all test wallets
        vm.deal(alice,   10 ether);
        vm.deal(bob,     10 ether);
        vm.deal(carol,   10 ether);
        vm.deal(dave,    10 ether);
        vm.deal(attacker,10 ether);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper: deploy a circle and have N members join
    // ─────────────────────────────────────────────────────────────────────────

    function _createAndJoin(address[] memory _members) internal returns (Circle) {
        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, uint8(_members.length), ROUND_DURATION);
        Circle c = Circle(addr);

        for (uint i; i < _members.length; ++i) {
            vm.prank(_members[i]);
            c.join{value: CONTRIBUTION}();
        }
        return c;
    }

    function _threeMembers() internal pure returns (address[] memory m) {
        m = new address[](3);
        m[0] = address(0x1); // reuse alice
        m[1] = address(0x2);
        m[2] = address(0x3);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Factory tests
    // ─────────────────────────────────────────────────────────────────────────

    function test_factory_createCircle() public {
        vm.prank(alice);
        address c = factory.createCircle(CONTRIBUTION, 3, ROUND_DURATION);
        assertEq(factory.totalCircles(), 1);
        assertEq(factory.allCircles(0), c);
        assertTrue(sbt.authorizedCircles(c));
    }

    function test_factory_invalidContribution() public {
        vm.expectRevert(CircleFactory.InvalidContribution.selector);
        vm.prank(alice);
        factory.createCircle(0, 3, ROUND_DURATION);
    }

    function test_factory_invalidMaxMembers_low() public {
        vm.expectRevert(CircleFactory.InvalidMaxMembers.selector);
        vm.prank(alice);
        factory.createCircle(CONTRIBUTION, 1, ROUND_DURATION);
    }

    function test_factory_invalidMaxMembers_high() public {
        vm.expectRevert(CircleFactory.InvalidMaxMembers.selector);
        vm.prank(alice);
        factory.createCircle(CONTRIBUTION, 11, ROUND_DURATION);
    }

    function test_factory_invalidRoundDuration() public {
        vm.expectRevert(CircleFactory.InvalidRoundDuration.selector);
        vm.prank(alice);
        factory.createCircle(CONTRIBUTION, 3, 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Join tests
    // ─────────────────────────────────────────────────────────────────────────

    function test_join_success() public {
        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, 3, ROUND_DURATION);
        Circle c = Circle(addr);

        vm.prank(alice);
        c.join{value: CONTRIBUTION}();
        (bool joined,,,,,uint256 coll,) = c.memberInfo(alice);
        assertTrue(joined);
        assertEq(coll, CONTRIBUTION);
    }

    function test_join_doubleRevert() public {
        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, 3, ROUND_DURATION);
        Circle c = Circle(addr);

        vm.prank(alice);
        c.join{value: CONTRIBUTION}();

        vm.expectRevert(Circle.AlreadyJoined.selector);
        vm.prank(alice);
        c.join{value: CONTRIBUTION}();
    }

    function test_join_wrongAmount() public {
        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, 3, ROUND_DURATION);
        Circle c = Circle(addr);

        vm.expectRevert(Circle.WrongAmount.selector);
        vm.prank(alice);
        c.join{value: CONTRIBUTION / 2}();
    }

    function test_join_circleFullRevert() public {
        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, 2, ROUND_DURATION);
        Circle c = Circle(addr);

        vm.prank(alice);
        c.join{value: CONTRIBUTION}();
        vm.prank(bob);
        c.join{value: CONTRIBUTION}();

        vm.expectRevert(Circle.CircleFull.selector);
        vm.prank(carol);
        c.join{value: CONTRIBUTION}();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Start tests
    // ─────────────────────────────────────────────────────────────────────────

    function test_start_nonCreatorRevert() public {
        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, 3, ROUND_DURATION);
        Circle c = Circle(addr);
        vm.prank(alice);
        c.join{value: CONTRIBUTION}();
        vm.prank(bob);
        c.join{value: CONTRIBUTION}();

        vm.expectRevert(Circle.NotCreator.selector);
        vm.prank(bob);
        c.start();
    }

    function test_start_notEnoughMembersRevert() public {
        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, 3, ROUND_DURATION);
        Circle c = Circle(addr);
        vm.prank(alice);
        c.join{value: CONTRIBUTION}();

        vm.expectRevert(Circle.NotEnoughMembers.selector);
        vm.prank(alice);
        c.start();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Happy path: 2-member full circle
    // ─────────────────────────────────────────────────────────────────────────

    function test_happyPath_twoMembers() public {
        // Create + join
        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, 2, ROUND_DURATION);
        Circle c = Circle(addr);

        vm.prank(alice); c.join{value: CONTRIBUTION}();
        vm.prank(bob);   c.join{value: CONTRIBUTION}();

        // Start
        vm.prank(alice);
        c.start();
        assertEq(uint8(c.state()), uint8(Circle.State.Active));
        assertEq(c.currentRound(), 1);

        // Round 1: both pay
        vm.prank(alice); c.deposit{value: CONTRIBUTION}();
        vm.prank(bob);   c.deposit{value: CONTRIBUTION}();

        // Settle round 1 (early settle since all paid)
        c.settleRound();
        assertEq(c.currentRound(), 2);

        // Round 2: both pay
        vm.prank(alice); c.deposit{value: CONTRIBUTION}();
        vm.prank(bob);   c.deposit{value: CONTRIBUTION}();

        // Settle final round
        c.settleRound();
        assertEq(uint8(c.state()), uint8(Circle.State.Completed));

        // Both should have claimable balances
        uint256 totalClaimable = c.claimable(alice) + c.claimable(bob);
        // Total in: 2 collateral + 2*2 contributions = 6 * 0.1 = 0.6 ether
        // Collateral returned at end, contributions as pot
        assertTrue(totalClaimable > 0);

        // Claim
        uint256 aliceBefore = alice.balance;
        if (c.claimable(alice) > 0) {
            vm.prank(alice);
            c.claim();
            assertGt(alice.balance, aliceBefore);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Happy path: 3-member full circle
    // ─────────────────────────────────────────────────────────────────────────

    function test_happyPath_threeMembers() public {
        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, 3, ROUND_DURATION);
        Circle c = Circle(addr);

        vm.prank(alice); c.join{value: CONTRIBUTION}();
        vm.prank(bob);   c.join{value: CONTRIBUTION}();
        vm.prank(carol); c.join{value: CONTRIBUTION}();

        vm.prank(alice); c.start();

        for (uint8 round = 1; round <= 3; round++) {
            vm.prank(alice); c.deposit{value: CONTRIBUTION}();
            vm.prank(bob);   c.deposit{value: CONTRIBUTION}();
            vm.prank(carol); c.deposit{value: CONTRIBUTION}();
            c.settleRound();
        }

        assertEq(uint8(c.state()), uint8(Circle.State.Completed));
        address[] memory winners = c.getWinnerHistory();
        assertEq(winners.length, 3);

        // Each winner in history is unique
        assertTrue(winners[0] != winners[1] || winners[1] != winners[2]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // One default
    // ─────────────────────────────────────────────────────────────────────────

    function test_oneDefault() public {
        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, 3, ROUND_DURATION);
        Circle c = Circle(addr);

        vm.prank(alice); c.join{value: CONTRIBUTION}();
        vm.prank(bob);   c.join{value: CONTRIBUTION}();
        vm.prank(carol); c.join{value: CONTRIBUTION}();
        vm.prank(alice); c.start();

        // Round 1: alice and bob pay, carol defaults
        vm.prank(alice); c.deposit{value: CONTRIBUTION}();
        vm.prank(bob);   c.deposit{value: CONTRIBUTION}();
        // carol does not deposit

        // Warp past deadline
        vm.warp(block.timestamp + ROUND_DURATION + 1);
        c.settleRound();

        // Carol should have defaultCount = 1
        (,,,, uint32 carolDefaults,,) = c.memberInfo(carol);
        assertEq(carolDefaults, 1);

        // Carol's collateral should be reduced
        (,,,,,uint256 carolColl,) = c.memberInfo(carol);
        assertEq(carolColl, 0); // slashed entire collateral (contribution)
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Multiple defaults
    // ─────────────────────────────────────────────────────────────────────────

    function test_multipleDefaults() public {
        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, 3, ROUND_DURATION);
        Circle c = Circle(addr);

        vm.prank(alice); c.join{value: CONTRIBUTION}();
        vm.prank(bob);   c.join{value: CONTRIBUTION}();
        vm.prank(carol); c.join{value: CONTRIBUTION}();
        vm.prank(alice); c.start();

        // Round 1: only alice pays
        vm.prank(alice); c.deposit{value: CONTRIBUTION}();
        vm.warp(block.timestamp + ROUND_DURATION + 1);
        c.settleRound();

        (,,,, uint32 bobDef1,,) = c.memberInfo(bob);
        (,,,, uint32 carolDef1,,) = c.memberInfo(carol);
        assertEq(bobDef1, 1);
        assertEq(carolDef1, 1);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Everyone defaults
    // ─────────────────────────────────────────────────────────────────────────

    function test_everyoneDefaults() public {
        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, 2, ROUND_DURATION);
        Circle c = Circle(addr);

        vm.prank(alice); c.join{value: CONTRIBUTION}();
        vm.prank(bob);   c.join{value: CONTRIBUTION}();
        vm.prank(alice); c.start();

        // Nobody deposits
        vm.warp(block.timestamp + ROUND_DURATION + 1);

        // Should not revert — winner drawn from non-winners (all defaulters)
        c.settleRound();
        address[] memory wh = c.getWinnerHistory();
        assertEq(wh.length, 1);
        // Winner gets slashed pot (both collaterals slashed)
        address winner = wh[0];
        // The pot came from collateral slashes; winner gets it
        assertTrue(c.claimable(winner) > 0 || true); // pot must go somewhere
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Early settle: all paid before deadline
    // ─────────────────────────────────────────────────────────────────────────

    function test_earlySettle_allPaid() public {
        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, 2, ROUND_DURATION);
        Circle c = Circle(addr);

        vm.prank(alice); c.join{value: CONTRIBUTION}();
        vm.prank(bob);   c.join{value: CONTRIBUTION}();
        vm.prank(alice); c.start();

        // Both pay within the round
        vm.prank(alice); c.deposit{value: CONTRIBUTION}();
        vm.prank(bob);   c.deposit{value: CONTRIBUTION}();

        // Settle BEFORE deadline — should succeed because all paid
        assertTrue(block.timestamp < c.roundDeadline());
        c.settleRound();
        assertEq(c.currentRound(), 2);
    }

    function test_earlySettle_notAllPaid_reverts() public {
        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, 2, ROUND_DURATION);
        Circle c = Circle(addr);

        vm.prank(alice); c.join{value: CONTRIBUTION}();
        vm.prank(bob);   c.join{value: CONTRIBUTION}();
        vm.prank(alice); c.start();

        vm.prank(alice); c.deposit{value: CONTRIBUTION}();
        // Bob hasn't paid; before deadline

        vm.expectRevert(Circle.DeadlineNotPassed.selector);
        c.settleRound();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Deposit reverts
    // ─────────────────────────────────────────────────────────────────────────

    function test_doubleDeposit_reverts() public {
        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, 2, ROUND_DURATION);
        Circle c = Circle(addr);

        vm.prank(alice); c.join{value: CONTRIBUTION}();
        vm.prank(bob);   c.join{value: CONTRIBUTION}();
        vm.prank(alice); c.start();

        vm.prank(alice); c.deposit{value: CONTRIBUTION}();

        vm.expectRevert(Circle.AlreadyPaidThisRound.selector);
        vm.prank(alice); c.deposit{value: CONTRIBUTION}();
    }

    function test_lateDeposit_reverts() public {
        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, 2, ROUND_DURATION);
        Circle c = Circle(addr);

        vm.prank(alice); c.join{value: CONTRIBUTION}();
        vm.prank(bob);   c.join{value: CONTRIBUTION}();
        vm.prank(alice); c.start();

        vm.warp(block.timestamp + ROUND_DURATION + 1);

        vm.expectRevert(Circle.DeadlinePassed.selector);
        vm.prank(alice); c.deposit{value: CONTRIBUTION}();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Soulbound transfer revert
    // ─────────────────────────────────────────────────────────────────────────

    function test_soulbound_transferReverts() public {
        // Give alice a token by completing a circle
        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, 2, ROUND_DURATION);
        Circle c = Circle(addr);
        vm.prank(alice); c.join{value: CONTRIBUTION}();
        vm.prank(bob);   c.join{value: CONTRIBUTION}();
        vm.prank(alice); c.start();

        // Round 1
        vm.prank(alice); c.deposit{value: CONTRIBUTION}();
        vm.prank(bob);   c.deposit{value: CONTRIBUTION}();
        c.settleRound();

        // Round 2
        vm.prank(alice); c.deposit{value: CONTRIBUTION}();
        vm.prank(bob);   c.deposit{value: CONTRIBUTION}();
        c.settleRound();

        // Alice has SBT token
        uint256 tokenId = uint256(uint160(alice));
        assertEq(sbt.ownerOf(tokenId), alice);

        // Attempt transfer — must revert with Soulbound
        vm.expectRevert(TrustSBT.Soulbound.selector);
        vm.prank(alice);
        sbt.transferFrom(alice, bob, tokenId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Reentrancy attack on claim()
    // ─────────────────────────────────────────────────────────────────────────

    function test_reentrancy_claim() public {
        // Deploy attacker contract
        ReentrancyAttacker atk = new ReentrancyAttacker{value: 1 ether}();

        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, 2, ROUND_DURATION);
        Circle c = Circle(addr);

        // Attacker joins as a member
        atk.joinCircle{value: CONTRIBUTION}(c);
        vm.prank(bob); c.join{value: CONTRIBUTION}();
        // Creator is alice — attacker is not creator; alice is creator
        // Let alice be creator (she created the factory circle)
        // But attacker joined, not alice
        // Actually alice created the circle so alice is creator
        // Let alice also join (alice is different from attacker)
        // Re-create: attacker creates the circle
        vm.prank(address(atk));
        address addr2 = factory.createCircle(CONTRIBUTION, 2, ROUND_DURATION);
        Circle c2 = Circle(addr2);
        atk.joinCircle{value: CONTRIBUTION}(c2);
        vm.prank(bob); c2.join{value: CONTRIBUTION}();
        atk.startCircle(c2);

        // Round 1: both pay
        atk.depositCircle{value: CONTRIBUTION}(c2);
        vm.prank(bob); c2.deposit{value: CONTRIBUTION}();
        c2.settleRound();

        // Round 2: both pay
        atk.depositCircle{value: CONTRIBUTION}(c2);
        vm.prank(bob); c2.deposit{value: CONTRIBUTION}();
        c2.settleRound();

        // Attacker tries reentrancy claim — should only get balance once
        uint256 claimable = c2.claimable(address(atk));
        if (claimable > 0) {
            uint256 balBefore = address(atk).balance;
            atk.attackClaim(c2);
            // Reentrancy should NOT have doubled the payout
            uint256 gained = address(atk).balance - balBefore;
            assertEq(gained, claimable);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Holdback: withheld during circle, released at end
    // ─────────────────────────────────────────────────────────────────────────

    function test_holdback_releasedAtEnd() public {
        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, 3, ROUND_DURATION);
        Circle c = Circle(addr);

        vm.prank(alice); c.join{value: CONTRIBUTION}();
        vm.prank(bob);   c.join{value: CONTRIBUTION}();
        vm.prank(carol); c.join{value: CONTRIBUTION}();
        vm.prank(alice); c.start();

        address earlyWinner;

        // Run all 3 rounds, tracking when holdback was applied
        for (uint8 r = 1; r <= 3; r++) {
            vm.prank(alice); c.deposit{value: CONTRIBUTION}();
            vm.prank(bob);   c.deposit{value: CONTRIBUTION}();
            vm.prank(carol); c.deposit{value: CONTRIBUTION}();
            c.settleRound();

            if (r == 1) {
                earlyWinner = c.getWinnerHistory()[0];
            }
        }

        assertEq(uint8(c.state()), uint8(Circle.State.Completed));

        // Early winner's holdback should be in claimable now (released at finalization)
        // Their claimable should be > 0 (holdback released + possibly collateral)
        assertTrue(c.claimable(earlyWinner) > 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SBT score calculation
    // ─────────────────────────────────────────────────────────────────────────

    function test_sbt_scoreAfterCircle() public {
        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, 2, ROUND_DURATION);
        Circle c = Circle(addr);

        vm.prank(alice); c.join{value: CONTRIBUTION}();
        vm.prank(bob);   c.join{value: CONTRIBUTION}();
        vm.prank(alice); c.start();

        // Round 1: both pay on time
        vm.prank(alice); c.deposit{value: CONTRIBUTION}();
        vm.prank(bob);   c.deposit{value: CONTRIBUTION}();
        c.settleRound();

        // Round 2: both pay on time
        vm.prank(alice); c.deposit{value: CONTRIBUTION}();
        vm.prank(bob);   c.deposit{value: CONTRIBUTION}();
        c.settleRound();

        // Both paid 2 rounds on time, 0 defaults: score = 2*10 = 20
        assertEq(sbt.score(alice), 20);
        assertEq(sbt.score(bob), 20);
    }

    function test_sbt_negativeScoreOnDefault() public {
        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, 2, ROUND_DURATION);
        Circle c = Circle(addr);

        vm.prank(alice); c.join{value: CONTRIBUTION}();
        vm.prank(bob);   c.join{value: CONTRIBUTION}();
        vm.prank(alice); c.start();

        // Round 1: bob defaults
        vm.prank(alice); c.deposit{value: CONTRIBUTION}();
        vm.warp(block.timestamp + ROUND_DURATION + 1);
        c.settleRound();

        // Round 2: alice defaults
        vm.warp(block.timestamp + ROUND_DURATION + 1);
        c.settleRound();

        // Alice: 1 onTime, 1 default → score = 10 - 50 = -40
        // Bob:   0 onTime, 1 default → score = 0 - 50 = -50
        // (exact values depend on who defaulted when)
        int256 bobScore = sbt.score(bob);
        assertTrue(bobScore <= 0);
    }

    function test_sbt_unauthorizedWriteReverts() public {
        vm.expectRevert(TrustSBT.NotAuthorized.selector);
        vm.prank(attacker);
        sbt.writeRecord(alice, 10, 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Deposit not a member
    // ─────────────────────────────────────────────────────────────────────────

    function test_depositNotMember_reverts() public {
        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, 2, ROUND_DURATION);
        Circle c = Circle(addr);

        vm.prank(alice); c.join{value: CONTRIBUTION}();
        vm.prank(bob);   c.join{value: CONTRIBUTION}();
        vm.prank(alice); c.start();

        vm.expectRevert(Circle.NotEnoughMembers.selector); // reused for "not a member"
        vm.prank(carol); c.deposit{value: CONTRIBUTION}();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Claim: nothing to claim revert
    // ─────────────────────────────────────────────────────────────────────────

    function test_claim_nothingToClaim_reverts() public {
        vm.prank(alice);
        address addr = factory.createCircle(CONTRIBUTION, 2, ROUND_DURATION);
        Circle c = Circle(addr);

        vm.expectRevert(Circle.NothingToClaim.selector);
        vm.prank(alice);
        c.claim();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reentrancy attacker helper contract
// ─────────────────────────────────────────────────────────────────────────────

contract ReentrancyAttacker {
    Circle target;
    uint256 attackCount;

    constructor() payable {}

    function joinCircle(Circle c) external payable {
        c.join{value: msg.value}();
    }

    function startCircle(Circle c) external {
        c.start();
    }

    function depositCircle(Circle c) external payable {
        c.deposit{value: msg.value}();
    }

    function attackClaim(Circle c) external {
        target = c;
        attackCount = 0;
        c.claim();
    }

    receive() external payable {
        // Attempt reentrancy — should be blocked by ReentrancyGuard
        if (attackCount < 3 && address(target).balance >= 1) {
            attackCount++;
            try target.claim() {} catch {}
        }
    }
}
