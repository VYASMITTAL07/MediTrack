import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

type SlotHold = {
  slotId: string;
  userId: string;
  expiresAt: number;
};

const holds = new Map<string, SlotHold>();
const booked = new Set<string>();

await app.prepare();

const httpServer = createServer((request, response) => {
  handle(request, response);
});

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    credentials: true
  }
});

io.on("connection", (socket) => {
  socket.emit("slot:snapshot", {
    holds: Array.from(holds.values()),
    booked: Array.from(booked)
  });

  socket.on("slot:hold", ({ slotId, userId, date }) => {
    if (!slotId || booked.has(slotId)) return;

    const existing = holds.get(slotId);
    if (existing && existing.userId !== userId && existing.expiresAt > Date.now()) {
      socket.emit("slot:unavailable", { slotId });
      return;
    }

    const hold = {
      slotId,
      userId,
      expiresAt: Date.now() + 90_000
    };
    holds.set(slotId, hold);
    io.emit("slot:held", { ...hold, date });

    setTimeout(() => {
      const current = holds.get(slotId);
      if (current?.expiresAt === hold.expiresAt && !booked.has(slotId)) {
        holds.delete(slotId);
        io.emit("slot:released", { slotId });
      }
    }, 90_000);
  });

  socket.on("slot:book", ({ slotId, userId }) => {
    if (!slotId) return;

    const hold = holds.get(slotId);
    if (hold && hold.userId !== userId && hold.expiresAt > Date.now()) {
      socket.emit("slot:unavailable", { slotId });
      return;
    }

    holds.delete(slotId);
    booked.add(slotId);
    const bookedAt = new Date().toISOString();
    io.emit("slot:booked", { slotId, userId, bookedAt });
    io.emit("slot:updated", { slotId, available: false, bookedAt });
  });

  socket.on("slot:release", ({ slotId, userId }) => {
    const hold = holds.get(slotId);
    if (hold?.userId === userId) {
      holds.delete(slotId);
      io.emit("slot:released", { slotId });
    }
  });
});

httpServer.listen(port, () => {
  console.log(`MediTrack ready on http://${hostname}:${port}`);
});
