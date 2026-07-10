export type MemberRole = "Captain" | "Treasurer" | "Player" | "Fan";

export type ContributionStatus = "Paid" | "Pending" | "Partial";

export type PaymentRequestStatus =
  | "Pending"
  | "Approved"
  | "Prepared"
  | "Rejected"
  | "Paid";

export type ExpenseCategory =
  | "Travel"
  | "Food"
  | "Tickets"
  | "Equipment"
  | "Registration"
  | "Prize Pool"
  | "Other";

export type AiRiskLevel = "Normal" | "Review" | "Unusual";

export type WalletStatus =
  | "Demo WDK adapter"
  | "WDK SDK installed; demo execution"
  | "WDK SDK installed; Node/CI guarded proof"
  | "Real WDK integration";

export interface Member {
  id: string;
  name: string;
  role: MemberRole;
  contributionExpected: number;
  contributionPaid: number;
  avatarInitials: string;
}

export interface Team {
  id: string;
  name: string;
  eventName: string;
  currency: "USDt";
  members: Member[];
}

export interface Approval {
  id: string;
  memberId: string;
  memberName: string;
  role: Extract<MemberRole, "Captain" | "Treasurer">;
  createdAt: string;
}

export interface PaymentRequest {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  requestedByMemberId: string;
  requestedByName: string;
  status: PaymentRequestStatus;
  approvals: Approval[];
  aiRiskLevel: AiRiskLevel;
  aiNote: string;
  createdAt: string;
  paidAt?: string;
  preparedAt?: string;
  receiptId?: string;
}

export interface TreasuryActivity {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
  tone: "green" | "amber" | "red" | "neutral";
}

export interface WalletInfo {
  id: string;
  status: WalletStatus;
  address: string;
  network: string;
  token: "USDt";
  balance: number;
  adapterMode: "demo" | "real";
  custodyModel: "self-custodial";
}

export interface TreasuryState {
  team: Team;
  wallet: WalletInfo;
  requests: PaymentRequest[];
  activity: TreasuryActivity[];
}

export interface PaymentRequestDraft {
  title: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  requestedByMemberId: string;
}
