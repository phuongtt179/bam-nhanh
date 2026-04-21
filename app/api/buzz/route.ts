import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher-server";
import { recordBuzz } from "@/lib/store";

export async function POST(req: NextRequest) {
  const { name } = await req.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Thiếu tên học sinh" }, { status: 400 });
  }

  const entry = recordBuzz(name.trim());

  if (!entry) {
    return NextResponse.json(
      { error: "Game chưa bắt đầu hoặc bạn đã bấm rồi" },
      { status: 409 }
    );
  }

  await pusherServer.trigger("game-channel", "student-buzz", entry);

  return NextResponse.json({ ok: true, entry });
}
