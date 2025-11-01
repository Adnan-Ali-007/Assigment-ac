import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Attack Capital: Advanced AMD",
  description: "A secure, scalable web app that dials outbound calls, detects if a human or machine answers, and handles connections accordingly using multiple Answering Machine Detection (AMD) strategies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-gray-200 font-sans">{children}</body>
    </html>
  );
}
