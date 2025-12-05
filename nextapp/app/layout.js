// This file must stay SERVER-SIDE.
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AidHandy",
  description: "Together, every flight feels easier.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
