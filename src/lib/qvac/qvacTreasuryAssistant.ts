import {
  getPendingContributionMembers,
  getPendingContributions,
  getPendingRequests,
  remainingApprovals,
} from "@/lib/treasury/treasuryRules";
import { formatUsdT } from "@/lib/utils";
import type {
  AiRiskLevel,
  ExpenseCategory,
  PaymentRequest,
  TreasuryState,
} from "@/types/treasury";

export interface ExpenseRiskInput {
  title: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
}

export interface ExpenseRiskResult {
  level: AiRiskLevel;
  note: string;
}

export interface QvacAssistantStatus {
  label: "QVAC-ready local assistant adapter";
  sdkInstalled: false;
  realQvacInference: false;
  usesCloudAi: false;
  summary: string;
}

export const qvacAssistantStatus: QvacAssistantStatus = {
  label: "QVAC-ready local assistant adapter",
  sdkInstalled: false,
  realQvacInference: false,
  usesCloudAi: false,
  summary:
    "Current assistant answers are deterministic and generated from local treasury state only.",
};

function unpaidNames(state: TreasuryState): string {
  const names = getPendingContributionMembers(state);

  if (names.length === 0) {
    return "everyone is paid up";
  }

  if (names.length === 1) {
    return `${names[0]} still needs to contribute`;
  }

  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)} still need to contribute`;
}

export const qvacTreasuryAssistant = {
  summarizeTreasury(state: TreasuryState): string {
    const pendingRequests = getPendingRequests(state);
    const pendingMembers = getPendingContributionMembers(state);
    const nextAction =
      pendingRequests.find((request) => remainingApprovals(request) > 0) ??
      pendingRequests[0];

    return `${state.team.name} has ${formatUsdT(state.wallet.balance)} available. ${pendingRequests.length} expenses are pending approval. ${pendingMembers.join(" and ") || "No members"} still need to contribute ${pendingMembers.length > 0 ? "50 USDt each" : "today"}. The next suggested action is ${
      nextAction
        ? `to approve or reject the ${nextAction.title.toLowerCase()} request`
        : "to keep the treasury ready for match day"
    }.`;
  },

  detectExpenseRisk(
    input: ExpenseRiskInput,
    state: TreasuryState,
  ): ExpenseRiskResult {
    const title = input.title.toLowerCase();
    const description = input.description.toLowerCase();

    if (input.amount > state.wallet.balance * 0.75) {
      return {
        level: "Unusual",
        note: "This would use most of the current treasury balance. Ask for extra context before approval.",
      };
    }

    if (
      input.category === "Other" ||
      title.includes("cash") ||
      description.includes("cash")
    ) {
      return {
        level: "Review",
        note: "Category or description is broad. Request a receipt or clearer vendor details.",
      };
    }

    if (input.category === "Food" && input.amount >= 75) {
      return {
        level: "Review",
        note: "Food spend is near the review band. Confirm attendees before paying.",
      };
    }

    if (input.amount > 200 && input.category !== "Registration") {
      return {
        level: "Review",
        note: "Amount is higher than normal team expenses. Captain and Treasurer should both inspect it.",
      };
    }

    return {
      level: "Normal",
      note: "Amount and category look consistent with the team treasury pattern.",
    };
  },

  generateReminderMessage(state: TreasuryState): string {
    const pendingMembers = state.team.members.filter(
      (member) => member.contributionPaid < member.contributionExpected,
    );

    const pendingRequests = getPendingRequests(state);

    const unpaidLines =
      pendingMembers.length === 0
        ? ["Everyone is paid up for contributions."]
        : pendingMembers.map((member) => {
            const amount =
              member.contributionExpected - member.contributionPaid;
            return `${member.name}: ${formatUsdT(amount)} owed`;
          });

    const requestLines =
      pendingRequests.length === 0
        ? ["No pending expense approvals."]
        : pendingRequests.map((request) => {
            const remaining = remainingApprovals(request);
            return remaining === 0
              ? `${request.title} (${formatUsdT(request.amount)}) is ready for payment.`
              : `${request.title} needs ${remaining} more approval${remaining === 1 ? "" : "s"}.`;
          });

    const allLines = [
      `${state.team.name} treasury update:`,
      "",
      "Contributions:",
      ...unpaidLines,
      "",
      "Expenses:",
      ...requestLines,
      "",
      "Please settle before match day.",
    ];

    return allLines.join("\n");
  },

  answerTreasuryQuestion(question: string, state: TreasuryState): string {
    const normalized = question.toLowerCase();
    const pendingRequests = getPendingRequests(state);
    const pendingContributionTotal = getPendingContributions(state);
    const reviewRequests = state.requests.filter(
      (request) => request.aiRiskLevel !== "Normal",
    );

    if (normalized.includes("owe") || normalized.includes("contribute")) {
      return `${unpaidNames(state)}. Total pending contributions are ${formatUsdT(pendingContributionTotal)}.`;
    }

    if (normalized.includes("unusual") || normalized.includes("risk")) {
      if (reviewRequests.length === 0) {
        return "No payment request is currently flagged above Normal risk.";
      }

      return reviewRequests
        .map((request) => `${request.title}: ${request.aiRiskLevel}. ${request.aiNote}`)
        .join(" ");
    }

    if (normalized.includes("reminder") || normalized.includes("whatsapp")) {
      return this.generateReminderMessage(state);
    }

    if (normalized.includes("approval")) {
      if (pendingRequests.length === 0) {
        return "There are no pending approvals. Approved match-day requests can move to PaymentIntent and no-broadcast receipt preparation.";
      }

      return pendingRequests
        .map(
          (request) =>
            `${request.title} needs ${remainingApprovals(request)} more approval${remainingApprovals(request) === 1 ? "" : "s"}.`,
        )
        .join(" ");
    }

    return this.summarizeTreasury(state);
  },
};

export function getPaymentRiskSummary(request: PaymentRequest): string {
  return `${request.aiRiskLevel}: ${request.aiNote}`;
}

// Real QVAC integration path:
// 1. Install @qvac/sdk in a runtime that can load local models on the user's device.
// 2. Load a small local model through QVAC SDK.
// 3. Keep prompts and treasury data in the local runtime, then replace deterministic answers
//    above with local QVAC inference outputs that preserve the same signatures.
