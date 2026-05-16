import { Ambulance, PhoneCall, Siren } from "lucide-react";
import { emergencySignals } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function EmergencySOS() {
  return (
    <Card className="relative overflow-hidden border-rose-400/20">
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-md bg-rose-500/10 text-rose-600">
          <Siren className="size-6" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-600">
            Emergency SOS
          </p>
          <h3 className="text-2xl font-bold">Escalate critical symptoms</h3>
        </div>
      </div>

      <div className="mt-6 grid gap-2">
        {emergencySignals.map((signal) => (
          <p key={signal} className="rounded-md bg-rose-500/10 px-3 py-2 text-sm">
            {signal}
          </p>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button variant="danger">
          <PhoneCall className="mr-2 size-4" />
          Call emergency
        </Button>
        <Button variant="secondary">
          <Ambulance className="mr-2 size-4" />
          Find ER nearby
        </Button>
      </div>
    </Card>
  );
}
