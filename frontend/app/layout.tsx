import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Serifa amable para títulos
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

// Sans humanista (alternativa libre a Google Sans) para el cuerpo
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Matchia — Analiza tu CV con IA",
  description: "Sube tu CV y recibe feedback detallado con inteligencia artificial",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
