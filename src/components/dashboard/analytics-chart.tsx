"use client";

import { motion } from "framer-motion";
import { analyticsSeries } from "@/lib/data";
import { Card } from "@/components/ui/card";

export function AnalyticsChart() {
  const max = 100;

  return (
    <Card>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            Health analytics
          </p>
          <h3 className="mt-2 text-2xl font-bold">AI health trajectory</h3>
        </div>
        <div className="flex gap-3 text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-teal-300" />
            Health
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-sky-300" />
            Adherence
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-rose-300" />
            Risk
          </span>
        </div>
      </div>

      <div className="mt-8 flex h-64 items-end gap-3">
        {analyticsSeries.map((point, index) => (
          <div key={point.label} className="flex flex-1 flex-col items-center gap-3">
            <div className="flex h-52 w-full items-end justify-center gap-1 rounded-lg border border-border bg-background p-2">
              <Bar value={point.health} max={max} color="bg-teal-300" delay={index * 0.04} />
              <Bar value={point.adherence} max={max} color="bg-sky-300" delay={index * 0.05} />
              <Bar value={point.risk} max={max} color="bg-rose-300" delay={index * 0.06} />
            </div>
            <span className="text-xs font-semibold text-muted-foreground">{point.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Bar({
  value,
  max,
  color,
  delay
}: {
  value: number;
  max: number;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ height: 0 }}
      whileInView={{ height: `${(value / max) * 100}%` }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`w-3 rounded-full ${color}`}
    />
  );
}
