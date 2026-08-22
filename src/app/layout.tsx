import type { Metadata } from "next";
import { Archivo, Fragment_Mono } from "next/font/google";

import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fragmentMono = Fragment_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: "400",
});

export const metadata: Metadata = {
  title: "WorldSpec | Spatial QA for generated worlds",
  description:
    "Test whether a generated 3D world actually satisfies its movement contract.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${archivo.variable} ${fragmentMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
