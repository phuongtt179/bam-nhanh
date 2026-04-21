import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher-server";
import { startGame } from "@/lib/store";

export async function POST() {
  startGame();
  await pusherServer.trigger("game-channel", "game-start", {
    startedAt: Date.now(),
  });
  return NextResponse.json({ ok: true });
}
