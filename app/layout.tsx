import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game Bấm Nhanh",
  description: "Ai bấm nhanh nhất sẽ thắng!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
