// @ts-expect-error The file exists, but TS is not detecting it
import "@/assets/css/globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Raleway } from "next/font/google";

const raleway = Raleway({
  subsets: [ "latin" ],
  variable: "--font-raleway-variable",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: [ "latin" ],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: [ "latin" ],
});

export const metadata: Metadata = {
  title: "Aplicativo Financeiro",
  description: "Um aplicativo financeiro desenvolvido como trabalho universitário.",
};

export default function RootLayout ({ children }: Readonly<{children: React.ReactNode;}>) {
  return (
    <html lang="pt">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${raleway.variable} antialiased`}
      >
        <main
          className="
            w-full
            h-full
          "
        >
          { children }
        </main>
      </body>
    </html>
  );
}
