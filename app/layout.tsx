import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paper Search - Semantic Scholar",
  description: "Search academic papers using Semantic Scholar API",
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
