"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const NearbyMapClient = dynamic(
  () => import("@/components/dashboard/nearby-map-client").then((mod) => mod.NearbyMapClient),
  {
    ssr: false,
    loading: () => (
      <Card className="overflow-hidden p-4">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Live Map
            </p>
            <h3 className="mt-2 text-2xl font-bold">Nearby hospitals and doctors</h3>
          </div>
          <Badge>
            <MapPin className="mr-2 size-4 text-primary" />
            Loading
          </Badge>
        </div>
        <div className="h-[400px] rounded-xl border border-border bg-muted" />
      </Card>
    )
  }
);

export function NearbyMap() {
  return <NearbyMapClient />;
}
