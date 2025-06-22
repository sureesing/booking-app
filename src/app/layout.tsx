import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sureesing",
  description: "A modern login page with dark mode",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)', color: '#1e293b' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#6366f1" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1e293b" media="(prefers-color-scheme: dark)" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        {/* Space Footer - compact, more animation */}
        <footer className="relative w-full bg-white dark:bg-gradient-to-br dark:from-indigo-950 dark:via-purple-950 dark:to-black border-t-0 pt-6 pb-4 flex flex-col items-center justify-end overflow-hidden min-h-[120px]" style={{marginTop: 'auto'}}>
          {/* Animated space elements */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            {/* Multiple shooting stars */}
            <svg className="absolute left-1/5 top-2 animate-shooting-star" width="80" height="6"><line x1="0" y1="3" x2="80" y2="3" stroke="#fff" strokeWidth="2" strokeDasharray="8 6" opacity="0.7"/></svg>
            <svg className="absolute left-1/2 top-8 animate-shooting-star2" width="100" height="7"><line x1="0" y1="3.5" x2="100" y2="3.5" stroke="#a5b4fc" strokeWidth="2" strokeDasharray="10 8" opacity="0.5"/></svg>
            <svg className="absolute right-1/4 top-12 animate-shooting-star3" width="60" height="5"><line x1="0" y1="2.5" x2="60" y2="2.5" stroke="#fbcfe8" strokeWidth="2" strokeDasharray="6 5" opacity="0.5"/></svg>
            {/* Planets & rings */}
            <span className="absolute left-8 bottom-6 animate-planet-spin">
              <span className="block w-7 h-7 bg-gradient-to-br from-indigo-400 via-blue-400 to-purple-500 rounded-full shadow-xl border-2 border-white/30 footer-planet" />
              <span className="block w-10 h-1 bg-gradient-to-r from-white/30 to-indigo-300/30 rounded-full absolute left-[-6px] top-3 rotate-12 opacity-70 footer-ring" />
            </span>
            <span className="absolute right-10 top-6 animate-planet-bounce">
              <span className="block w-5 h-5 bg-gradient-to-br from-yellow-200 via-pink-300 to-purple-400 rounded-full shadow-md border-2 border-white/20 footer-planet-small" />
              <span className="block w-8 h-1 bg-gradient-to-r from-pink-100/60 to-purple-200/60 rounded-full absolute left-[-4px] top-2 rotate-6 opacity-60 footer-ring-small" />
            </span>
            {/* Comet */}
            <span className="absolute left-1/3 top-1/2 animate-comet">
              <span className="block w-2 h-2 bg-white rounded-full shadow-md footer-comet" />
              <span className="block w-10 h-1 bg-gradient-to-r from-white/80 to-transparent rounded-full absolute left-2 top-0.5 opacity-70 footer-comet-tail" />
            </span>
            {/* Meteor */}
            <span className="absolute right-1/5 bottom-8 animate-meteor">
              <span className="block w-1.5 h-1.5 bg-blue-200 rounded-full shadow-sm footer-meteor" />
              <span className="block w-6 h-0.5 bg-gradient-to-r from-blue-200/80 to-transparent rounded-full absolute left-1 top-0.5 opacity-60 footer-meteor-tail" />
            </span>
            {/* Small twinkling stars */}
            {[...Array(24)].map((_,i)=>(
              <span key={i} className={`absolute bg-white rounded-full animate-twinkle footer-star`} style={{
                left: `${Math.random()*100}%`,
                top: `${Math.random()*100}%`,
                width: `${Math.random()*1.5+1}px`,
                height: `${Math.random()*1.5+1}px`,
                opacity: Math.random()*0.5+0.4,
                animationDelay: `${Math.random()*3}s`
              }} />
            ))}
          </div>
          {/* Footer text */}
          <div className="relative z-10 flex flex-col items-center">
            <span className="footer-text text-base font-semibold text-white drop-shadow-lg mb-1">มีปัญหาติดต่อ ครูสุรีพร แย้มบู่</span>
            <span className="footer-text text-xs text-white">© 2025 ผู้จัดทำ</span>
          </div>
        </footer>
      </body>
    </html>
  );
}