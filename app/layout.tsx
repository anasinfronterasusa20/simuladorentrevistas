import type { Metadata } from "next";
import { Montserrat, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import "react-phone-number-input/style.css";

// Self-hosted por Next → cero llamadas externas → funciona limpio en iframe.
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Diagnóstico Flash — Sin Fronteras Global",
  description:
    "Diagnóstico Flash: herramienta breve de preparación para la entrevista de asilo. Uso interno para asistentes al webinar de Sin Fronteras Global.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${montserrat.variable} ${cormorant.variable}`}
      suppressHydrationWarning
    >
      {/* suppressHydrationWarning en <body>: extensiones del navegador
          (Bitdefender, Grammarly, LastPass, etc.) inyectan atributos
          como `bis_register` o `__processed_*` en el <body> antes de que
          React hidrate. No es un bug del código; es ruido del cliente. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
