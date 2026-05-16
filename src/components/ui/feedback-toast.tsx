import { CheckCircle2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeedbackToastState = {
  type: "success" | "error";
  message: string;
} | null;

export function FeedbackToast({ feedback }: { feedback: FeedbackToastState }) {
  if (!feedback) return null;

  const Icon = feedback.type === "success" ? CheckCircle2 : TriangleAlert;

  return (
    <div
      className={cn(
        "fixed right-4 top-24 z-[70] flex max-w-sm items-center gap-3 rounded-md border bg-background px-4 py-3 text-sm shadow-lg",
        feedback.type === "success" ? "border-emerald-300 text-emerald-700" : "border-rose-300 text-rose-700"
      )}
      role="status"
    >
      <Icon className="size-4 shrink-0" />
      <span>{feedback.message}</span>
    </div>
  );
}
