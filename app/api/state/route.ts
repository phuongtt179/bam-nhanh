import { NextResponse } from "next/server";
import { getGameState } from "@/lib/store";

export async function GET() {
  const state = getGameState();
  return NextResponse.json(state);
}
