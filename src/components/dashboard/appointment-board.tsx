"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { io, type Socket } from "socket.io-client";
import { CalendarDays, CheckCircle2, Radio, RefreshCw } from "lucide-react";
import { appointmentSlots } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SlotState = {
  id: string;
  time: string;
  available: boolean;
  heldBy?: string;
};

export function AppointmentBoard() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotState[]>(appointmentSlots);
  const [status, setStatus] = useState("Realtime ready");
  const [isPending, startTransition] = useTransition();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    const socket: Socket = io(url, {
      autoConnect: true,
      transports: ["websocket", "polling"]
    });
    socketRef.current = socket;

    socket.on("connect", () => setStatus("Connected to live slot engine"));
    socket.on("connect_error", () => setStatus("Demo mode: socket server not running"));
    socket.on("slot:booked", ({ slotId }: { slotId: string }) => {
      setSlots((current) =>
        current.map((slot) => (slot.id === slotId ? { ...slot, available: false } : slot))
      );
    });
    socket.on("slot:held", ({ slotId, userId }: { slotId: string; userId: string }) => {
      setSlots((current) =>
        current.map((slot) =>
          slot.id === slotId ? { ...slot, heldBy: userId, available: false } : slot
        )
      );
    });
    socket.on("slot:released", ({ slotId }: { slotId: string }) => {
      setSlots((current) =>
        current.map((slot) =>
          slot.id === slotId ? { ...slot, heldBy: undefined, available: true } : slot
        )
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  function holdSlot(slotId: string) {
    socketRef.current?.emit("slot:hold", { slotId, userId: "demo-patient", date: selectedDate });
    setSelectedSlot(slotId);
    setSlots((current) =>
      current.map((slot) =>
        slot.id === slotId ? { ...slot, available: false, heldBy: "you" } : slot
      )
    );
  }

  function bookSlot() {
    if (!selectedSlot) return;

    startTransition(async () => {
      await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: "dr-ira",
          slotId: selectedSlot,
          date: selectedDate,
          reason: "AI symptom triage appointment"
        })
      }).catch(() => null);

      setSlots((current) =>
        current.map((slot) =>
          slot.id === selectedSlot ? { ...slot, available: false, heldBy: undefined } : slot
        )
      );
      setStatus("Appointment confirmed and broadcast");
      socketRef.current?.emit("slot:book", { slotId: selectedSlot, userId: "demo-patient" });
    });
  }

  return (
    <Card>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Live appointments
          </p>
          <h3 className="mt-2 text-2xl font-bold">Date-wise slot booking</h3>
        </div>
        <Badge>
          <Radio className="mr-2 size-4" />
          {status}
        </Badge>
      </div>

      <label className="block text-sm font-semibold text-muted-foreground">
        Select appointment date
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => {
              setSelectedDate(event.target.value);
              setSelectedSlot(null);
              setSlots(appointmentSlots);
            }}
            className="w-full rounded-md border border-border bg-background py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <Button variant="secondary" onClick={() => setSlots(appointmentSlots)}>
          <RefreshCw className="mr-2 size-4" />
          Refresh
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {slots.map((slot) => {
          const selected = selectedSlot === slot.id;
          return (
            <button
              key={slot.id}
              disabled={!slot.available && slot.heldBy !== "you"}
              onClick={() => holdSlot(slot.id)}
              className={cn(
                "rounded-md border p-4 text-left transition duration-200",
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background hover:bg-muted",
                !slot.available && slot.heldBy !== "you" && "cursor-not-allowed opacity-40"
              )}
            >
              <p className="text-xl font-bold">{slot.time}</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                {slot.available ? "Available" : slot.heldBy === "you" ? "Held for you" : "Booked"}
              </p>
            </button>
          );
        })}
      </div>

      <Button
        className="mt-6 w-full"
        disabled={!selectedSlot || isPending}
        onClick={bookSlot}
      >
        <CheckCircle2 className="mr-2 size-5" />
        {isPending ? "Confirming securely..." : "Confirm appointment"}
      </Button>
    </Card>
  );
}
