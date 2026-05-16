"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { io, type Socket } from "socket.io-client";
import { CalendarDays, CheckCircle2, Radio, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeedbackToast, type FeedbackToastState } from "@/components/ui/feedback-toast";

type SlotState = {
  id: string;
  doctorId: string;
  time: string;
  available: boolean;
  heldBy?: string;
};

type DoctorSelection = {
  id: string;
  name: string;
};

export function AppointmentBoard() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorSelection | null>(null);
  const [slots, setSlots] = useState<SlotState[]>([]);
  const [status, setStatus] = useState("Loading live slots");
  const [feedback, setFeedback] = useState<FeedbackToastState>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const showFeedback = useCallback((nextFeedback: FeedbackToastState) => {
    setFeedback(nextFeedback);
    window.setTimeout(() => setFeedback(null), 3600);
  }, []);

  const loadSlots = useCallback(
    async (doctorId = selectedDoctor?.id) => {
      setIsLoadingSlots(true);
      const params = new URLSearchParams({ date: selectedDate });
      if (doctorId) params.set("doctorId", doctorId);

      try {
        const response = await fetch(`/api/slots?${params.toString()}`);
        const data = await response.json();
        setSlots(data.slots ?? []);
        if (data.doctor) setSelectedDoctor({ id: data.doctor.id, name: data.doctor.name });
        setStatus(data.doctor ? `Live slots for ${data.doctor.name}` : "No doctor slots found");
      } catch {
        setSlots([]);
        setStatus("Could not load slots");
        showFeedback({ type: "error", message: "Could not load appointment slots." });
      } finally {
        setIsLoadingSlots(false);
      }
    },
    [selectedDate, selectedDoctor?.id, showFeedback]
  );

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  useEffect(() => {
    function handleDoctorSelected(event: Event) {
      const detail = (event as CustomEvent<DoctorSelection>).detail;
      setSelectedDoctor({ id: detail.id, name: detail.name });
      setSelectedSlot(null);
      loadSlots(detail.id);
    }

    window.addEventListener("meditrack:doctor-selected", handleDoctorSelected);
    return () => window.removeEventListener("meditrack:doctor-selected", handleDoctorSelected);
  }, [loadSlots]);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    const socket: Socket = io(url, {
      autoConnect: true,
      transports: ["websocket", "polling"]
    });
    socketRef.current = socket;

    socket.on("connect", () => setStatus((current) => current || "Connected to live slot engine"));
    socket.on("connect_error", () => setStatus("Realtime unavailable; database booking still works"));
    socket.on("slot:snapshot", ({ holds, booked }: { holds: Array<{ slotId: string; userId: string }>; booked: string[] }) => {
      setSlots((current) =>
        current.map((slot) => {
          const hold = holds.find((item) => item.slotId === slot.id);
          if (booked.includes(slot.id)) return { ...slot, available: false, heldBy: undefined };
          if (hold) return { ...slot, available: false, heldBy: hold.userId };
          return slot;
        })
      );
    });
    socket.on("slot:booked", ({ slotId }: { slotId: string }) => {
      setSlots((current) =>
        current.map((slot) => (slot.id === slotId ? { ...slot, available: false, heldBy: undefined } : slot))
      );
    });
    socket.on("slot:updated", ({ slotId, available }: { slotId: string; available: boolean }) => {
      setSlots((current) =>
        current.map((slot) => (slot.id === slotId ? { ...slot, available, heldBy: undefined } : slot))
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
    socket.on("slot:unavailable", ({ slotId }: { slotId: string }) => {
      setSlots((current) =>
        current.map((slot) => (slot.id === slotId ? { ...slot, available: false, heldBy: undefined } : slot))
      );
      showFeedback({ type: "error", message: "That slot is no longer available." });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [showFeedback]);

  function holdSlot(slotId: string) {
    socketRef.current?.emit("slot:hold", { slotId, userId: "current-patient", date: selectedDate });
    setSelectedSlot(slotId);
    setSlots((current) =>
      current.map((slot) =>
        slot.id === slotId ? { ...slot, available: false, heldBy: "you" } : slot
      )
    );
  }

  function bookSlot() {
    if (!selectedSlot) return;
    const slot = slots.find((item) => item.id === selectedSlot);
    if (!slot) return;

    if (!window.confirm(`Confirm appointment for ${slot.time}?`)) return;

    startTransition(async () => {
      try {
        const response = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doctorId: slot.doctorId,
            slotId: selectedSlot,
            reason: "Patient requested consultation"
          })
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to book appointment");
        }

        setSelectedSlot(null);
        setStatus("Appointment confirmed and saved");
        showFeedback({ type: "success", message: "Appointment booked and saved." });
        socketRef.current?.emit("slot:book", { slotId: selectedSlot, userId: "current-patient" });
        await loadSlots(slot.doctorId);
        window.dispatchEvent(new CustomEvent("meditrack:data-refresh"));
      } catch (error) {
        showFeedback({
          type: "error",
          message: error instanceof Error ? error.message : "Unable to book appointment."
        });
        await loadSlots(slot.doctorId);
      }
    });
  }

  return (
    <Card>
      <FeedbackToast feedback={feedback} />
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
            }}
            className="w-full rounded-md border border-border bg-background py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <Button variant="secondary" onClick={() => loadSlots()}>
          <RefreshCw className={cn("mr-2 size-4", isLoadingSlots && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {slots.length === 0 && (
          <p className="col-span-full rounded-md border border-border bg-background p-4 text-sm text-muted-foreground">
            {isLoadingSlots ? "Loading slots..." : "No slots available for this date."}
          </p>
        )}
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
