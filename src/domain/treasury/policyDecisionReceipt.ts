export type PolicyDecision = "ALLOW" | "DENY";

export interface PolicyDecisionTraceEntry {
  rule: string;
  passed: boolean;
  detail: string;
}

export interface PolicyDecisionReceipt {
  intentId: string;
  decision: PolicyDecision;
  policyId: string;
  reason: string;
  matchedRule?: string;
  trace: PolicyDecisionTraceEntry[];
  evaluatedAt: string;
}

export interface RequestPolicyDecisionReceipt
  extends Omit<PolicyDecisionReceipt, "intentId"> {
  requestId: string;
}
