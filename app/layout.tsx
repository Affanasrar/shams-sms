import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
// providers that must only render on the client.  `DynamicClientProviders`
// is itself a client component which handles the dynamic import.
import DynamicClientProviders from "@/components/ui/dynamic-client-providers"
// PWA removed: installer component removed

// Using system fonts instead of Google Fonts for better reliability in restricted environments
// Font stack provides good typography across all platforms
const fontStack = {
  sansSerif: [
    '-apple-system',
    'BlinkMacSystemFont', 
    '"Segoe UI"',
    'Helvetica',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
  ].join(','),
  monospace: [
    '"Fira Code"',
    '"Source Code Pro"',
    'Menlo',
    'monospace',
  ].join(','),
}

export const metadata: Metadata = {
  title: "Shams SMS - School Management System",
  description: "Comprehensive school management system for teachers, students, and administrators",
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInForceRedirectUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL}
      signInFallbackRedirectUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL}
      signUpForceRedirectUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL}
      signUpFallbackRedirectUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL}
    >
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/icons/favicon-96x96.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Shams" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body
        className="antialiased"
        style={{
          fontFamily: fontStack.sansSerif,
        }}>
        <DynamicClientProviders>
          {children}
        </DynamicClientProviders>
      </body>
    </html>
    </ClerkProvider>
  );
}
