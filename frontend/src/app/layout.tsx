import type { Metadata } from "next";
import { Manrope, Source_Sans_3, Madimi_One } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  weight: ["400", "600"],
  display: "swap",
});

const madimiOne = Madimi_One({
  subsets: ["latin"],
  variable: "--font-madimi",
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PAL 2.0 — Personalized Adaptive Learning",
  description: "Gamified adaptive learning by Ulipsu / Kidvento Education",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${sourceSans.variable} ${madimiOne.variable}`}
    >
      <body className="font-manrope bg-page-bg min-h-dvh antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
