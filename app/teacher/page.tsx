"use client";

import { useEffect, useRef, useState } from "react";
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
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const hasPlayedRef = useRef(false);
  const pendingWinnerRef = useRef<BuzzEntry | null>(null);

  function startCountdownAndReveal(winner: BuzzEntry) {
    setShowWinner(false);
    setCountdown(3);

    setTimeout(() => setCountdown(2), 1000);
    setTimeout(() => setCountdown(1), 2000);
    setTimeout(() => {
      setCountdown(null);
      setShowWinner(true);
      // Phát nhạc chiến thắng
      const audio = new Audio("/sounds/chien-thang.mp3");
      audio.play().catch(() => {});
    }, 3000);
  }

  useEffect(() => {
    const pusher = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! }
    );
    const channel = pusher.subscribe("game-channel");

    channel.bind("game-start", () => {
      setPhase("active");
      setBuzzes([]);
      setShowWinner(false);
      setCountdown(null);
      hasPlayedRef.current = false;
      pendingWinnerRef.current = null;
    });

    channel.bind("student-buzz", (entry: BuzzEntry) => {
      setBuzzes((prev) => {
        if (prev.find((b) => b.name === entry.name)) return prev;
        const next = [...prev, entry].sort((a, b) => a.time - b.time);

        // Chỉ đếm ngược + phát nhạc cho người đầu tiên
        if (next[0].name === entry.name && !hasPlayedRef.current) {
          hasPlayedRef.current = true;
          pendingWinnerRef.current = entry;
          startCountdownAndReveal(entry);
        }

        return next;
      });
      setPhase("done");
    });

    channel.bind("game-reset", () => {
      setPhase("idle");
      setBuzzes([]);
      setShowWinner(false);
      setCountdown(null);
      hasPlayedRef.current = false;
      pendingWinnerRef.current = null;
    });

    fetch("/api/state")
      .then((r) => r.json())
      .then((state) => {
        if (state.active) setPhase("active");
        if (state.buzzes?.length > 0) {
          setBuzzes(state.buzzes);
          setPhase("done");
          setShowWinner(true);
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
        <h1 className="text-3xl font-bold text-gray-800">Bảng Giáo Viên</h1>
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

      {/* Status bar */}
      <div
        className={`w-full h-4 rounded-full mb-8 transition-colors duration-500 ${
          phase === "idle"
            ? "bg-gray-300"
            : phase === "active"
            ? "bg-green-400 animate-pulse"
            : "bg-blue-400"
        }`}
      />

      {/* Countdown overlay */}
      {countdown !== null && (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-gray-500 text-lg mb-4 font-medium">Công bố kết quả sau...</p>
          <div
            key={countdown}
            className="text-[10rem] font-black text-yellow-500 leading-none animate-ping-once"
            style={{
              animation: "zoomIn 0.3s ease-out",
            }}
          >
            {countdown}
          </div>
        </div>
      )}

      {/* Winner reveal */}
      {showWinner && winner && countdown === null && (
        <div className="bg-yellow-100 border-4 border-yellow-400 rounded-3xl p-8 mb-6 text-center shadow-xl"
          style={{ animation: "zoomIn 0.4s ease-out" }}
        >
          <p className="text-6xl mb-3 animate-bounce">🏆</p>
          <p className="text-gray-500 text-sm font-medium mb-2 tracking-widest uppercase">
            Bấm đầu tiên
          </p>
          <p className="text-5xl font-extrabold text-yellow-700 mb-3">
            {winner.name}
          </p>
          <p className="text-gray-500">
            Thời gian phản xạ:{" "}
            <span className="font-bold text-yellow-600">{winner.time}ms</span>
          </p>
          <p className="text-yellow-600 font-bold mt-4 text-xl animate-pulse">
            🎉 Chúc mừng! 🎉
          </p>
        </div>
      )}

      {/* Full leaderboard */}
      {showWinner && buzzes.length > 0 && (
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

      <style>{`
        @keyframes zoomIn {
          from { transform: scale(0.3); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </main>
  );
}
