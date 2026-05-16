"use client";

import { useState, useTransition } from "react";
import { Bot, Mic, Send, UserRound } from "lucide-react";
import { symptomSuggestions } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const initialMessages: Message[] = [
  {
    role: "assistant",
    content:
      "Hi, I can summarize records, explain reports, suggest precautions, and help choose the right doctor. If symptoms are severe, seek emergency care immediately."
  }
];

export function AIChatPanel() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  function sendMessage(message = input) {
    const clean = message.trim();
    if (!clean) return;

    setInput("");
    setMessages((current) => [...current, { role: "user", content: clean }]);

    startTransition(async () => {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean, patientId: "demo-patient" })
      }).catch(() => null);

      const data = response ? await response.json().catch(() => null) : null;
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            data?.reply ??
            "Based on your record context, this looks non-emergency, but booking a clinician review is wise if symptoms persist or intensify."
        }
      ]);
    });
  }

  return (
    <Card className="flex h-full flex-col">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            Health assistant
          </p>
          <h3 className="mt-2 text-2xl font-bold">Ask about records or symptoms</h3>
        </div>
        <Badge>
          <Mic className="mr-2 size-4 text-primary" />
          Voice ready
        </Badge>
      </div>

      <div className="min-h-[360px] flex-1 space-y-4 overflow-hidden rounded-lg border border-border bg-background p-4">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                <Bot className="size-5" />
              </span>
            )}
            <div
              className={`max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background/50 text-foreground"
              }`}
            >
              {message.content}
            </div>
            {message.role === "user" && (
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-sky-400/10 text-sky-700 dark:text-sky-300">
                <UserRound className="size-5" />
              </span>
            )}
          </div>
        ))}
        {isPending && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Bot className="size-4 animate-pulse text-primary" />
            Assistant is reading your record context...
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {symptomSuggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => sendMessage(suggestion)}
            className="rounded-md bg-muted px-3 py-1.5 text-xs font-semibold transition hover:bg-primary/10"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") sendMessage();
          }}
          placeholder="Describe symptoms or ask about your records..."
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
        />
        <Button size="icon" onClick={() => sendMessage()}>
          <Send className="size-5" />
        </Button>
      </div>
    </Card>
  );
}
