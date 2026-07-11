import type { Metadata } from "next";
import { Inter, Playfair_Display, Bebas_Neue } from "next/font/google";
import StyledComponentsRegistry from "@/lib/registry";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700", "900"], variable: "--font-playfair" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-bebas" });

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
      <body className={`${inter.className} ${playfair.variable} ${bebas.variable}`}>
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
      </body>
    </html>
  );
}
