// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {CircleFactory} from "../src/CircleFactory.sol";
import {Circle} from "../src/Circle.sol";

/// @notice Demo seed: creates a 3-member circle with 120-second rounds.
///         Uses DEMO_WALLET_1, DEMO_WALLET_2, DEMO_WALLET_3 from env.
///         One wallet intentionally does NOT deposit round 1 to demo slashing.
///
///         Run with:
///           forge script script/Seed.s.sol --rpc-url $MST_TESTNET_RPC_URL \
///             --private-key $PRIVATE_KEY --broadcast -vvv
contract SeedScript is Script {
    function run() external {
        address factoryAddr = vm.envAddress("CIRCLE_FACTORY");
        CircleFactory factory = CircleFactory(factoryAddr);

        uint256 key1 = vm.envUint("DEMO_KEY_1");
        uint256 key2 = vm.envUint("DEMO_KEY_2");
        uint256 key3 = vm.envUint("DEMO_KEY_3");

        address wallet1 = vm.addr(key1);
        address wallet2 = vm.addr(key2);
        address wallet3 = vm.addr(key3);

        uint256 contribution = 0.01 ether;
        uint64  roundDuration= 120; // 2 minutes for demo

        // ── Deploy circle ────────────────────────────────────────────────────
        vm.startBroadcast(key1);
        address circleAddr = factory.createCircle(contribution, 3, roundDuration);
        Circle  circle     = Circle(circleAddr);
        circle.join{value: contribution}();
        vm.stopBroadcast();

        // ── Join ─────────────────────────────────────────────────────────────
        vm.startBroadcast(key2);
        circle.join{value: contribution}();
        vm.stopBroadcast();

        vm.startBroadcast(key3);
        circle.join{value: contribution}();
        vm.stopBroadcast();

        // ── Start ─────────────────────────────────────────────────────────────
        vm.startBroadcast(key1);
        circle.start();
        vm.stopBroadcast();

        console2.log("=== Demo Circle Created ===");
        console2.log("Circle address:", circleAddr);
        console2.log("Contribution:  ", contribution);
        console2.log("Round duration:", roundDuration, "seconds");
        console2.log("Wallet 1:", wallet1);
        console2.log("Wallet 2:", wallet2);
        console2.log("Wallet 3:", wallet3, "(will default round 1)");
        console2.log("Now: deposit with wallet1 and wallet2, let wallet3 default.");
    }
}
