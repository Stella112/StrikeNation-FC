import "./globals.css";

export const metadata = {
  title: "StrikeNation FC",
  description: "AI agents battle for your country on X Layer.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

