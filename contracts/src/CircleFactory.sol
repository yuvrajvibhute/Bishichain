// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Circle} from "./Circle.sol";
import {TrustSBT} from "./TrustSBT.sol";

/// @title CircleFactory
/// @notice Deploys new Bhishi Circle contracts, authorizes them on TrustSBT,
///         and maintains a public registry.
contract CircleFactory {
    // ─────────────────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────────────────
    error InvalidContribution();
    error InvalidMaxMembers();
    error InvalidRoundDuration();

    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    TrustSBT public immutable trustSBT;

    /// @notice All circles ever deployed.
    address[] public allCircles;

    /// @notice Creator => their circles.
    mapping(address creator => address[]) public circlesByCreator;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────
    event CircleCreated(
        address indexed circle,
        address indexed creator,
        uint256 contribution,
        uint8  maxMembers,
        uint64 roundDuration
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor() {
        // Factory deploys the SBT and passes itself as the authorized factory.
        // We use address(this) — the factory's own address.
        trustSBT = new TrustSBT(address(this));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Create
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Deploys a new Circle and authorizes it on the TrustSBT.
    /// @param contribution  Exact native-token amount each member pays per round (wei).
    /// @param maxMembers    Number of members (2–10).
    /// @param roundDuration Seconds per round.
    /// @return circle Address of the new Circle contract.
    function createCircle(
        uint256 contribution,
        uint8   maxMembers,
        uint64  roundDuration
    ) external returns (address circle) {
        if (contribution == 0)              revert InvalidContribution();
        if (maxMembers < 2 || maxMembers > 10) revert InvalidMaxMembers();
        if (roundDuration == 0)             revert InvalidRoundDuration();

        Circle c = new Circle(
            msg.sender,
            contribution,
            maxMembers,
            roundDuration,
            address(trustSBT)
        );

        circle = address(c);
        allCircles.push(circle);
        circlesByCreator[msg.sender].push(circle);

        // Authorize the new circle to write SBT records.
        trustSBT.authorizeCircle(circle);

        emit CircleCreated(circle, msg.sender, contribution, maxMembers, roundDuration);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View helpers
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Total number of circles deployed.
    function totalCircles() external view returns (uint256) {
        return allCircles.length;
    }

    /// @notice Get all circles deployed by a specific creator.
    function getCirclesByCreator(address creator) external view returns (address[] memory) {
        return circlesByCreator[creator];
    }

    /// @notice Get all deployed circles.
    function getAllCircles() external view returns (address[] memory) {
        return allCircles;
    }
}
