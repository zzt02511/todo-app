import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "待办事项",
  description: "一个优雅的 Todo List 应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
