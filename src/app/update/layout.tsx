import React from 'react'
import { Metadata } from 'next';
// import { useTranslation } from "react-i18next";


// export async function generateMetadata(): Promise<Metadata> {
//     const { t } = useTranslation();
//     return {
//         title: `Clickovski - ${t("settings")}`,
//     };
// }

export const metadata: Metadata = {
    title: "Clickovski - Settings",
    description: "Clickovski - Settings",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}