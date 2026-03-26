import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Văn Học AI",
  description: "Nền tảng Hỗ trợ Dạy & Học Ngữ Văn",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="light">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`bg-surface font-body text-on-surface antialiased bg-pattern min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
