"use client";

import { useEffect, useState } from "react";
import PusherClient from "pusher-js";

interface BuzzEntry {
  name: string;
  time: number;
  clickedAt: string;
}

type GamePhase = "idle" | "active" | "done";

export default function TeacherPage() {
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [buzzes, setBuzzes] = useState<BuzzEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pusher = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! }
    );
    const channel = pusher.subscribe("game-channel");

    channel.bind("game-start", () => {
      setPhase("active");
      setBuzzes([]);
    });

    channel.bind("student-buzz", (entry: BuzzEntry) => {
      setBuzzes((prev) => {
        if (prev.find((b) => b.name === entry.name)) return prev;
        const next = [...prev, entry].sort((a, b) => a.time - b.time);
        return next;
      });
      setPhase("done");
    });

    channel.bind("game-reset", () => {
      setPhase("idle");
      setBuzzes([]);
    });

    // Sync state on mount
    fetch("/api/state")
      .then((r) => r.json())
      .then((state) => {
        if (state.active) setPhase("active");
        if (state.buzzes?.length > 0) {
          setBuzzes(state.buzzes);
          setPhase("done");
        }
      });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("game-channel");
      pusher.disconnect();
    };
  }, []);

  async function handleStart() {
    setLoading(true);
    await fetch("/api/signal", { method: "POST" });
    setLoading(false);
  }

  async function handleReset() {
    setLoading(true);
    await fetch("/api/reset", { method: "POST" });
    setLoading(false);
  }

  const winner = buzzes[0];

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Bảng Giáo Viên
        </h1>
        <span className="text-sm text-gray-400">Trang dành riêng cho giáo viên</span>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={handleStart}
          disabled={loading || phase === "active"}
          className={`flex-1 py-4 rounded-2xl text-xl font-bold shadow transition-all
            ${
              phase === "active"
                ? "bg-green-200 text-green-700 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 active:scale-95 text-white cursor-pointer"
            }`}
        >
          {phase === "active" ? "Đang chạy..." : "Bắt Đầu!"}
        </button>
        <button
          onClick={handleReset}
          disabled={loading}
          className="flex-1 py-4 rounded-2xl text-xl font-bold shadow bg-gray-200 hover:bg-gray-300 active:scale-95 text-gray-700 cursor-pointer transition-all"
        >
          Reset
        </button>
      </div>

      {/* Status indicator */}
      <div
        className={`w-full h-4 rounded-full mb-8 transition-colors duration-500 ${
          phase === "idle"
            ? "bg-gray-300"
            : phase === "active"
            ? "bg-green-400 animate-pulse"
            : "bg-blue-400"
        }`}
      />

      {/* Winner highlight */}
      {winner && (
        <div className="bg-yellow-100 border-4 border-yellow-400 rounded-3xl p-6 mb-6 text-center shadow-lg">
          <p className="text-5xl mb-2">🏆</p>
          <p className="text-gray-500 text-sm font-medium mb-1">BẤM ĐẦU TIÊN</p>
          <p className="text-4xl font-extrabold text-yellow-700">{winner.name}</p>
          <p className="text-gray-500 mt-2">
            Thời gian phản xạ:{" "}
            <span className="font-bold text-yellow-600">{winner.time}ms</span>
          </p>
        </div>
      )}

      {/* Full leaderboard */}
      {buzzes.length > 0 && (
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">
            Thứ tự bấm ({buzzes.length} học sinh)
          </h2>
          <ol className="space-y-3">
            {buzzes.map((entry, i) => (
              <li
                key={entry.name}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  i === 0
                    ? "bg-yellow-50 border-2 border-yellow-300"
                    : i === 1
                    ? "bg-gray-50 border border-gray-200"
                    : i === 2
                    ? "bg-orange-50 border border-orange-200"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                  </span>
                  <span className="font-semibold text-gray-800">{entry.name}</span>
                </div>
                <span className="text-gray-500 text-sm font-mono">
                  {entry.time}ms
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {phase === "idle" && buzzes.length === 0 && (
        <div className="text-center text-gray-400 py-16">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-lg">Nhấn &quot;Bắt Đầu&quot; để phát lệnh cho học sinh</p>
        </div>
      )}

      {phase === "active" && buzzes.length === 0 && (
        <div className="text-center text-gray-400 py-16">
          <p className="text-5xl mb-4 animate-bounce">⏱️</p>
          <p className="text-lg">Đang chờ học sinh bấm...</p>
        </div>
      )}
    </main>
  );
}
