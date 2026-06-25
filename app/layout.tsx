import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Email Marketing Automation",
  description: "A modern Excel-to-Gmail automation web app with campaign previews, templates, attachments, and duplicate protection.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
