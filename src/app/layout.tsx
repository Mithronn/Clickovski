/* eslint-disable @next/next/no-head-element */
"use client"
import '../styles/globals.css';
import Providers from "./Providers";
import SafeHydrate from "./SafeHydrate";
import { AnimatePresence } from 'framer-motion'
import Launcher from "../components/Launcher";
import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
  ...props
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <html>
      <head></head>
      <body>
        <SafeHydrate>
          <Providers {...props}>
            <div className="w-full min-h-screen overflow-hidden">
              <AnimatePresence
                mode="wait"
                exitBeforeEnter
                initial={false}
                onExitComplete={() => window.scrollTo(0, 0)}
              >
                <div key={pathname} className="overflow-hidden">
                  {children}
                </div>
              </AnimatePresence>
              <Launcher key="LAUNCHER" />
            </div>

          </Providers>
        </SafeHydrate>
      </body>
    </html >
  );
}
