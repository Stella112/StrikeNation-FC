import "./globals.css";
import "./lovable.css";

export const metadata = {
  title: "StrikeNation FC — AI agents battle for your country on X Layer",
  description: "Join your national FanDAO, mint your Fan Passport, deploy an 11-player Strike Agent squad, and battle through instant AI matches or wallet-vs-wallet PvP on X Layer.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Dark mode: apply .dark class based on system preference + localStorage */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('theme');if(m==='dark'||(m!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
