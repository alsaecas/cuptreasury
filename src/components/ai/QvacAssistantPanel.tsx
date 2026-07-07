"use client";

import { Bot, Send } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  qvacAssistantStatus,
  qvacTreasuryAssistant,
} from "@/lib/qvac/qvacTreasuryAssistant";
import type { TreasuryState } from "@/types/treasury";

interface QvacAssistantPanelProps {
  state: TreasuryState;
}

const suggestedPrompts = [
  "Summarize the treasury",
  "Who still owes money?",
  "Is any payment request unusual?",
  "Write a WhatsApp reminder for unpaid members",
  "Explain pending approvals",
];

export function QvacAssistantPanel({ state }: QvacAssistantPanelProps) {
  const [question, setQuestion] = useState("Who still owes money?");
  const [submittedQuestion, setSubmittedQuestion] = useState(
    "Summarize the treasury",
  );
  const answer = useMemo(
    () =>
      qvacTreasuryAssistant.answerTreasuryQuestion(submittedQuestion, state),
    [state, submittedQuestion],
  );

  function ask(prompt: string) {
    setQuestion(prompt);
    setSubmittedQuestion(prompt);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!question.trim()) {
      return;
    }

    setSubmittedQuestion(question);
  }

  return (
    <section className="rounded-lg border border-white/10 bg-zinc-950 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge tone="blue">{qvacAssistantStatus.label}</Badge>
          <h2 className="mt-4 text-xl font-bold text-white">
            Local treasury assistant
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            No cloud AI API. No completed QVAC SDK inference in this build.
          </p>
        </div>
        <Bot className="text-cyan-200" size={28} aria-hidden="true" />
      </div>

      <div className="mt-5 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4">
        <p className="text-sm font-semibold text-cyan-100">Assistant answer</p>
        <p className="mt-2 text-sm leading-6 text-cyan-50/85">{answer}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => ask(prompt)}
            className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs font-semibold text-zinc-300 transition-colors hover:bg-white/10"
          >
            {prompt}
          </button>
        ))}
      </div>

      <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
        <label htmlFor="qvac-question" className="sr-only">
          Ask treasury question
        </label>
        <textarea
          id="qvac-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={3}
          className="resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm text-white outline-none focus:border-cyan-200"
        />
        <Button
          type="submit"
          variant="secondary"
          icon={<Send size={16} aria-hidden="true" />}
        >
          Ask Assistant
        </Button>
      </form>
    </section>
  );
}
