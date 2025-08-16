"use client";

import React, { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";

export default function Providers({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <AnimatePresence
            mode="wait"
            initial={false}
            onExitComplete={() => window.scrollTo(0, 0)}
        >
            <motion.div key={pathname} className="overflow-hidden">
                {children}
            </motion.div>
        </AnimatePresence>
    );
}