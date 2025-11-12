import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { Geist, Geist_Mono, Raleway } from "next/font/google";
import "./globals.css";

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
        className={`${geistSans.variable} ${geistMono.variable} ${raleway.variable} antialiased bg-[#F0F0F3]`}
      >
        <SessionProvider>
          <AuthenticatedLayout>
            {children}
          </AuthenticatedLayout>
        </SessionProvider>
      </body>
    </html>
  );
}
