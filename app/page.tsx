"use client";

import { useEffect, useRef, useState } from "react";
import PusherClient from "pusher-js";

type GamePhase = "waiting" | "ready" | "buzzed" | "too-late";

export default function StudentPage() {
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<GamePhase>("waiting");
  const [rank, setRank] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [totalBuzzed, setTotalBuzzed] = useState(0);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const pusher = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! }
    );
    const channel = pusher.subscribe("game-channel");

    channel.bind("game-start", (data: { startedAt: number }) => {
      startedAtRef.current = data.startedAt;
      setPhase("ready");
      setRank(null);
      setElapsed(null);
      setTotalBuzzed(0);
    });

    channel.bind("student-buzz", (data: { name: string; time: number }) => {
      setTotalBuzzed((n) => n + 1);
      // Track our own rank
      if (data.name === name.trim()) {
        setElapsed(data.time);
      }
    });

    channel.bind("game-reset", () => {
      startedAtRef.current = null;
      setPhase("waiting");
      setRank(null);
      setElapsed(null);
      setTotalBuzzed(0);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("game-channel");
      pusher.disconnect();
    };
  }, [name]);

  // Update rank whenever totalBuzzed changes and we've buzzed
  useEffect(() => {
    if (phase === "buzzed" && elapsed !== null) {
      // rank is determined by totalBuzzed at the time of our buzz — tracked in handleBuzz
    }
  }, [phase, elapsed]);

  async function handleBuzz() {
    const trimmed = name.trim();
    if (!trimmed || phase !== "ready") return;

    const res = await fetch("/api/buzz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });

    if (res.ok) {
      const data = await res.json();
      setPhase("buzzed");
      setElapsed(data.entry.time);
      setRank(totalBuzzed + 1); // +1 because state update is async
    } else {
      setPhase("too-late");
    }
  }

  const statusConfig = {
    waiting: {
      bg: "bg-gray-300",
      text: "Chờ giáo viên phát lệnh...",
      emoji: "⏳",
      textColor: "text-gray-600",
    },
    ready: {
      bg: "bg-green-400 animate-pulse",
      text: "BẤM NGAY!",
      emoji: "🟢",
      textColor: "text-green-800",
    },
    buzzed: {
      bg: "bg-blue-400",
      text: rank === 1 ? "NHẤT! Bạn bấm đầu tiên!" : `Thứ ${rank}! Tốt lắm!`,
      emoji: rank === 1 ? "🏆" : "✅",
      textColor: "text-blue-800",
    },
    "too-late": {
      bg: "bg-orange-400",
      text: "Bạn đã bấm rồi hoặc game chưa bắt đầu",
      emoji: "⚠️",
      textColor: "text-orange-800",
    },
  };

  const cfg = statusConfig[phase];
  const canBuzz = phase === "ready" && name.trim().length > 0;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-8">
      <h1 className="text-3xl font-bold text-gray-800">Game Bấm Nhanh</h1>

      {/* Color status box */}
      <div
        className={`w-64 h-64 rounded-3xl flex flex-col items-center justify-center shadow-lg transition-all duration-300 ${cfg.bg}`}
      >
        <span className="text-6xl mb-3">{cfg.emoji}</span>
        <p className={`text-center font-bold text-lg px-4 ${cfg.textColor}`}>
          {cfg.text}
        </p>
        {phase === "buzzed" && elapsed !== null && (
          <p className="text-sm text-blue-700 mt-2">
            Thời gian phản xạ: <strong>{elapsed}ms</strong>
          </p>
        )}
      </div>

      {/* Name input */}
      <div className="w-full max-w-sm">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tên học sinh
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nhập tên của bạn..."
          disabled={phase === "buzzed" || phase === "too-late"}
          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-blue-400 disabled:bg-gray-100 disabled:text-gray-400"
        />
      </div>

      {/* Buzz button */}
      <button
        onClick={handleBuzz}
        disabled={!canBuzz}
        className={`w-full max-w-sm py-6 rounded-2xl text-2xl font-bold shadow-lg transition-all duration-150 select-none
          ${
            canBuzz
              ? "bg-red-500 hover:bg-red-600 active:scale-95 text-white cursor-pointer animate-bounce"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
      >
        {phase === "buzzed" ? "Đã bấm!" : "BẤM!"}
      </button>

      <p className="text-xs text-gray-400">
        Nhập tên rồi chờ hiệu lệnh của giáo viên
      </p>
    </main>
  );
}
