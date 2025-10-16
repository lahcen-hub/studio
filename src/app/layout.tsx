
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from '@vercel/analytics/react';
import { FirebaseErrorListener } from '@/lib/firebase/FirebaseErrorListener';

export const metadata: Metadata = {
  title: 'Cargo',
  description: 'Calculates total price for two product types based on cargo data.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Aref+Ruqaa:wght@400;700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#f2fcf2" />
        <link rel="apple-touch-icon" href="/camionnette.svg" />
        <link rel="icon" href="/camionnette.svg" sizes="any" type="image/svg+xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(registration => {
                    console.log('Service Worker registered: ', registration);
                  }).catch(registrationError => {
                    console.log('Service Worker registration failed: ', registrationError);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className="font-body antialiased h-full">
        {children}
        <Toaster />
        <SpeedInsights />
        <Analytics />
        <FirebaseErrorListener />
      </body>
    </html>
  );
}
