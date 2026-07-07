import type {
  ContributionStatus,
  MemberRole,
  PaymentRequest,
  TreasuryState,
} from "@/types/treasury";

export function getContributionStatus(
  expected: number,
  paid: number,
): ContributionStatus {
  if (paid >= expected) {
    return "Paid";
  }

  if (paid > 0) {
    return "Partial";
  }

  return "Pending";
}

export function canApprove(role: MemberRole): boolean {
  return role === "Captain" || role === "Treasurer";
}

export function requiredApprovals(amount: number): number {
  return amount > 100 ? 2 : 1;
}

export function remainingApprovals(request: PaymentRequest): number {
  return Math.max(requiredApprovals(request.amount) - request.approvals.length, 0);
}

export function hasEnoughApprovals(request: PaymentRequest): boolean {
  return remainingApprovals(request) === 0;
}

export function canSimulatePayment(request: PaymentRequest): boolean {
  return (
    request.status !== "Paid" &&
    request.status !== "Rejected" &&
    hasEnoughApprovals(request)
  );
}

export function getPendingContributions(state: TreasuryState): number {
  return state.team.members.reduce(
    (total, member) =>
      total + Math.max(member.contributionExpected - member.contributionPaid, 0),
    0,
  );
}

export function getPendingContributionMembers(state: TreasuryState): string[] {
  return state.team.members
    .filter((member) => member.contributionPaid < member.contributionExpected)
    .map((member) => member.name);
}

export function getPendingRequests(state: TreasuryState): PaymentRequest[] {
  return state.requests.filter((request) => request.status === "Pending");
}

export function getApprovedUnpaidRequests(
  state: TreasuryState,
): PaymentRequest[] {
  return state.requests.filter((request) => canSimulatePayment(request));
}

export function getRoleDescription(role: MemberRole): string {
  switch (role) {
    case "Captain":
      return "Can create and approve requests";
    case "Treasurer":
      return "Can approve and execute payments";
    case "Player":
      return "Can contribute and view expenses";
    case "Fan":
      return "Can contribute and view expenses";
  }
}
