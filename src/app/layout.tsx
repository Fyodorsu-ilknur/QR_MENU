import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QR Menü",
  description: "QR Menü Uygulaması",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        {children}
      </body>
    </html>
  );
}
