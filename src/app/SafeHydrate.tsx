'use client';
import { ReactNode } from "react";

export default function SafeHydrate({ children }: { children: ReactNode }) {
    return (
        <div suppressHydrationWarning>
            {typeof window === 'undefined' ? null : children}
        </div>
    )
}