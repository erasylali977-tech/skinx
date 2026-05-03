import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "SkinX — Your Skin's Digital Guardian",
  description:
    "AI-driven precision and medical-grade tracking for moles and skin spots.",
  manifest: "/manifest.webmanifest",
  applicationName: "SkinX",
  appleWebApp: {
    capable: true,
    title: "SkinX",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0058bc",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ background: "#0c1527" }}>
      <body className="bg-surface text-on-surface antialiased min-h-screen" style={{ background: "#0c1527" }}>
        {/* ── Splash screen: SSR-rendered, fades out after window.load ── */}
        <div
          id="skinx-splash"
          aria-hidden="true"
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "#0c1527",
            transition: "opacity 0.55s ease",
            pointerEvents: "all",
          }}
        >
          {/* Pulsing outer rings */}
          <div style={{ position: "relative", width: 96, height: 96, marginBottom: 32 }}>
            <div style={{
              position: "absolute", inset: -14, borderRadius: "50%",
              border: "1.5px solid rgba(91,154,245,0.2)",
              animation: "splash-pulse 2.2s ease-in-out infinite",
            }} />
            <div style={{
              position: "absolute", inset: -6, borderRadius: "50%",
              border: "1.5px solid rgba(91,154,245,0.35)",
              animation: "splash-pulse 2.2s ease-in-out infinite 0.5s",
            }} />
            {/* Main circle */}
            <div style={{
              width: 96, height: 96, borderRadius: "50%",
              background: "linear-gradient(145deg, #1b3a70, #2a5abf)",
              boxShadow: "0 0 40px rgba(91,154,245,0.3), 0 0 80px rgba(91,154,245,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="46" height="46" viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="23" cy="23" r="19" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                <path d="M6 23 Q11 13 17 23 Q23 33 29 23 Q35 13 40 23" stroke="rgba(255,255,255,0.75)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 28 Q11 18 17 28 Q23 38 29 28 Q35 18 40 28" stroke="rgba(91,154,245,0.45)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="23" cy="23" r="2.5" fill="white" opacity="0.9"/>
                <circle cx="23" cy="23" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none"/>
              </svg>
            </div>
            {/* Rotating arc */}
            <div style={{
              position: "absolute", inset: -3, borderRadius: "50%",
              border: "2px solid transparent",
              borderTopColor: "rgba(91,154,245,0.8)",
              borderRightColor: "rgba(91,154,245,0.25)",
              animation: "splash-spin 1.5s linear infinite",
            }} />
          </div>
          {/* Wordmark */}
          <div style={{
            color: "white", fontSize: 32, fontWeight: 800,
            letterSpacing: "0.12em", fontFamily: "system-ui,-apple-system,sans-serif",
            animation: "splash-in 0.6s ease 0.15s both",
          }}>
            SkinX
          </div>
          {/* Tagline */}
          <div style={{
            color: "rgba(255,255,255,0.38)", fontSize: 11, marginTop: 8,
            letterSpacing: "0.15em", textTransform: "uppercase",
            fontFamily: "system-ui,-apple-system,sans-serif",
            animation: "splash-in 0.6s ease 0.35s both",
          }}>
            Your Skin&apos;s Digital Guardian
          </div>
        </div>

        <Providers>
          {children}
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function hideSplash() {
                  var s = document.getElementById('skinx-splash');
                  if (!s) return;
                  s.style.opacity = '0';
                  s.style.pointerEvents = 'none';
                  setTimeout(function() { if (s && s.parentNode) s.parentNode.removeChild(s); }, 600);
                }
                if (document.readyState === 'complete') {
                  setTimeout(hideSplash, 150);
                } else {
                  window.addEventListener('load', function() { setTimeout(hideSplash, 150); });
                }
                setTimeout(hideSplash, 4000);
              })();
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js?v=${process.env.NEXT_PUBLIC_BUILD_ID}').catch(function(){});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
