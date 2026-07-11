// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Captain/Treasurer governed local-test-token treasury.
/// @dev It deliberately has no upgrade, arbitrary-call, emergency-withdrawal, or owner-payment path.
contract TeamTreasury is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant CAPTAIN_ROLE = keccak256("CAPTAIN_ROLE");
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");

    struct PaymentRequest {
        address token;
        address recipient;
        uint256 amount;
        bytes32 paymentIntentHash;
        uint64 expiresAt;
        uint8 requiredApprovals;
        uint8 approvalCount;
        bool executed;
        bool cancelled;
        bool exists;
    }

    uint256 public nextRequestId;
    mapping(uint256 requestId => PaymentRequest) private requests;
    mapping(uint256 requestId => mapping(address approver => bool)) public hasApproved;

    event RequestCreated(
        uint256 indexed requestId,
        address indexed token,
        address indexed recipient,
        uint256 amount,
        bytes32 paymentIntentHash,
        uint64 expiresAt,
        uint8 requiredApprovals
    );
    event RequestApproved(uint256 indexed requestId, address indexed approver, uint8 approvalCount);
    event RequestExecuted(uint256 indexed requestId, address indexed executor);
    event RequestCancelled(uint256 indexed requestId, address indexed canceller);

    error ZeroCaptain();
    error ZeroTreasurer();
    error ZeroToken();
    error ZeroRecipient();
    error ZeroAmount();
    error ExpiredRequest();
    error UnsupportedApprovalThreshold();
    error RequestCancelledError();
    error RequestAlreadyExecuted();
    error DuplicateApproval();
    error ApprovalThresholdNotMet();
    error RequestNotFound();
    error ZeroPaymentIntentHash();
    error DuplicateTreasuryOfficer();

    constructor(address captain, address treasurer) {
        if (captain == address(0)) revert ZeroCaptain();
        if (treasurer == address(0)) revert ZeroTreasurer();
        if (captain == treasurer) revert DuplicateTreasuryOfficer();

        _grantRole(DEFAULT_ADMIN_ROLE, captain);
        _grantRole(CAPTAIN_ROLE, captain);
        _grantRole(TREASURER_ROLE, treasurer);
    }

    modifier onlyTreasuryOfficer() {
        if (!hasRole(CAPTAIN_ROLE, msg.sender) && !hasRole(TREASURER_ROLE, msg.sender)) {
            revert AccessControlUnauthorizedAccount(msg.sender, CAPTAIN_ROLE);
        }
        _;
    }

    function createRequest(
        address token,
        address recipient,
        uint256 amount,
        bytes32 paymentIntentHash,
        uint64 expiresAt,
        uint8 requiredApprovals
    ) external onlyTreasuryOfficer returns (uint256 requestId) {
        if (token == address(0)) revert ZeroToken();
        if (recipient == address(0)) revert ZeroRecipient();
        if (amount == 0) revert ZeroAmount();
        if (paymentIntentHash == bytes32(0)) revert ZeroPaymentIntentHash();
        if (expiresAt <= block.timestamp) revert ExpiredRequest();
        if (requiredApprovals == 0 || requiredApprovals > 2) revert UnsupportedApprovalThreshold();

        requestId = nextRequestId++;
        requests[requestId] = PaymentRequest({
            token: token,
            recipient: recipient,
            amount: amount,
            paymentIntentHash: paymentIntentHash,
            expiresAt: expiresAt,
            requiredApprovals: requiredApprovals,
            approvalCount: 0,
            executed: false,
            cancelled: false,
            exists: true
        });
        emit RequestCreated(requestId, token, recipient, amount, paymentIntentHash, expiresAt, requiredApprovals);
    }

    function approveRequest(uint256 requestId) external onlyTreasuryOfficer {
        PaymentRequest storage request = requests[requestId];
        if (!request.exists) revert RequestNotFound();
        if (request.cancelled) revert RequestCancelledError();
        if (request.executed) revert RequestAlreadyExecuted();
        if (request.expiresAt <= block.timestamp) revert ExpiredRequest();
        if (hasApproved[requestId][msg.sender]) revert DuplicateApproval();

        hasApproved[requestId][msg.sender] = true;
        request.approvalCount += 1;
        emit RequestApproved(requestId, msg.sender, request.approvalCount);
    }

    function executeRequest(uint256 requestId) external nonReentrant {
        PaymentRequest storage request = requests[requestId];
        if (!request.exists) revert RequestNotFound();
        if (request.cancelled) revert RequestCancelledError();
        if (request.executed) revert RequestAlreadyExecuted();
        if (request.expiresAt <= block.timestamp) revert ExpiredRequest();
        if (request.approvalCount < request.requiredApprovals) revert ApprovalThresholdNotMet();

        request.executed = true;
        IERC20(request.token).safeTransfer(request.recipient, request.amount);
        emit RequestExecuted(requestId, msg.sender);
    }

    function cancelRequest(uint256 requestId) external onlyTreasuryOfficer {
        PaymentRequest storage request = requests[requestId];
        if (!request.exists) revert RequestNotFound();
        if (request.executed) revert RequestAlreadyExecuted();
        if (request.cancelled) revert RequestCancelledError();

        request.cancelled = true;
        emit RequestCancelled(requestId, msg.sender);
    }

    function getRequest(uint256 requestId) external view returns (PaymentRequest memory) {
        PaymentRequest memory request = requests[requestId];
        if (!request.exists) revert RequestNotFound();
        return request;
    }
}
