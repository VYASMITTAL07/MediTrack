"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { MapPin, ShieldCheck, Star, Video } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type DoctorCard = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  distance: string;
  experience: number;
  fee: number;
  availability: string;
  nextSlot: string;
  emergency: boolean;
  image: string;
  clinic: string;
  verified: boolean;
};

export function DoctorFinder() {
  const [doctors, setDoctors] = useState<DoctorCard[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState("All specializations");

  useEffect(() => {
    let mounted = true;
    fetch("/api/doctors")
      .then((response) => response.json())
      .then((data) => {
        if (mounted) setDoctors(data.doctors ?? []);
      })
      .catch(() => {
        if (mounted) setDoctors([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredDoctors =
    selectedSpecialty === "All specializations"
      ? doctors
      : doctors.filter((doctor) => doctor.specialty === selectedSpecialty);

  function selectDoctor(doctor: DoctorCard) {
    window.dispatchEvent(new CustomEvent("meditrack:doctor-selected", { detail: doctor }));
  }

  return (
    <Card>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Doctors
          </p>
          <h3 className="mt-2 text-2xl font-bold">Available specialists</h3>
        </div>
        <select
          value={selectedSpecialty}
          onChange={(event) => setSelectedSpecialty(event.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
        >
          <option>All specializations</option>
          <option>Cardiology</option>
          <option>Neurology</option>
          <option>Pulmonology</option>
        </select>
      </div>

      <div className="grid gap-3">
        {filteredDoctors.length === 0 && (
          <p className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
            No doctors are available yet.
          </p>
        )}
        {filteredDoctors.map((doctor) => (
          <article key={doctor.id} className="rounded-lg border border-border bg-background p-3">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-md sm:h-32 sm:w-32">
                <Image src={doctor.image} alt={doctor.name} fill className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-bold">{doctor.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {doctor.specialty} at {doctor.clinic}
                    </p>
                  </div>
                  <Badge className="text-emerald-700 dark:text-emerald-300">
                    <ShieldCheck className="mr-1.5 size-3.5" />
                    Verified
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                  <Badge>
                    <Star className="mr-1.5 size-3.5 text-amber-500" />
                    {doctor.rating} ({doctor.reviews})
                  </Badge>
                  <Badge>
                    <MapPin className="mr-1.5 size-3.5" />
                    {doctor.distance}
                  </Badge>
                  <Badge>{doctor.experience} yrs</Badge>
                  <Badge>{formatCurrency(doctor.fee)}</Badge>
                  {doctor.emergency && <Badge className="text-rose-700 dark:text-rose-300">Emergency</Badge>}
                </div>

                <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <p className="text-sm">
                    <span className="font-bold text-primary">{doctor.availability}</span>
                    <span className="text-muted-foreground"> - Next {doctor.nextSlot}</span>
                  </p>
                  <Button size="sm" onClick={() => selectDoctor(doctor)}>
                    <Video className="mr-2 size-4" />
                    Select doctor
                  </Button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}
