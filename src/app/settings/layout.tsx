import React from 'react'
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Clickovski Updater",
    description: "Clickovski Updater",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}