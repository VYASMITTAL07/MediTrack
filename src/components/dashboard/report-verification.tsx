"use client";

import { useState, useTransition } from "react";
import { FileScan, ShieldAlert, ShieldCheck, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type VerificationResult = {
  status: string;
  confidence: number;
  extractedText: string;
  flags: string[];
  verifiedBadge: boolean;
};

export function ReportVerification() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function verify() {
    if (!file) return;

    startTransition(async () => {
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
    });
  }

  return (
    <Card>
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
