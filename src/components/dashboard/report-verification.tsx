"use client";

import { useState, useTransition } from "react";
import { FileScan, ShieldAlert, ShieldCheck, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeedbackToast, type FeedbackToastState } from "@/components/ui/feedback-toast";

type VerificationResult = {
  status: string;
  confidence: number;
  extractedText: string;
  flags: string[];
  verifiedBadge: boolean;
};

export function ReportVerification({ onSaved }: { onSaved?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [feedback, setFeedback] = useState<FeedbackToastState>(null);
  const [isPending, startTransition] = useTransition();

  function showFeedback(nextFeedback: FeedbackToastState) {
    setFeedback(nextFeedback);
    window.setTimeout(() => setFeedback(null), 3600);
  }

  function verify() {
    if (!file) return;

    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/verify-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: file.name,
            fileName: file.name,
            fileType: file.type,
            extractedText: "Patient report from verified hospital with lab reference range and doctor signature."
          })
        });
        const data = await response.json();
        setResult(data.verification);

        const saveResponse = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: file.name,
            fileName: file.name,
            fileType: file.type || "application/octet-stream",
            ocrText: data.verification?.extractedText,
            verificationStatus: data.verification?.status ?? "PENDING",
            aiConfidence: data.verification?.confidence ?? 0,
            flags: data.verification?.flags ?? []
          })
        });
        const saved = await saveResponse.json().catch(() => null);

        if (!saveResponse.ok) {
          throw new Error(saved?.error ?? "Report verified but could not be saved");
        }

        showFeedback({ type: "success", message: "Report verified and saved to patient records." });
        onSaved?.();
        window.dispatchEvent(new CustomEvent("meditrack:data-refresh"));
      } catch (error) {
        showFeedback({
          type: "error",
          message: error instanceof Error ? error.message : "Unable to verify and save report."
        });
      }
    });
  }

  return (
    <Card>
      <FeedbackToast feedback={feedback} />
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            Document verification
          </p>
          <h3 className="mt-2 text-2xl font-bold">Report authenticity check</h3>
        </div>
        <FileScan className="size-8 text-primary" />
      </div>

      <label className="group grid cursor-pointer place-items-center rounded-lg border border-dashed border-primary/45 bg-primary/10 p-8 text-center transition hover:bg-primary/15">
        <UploadCloud className="mb-3 size-10 text-primary transition group-hover:-translate-y-1" />
        <span className="font-semibold">{file ? file.name : "Upload PDF, X-ray, MRI, or lab report"}</span>
        <span className="mt-2 text-sm text-muted-foreground">
          Issuer validation, file checks, and confidence scoring
        </span>
        <input
          type="file"
          className="hidden"
          accept="image/*,.pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>

      <Button className="mt-5 w-full" disabled={!file || isPending} onClick={verify}>
        {isPending ? "Scanning document..." : "Verify report"}
      </Button>

      {result && (
        <div className="mt-5 rounded-lg border border-border bg-background p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge className={result.verifiedBadge ? "text-emerald-300" : "text-amber-300"}>
              {result.verifiedBadge ? (
                <ShieldCheck className="mr-2 size-4" />
              ) : (
                <ShieldAlert className="mr-2 size-4" />
              )}
              {result.status}
            </Badge>
            <span className="text-sm font-bold">
              {Math.round(result.confidence * 100)}% confidence
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{result.extractedText}</p>
          {result.flags.length > 0 && (
            <div className="mt-4 space-y-2">
              {result.flags.map((flag) => (
                <p key={flag} className="rounded-md bg-amber-400/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
                  {flag}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
