"use client";

import { Send, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type {
  ExpenseCategory,
  Member,
  PaymentRequestDraft,
} from "@/types/treasury";

const categories: ExpenseCategory[] = [
  "Travel",
  "Food",
  "Tickets",
  "Equipment",
  "Registration",
  "Prize Pool",
  "Other",
];

interface CreateRequestModalProps {
  isOpen: boolean;
  members: Member[];
  defaultMemberId: string;
  onClose: () => void;
  onCreate: (draft: PaymentRequestDraft) => void;
}

export function CreateRequestModal({
  isOpen,
  members,
  defaultMemberId,
  onClose,
  onCreate,
}: CreateRequestModalProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Travel");
  const [description, setDescription] = useState("");
  const [requestedByMemberId, setRequestedByMemberId] =
    useState(defaultMemberId);

  if (!isOpen) {
    return null;
  }

  function resetForm() {
    setTitle("");
    setAmount("");
    setCategory("Travel");
    setDescription("");
    setRequestedByMemberId(defaultMemberId);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(amount);

    if (!title.trim() || !description.trim() || parsedAmount <= 0) {
      return;
    }

    onCreate({
      title: title.trim(),
      amount: parsedAmount,
      category,
      description: description.trim(),
      requestedByMemberId,
    });
    resetForm();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 py-6">
      <section className="w-full max-w-2xl rounded-lg border border-white/10 bg-zinc-950 p-5 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge tone="green">Local deterministic risk note</Badge>
            <h2 className="mt-4 text-2xl font-black text-white">
              Create payment request
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              New requests start as Pending and follow team approval rules.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close create request"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="min-h-11 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-lime-300"
              placeholder="Away match bus deposit"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-300">
                Amount
              </span>
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
                min="1"
                step="0.01"
                type="number"
                className="min-h-11 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-lime-300"
                placeholder="120"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-300">
                Category
              </span>
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as ExpenseCategory)
                }
                className="min-h-11 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-lime-300"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">
              Requested by
            </span>
            <select
              value={requestedByMemberId}
              onChange={(event) => setRequestedByMemberId(event.target.value)}
              className="min-h-11 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-lime-300"
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} - {member.role}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">
              Description
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              rows={4}
              className="resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm text-white outline-none focus:border-lime-300"
              placeholder="What is this for, and who benefits?"
            />
          </label>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Send size={16} aria-hidden="true" />}
            >
              Create Request
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
