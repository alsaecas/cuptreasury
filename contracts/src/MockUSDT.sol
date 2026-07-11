// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Local test-only ERC-20 for deterministic CupTreasury proofs.
/// @dev This contract is not official USDt and must never be deployed as a production token.
contract MockUSDT is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(address initialMinter) ERC20("Mock USD Tether", "MockUSDT") {
        if (initialMinter == address(0)) revert ZeroMinter();
        _grantRole(DEFAULT_ADMIN_ROLE, initialMinter);
        _grantRole(MINTER_ROLE, initialMinter);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address recipient, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(recipient, amount);
    }

    error ZeroMinter();
}
