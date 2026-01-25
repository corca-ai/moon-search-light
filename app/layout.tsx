import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moon Search Light",
  description: "AI 기반 논문 검색 및 연구 도우미",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
