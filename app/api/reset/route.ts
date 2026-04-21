import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher-server";
import { resetGame } from "@/lib/store";

export async function POST() {
  resetGame();
  await pusherServer.trigger("game-channel", "game-reset", {});
  return NextResponse.json({ ok: true });
}
