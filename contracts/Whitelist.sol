// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DeSciWhitelist
 * @notice Minimal whitelist contract for the $tabledadrian DeSci dApp.
 *
 * DESIGN:
 * - Any externally owned account (EOA) can call joinWhitelist().
 * - The contract records a simple boolean flag per address.
 * - An event is emitted so you can index joins off‑chain (The Graph, custom indexer, etc).
 *
 * TODO (manual steps, NOT handled by this repo):
 * - Deploy this contract to the target chain (e.g. Base mainnet or testnet).
 * - Take the deployed address and set it in `.env.local` as:
 *     NEXT_PUBLIC_WHITELIST_CONTRACT_ADDRESS=0xYourDeployedAddress
 * - Keep the ABI in `lib/blockchain.ts` in sync if you extend the contract.
 */
contract DeSciWhitelist {
    address public owner;

    mapping(address => bool) public whitelisted;

    event JoinedWhitelist(address indexed user);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Join the DeSci whitelist.
     *         Can be called once per address; repeat calls will revert.
     */
    function joinWhitelist() external {
        require(!whitelisted[msg.sender], "Already whitelisted");
        whitelisted[msg.sender] = true;
        emit JoinedWhitelist(msg.sender);
    }

    /**
     * @notice Owner-only function to remove an address from the whitelist if needed.
     */
    function removeFromWhitelist(address user) external onlyOwner {
        whitelisted[user] = false;
    }
}


