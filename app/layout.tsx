import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEO記事作成システム",
  description: "LLMを使ったSEO記事自動生成システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}


