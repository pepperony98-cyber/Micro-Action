import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "今天抽一个就好",
  description: "轻量随机任务提醒 PWA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "抽一个就好",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#f7c86b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
