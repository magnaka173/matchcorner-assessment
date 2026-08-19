import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "MatchCorner Booking Workspace",
  description: "Decode, encode and convert Betway Nigeria booking codes"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
