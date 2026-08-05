import type { Metadata } from "next";
import StyledComponentsRegistry from "@/lib/registry";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hoppr Business",
  description:
    "Professional bar management platform for tracking VIP pass sales, creating promotions, and analyzing customer engagement metrics",

  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
      </body>
    </html>
  );
}
