import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "MatchCorner Booking Tools",
  description: "Betway Nigeria booking-code technical assessment"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
