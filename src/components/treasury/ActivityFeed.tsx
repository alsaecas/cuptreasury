import { formatShortDate } from "@/lib/utils";
import type { TreasuryActivity } from "@/types/treasury";

interface ActivityFeedProps {
  activity: TreasuryActivity[];
}

const toneClass = {
  green: "bg-lime-300",
  amber: "bg-amber-300",
  red: "bg-red-300",
  neutral: "bg-zinc-500",
};

export function ActivityFeed({ activity }: ActivityFeedProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-zinc-950 p-5">
      <div>
        <h2 className="text-xl font-bold text-white">Recent activity</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Treasury decisions, reminders, and payment events
        </p>
      </div>

      <div className="mt-5 space-y-4">
        {activity.slice(0, 6).map((item) => (
          <article key={item.id} className="grid grid-cols-[auto_1fr] gap-3">
            <span
              className={`mt-1 h-2.5 w-2.5 rounded-full ${toneClass[item.tone]}`}
              aria-hidden="true"
            />
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-zinc-100">{item.title}</h3>
                <time className="font-mono text-xs text-zinc-600">
                  {formatShortDate(item.createdAt)}
                </time>
              </div>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                {item.detail}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
