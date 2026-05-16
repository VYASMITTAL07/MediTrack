"use client";

import "leaflet/dist/leaflet.css";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hospital, MapPin } from "lucide-react";

const hospitalIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const places = [
  {
    name: "City Hospital",
    lat: 28.6139,
    lng: 77.209,
    type: "Hospital"
  },
  {
    name: "Care Clinic",
    lat: 28.6239,
    lng: 77.219,
    type: "Clinic"
  },
  {
    name: "Dr. Sharma",
    lat: 28.6039,
    lng: 77.199,
    type: "Doctor"
  }
];

export function NearbyMap() {
  return (
    <Card className="overflow-hidden p-4">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Live Map
          </p>

          <h3 className="mt-2 text-2xl font-bold">
            Nearby hospitals and doctors
          </h3>
        </div>

        <Badge>
          <MapPin className="mr-2 size-4 text-primary" />
          Live
        </Badge>
      </div>

      <div className="overflow-hidden rounded-xl">
        <MapContainer
          center={[28.6139, 77.209]}
          zoom={13}
          style={{ height: "400px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {places.map((place, index) => (
            <Marker
              key={index}
              position={[place.lat, place.lng]}
              icon={hospitalIcon}
            >
              <Popup>
                <div>
                  <strong>{place.name}</strong>
                  <br />
                  {place.type}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {places.map((place, index) => (
          <div
            key={index}
            className="rounded-lg border border-border bg-background p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">{place.name}</p>

                <p className="text-sm text-muted-foreground">
                  {place.type}
                </p>
              </div>

              <Badge>
                <Hospital className="mr-1.5 size-3.5 text-rose-500" />
                Nearby
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}