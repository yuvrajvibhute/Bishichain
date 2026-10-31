// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {CircleFactory} from "../src/CircleFactory.sol";
import {TrustSBT} from "../src/TrustSBT.sol";

/// @notice Deploys CircleFactory (which internally deploys TrustSBT).
///         Run with:
///           forge script script/Deploy.s.sol --rpc-url $MST_TESTNET_RPC_URL \
///             --private-key $PRIVATE_KEY --broadcast -vvv
contract DeployScript is Script {
    function run() external returns (CircleFactory factory, TrustSBT sbt) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        factory = new CircleFactory();
        sbt     = factory.trustSBT();

        vm.stopBroadcast();

        console2.log("=== Bhishi.mst Deployment ===");
        console2.log("CircleFactory:", address(factory));
        console2.log("TrustSBT:     ", address(sbt));
        console2.log("Network:       MST Testnet");
        console2.log("Block:        ", block.number);
    }
}
