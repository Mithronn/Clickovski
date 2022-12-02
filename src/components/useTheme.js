'use client';
import React from 'react'
import { useTheme as useNextTheme } from "./Theme.tsx";

function useTheme(reduxState = null) {
    const { theme: themee } = useNextTheme();
    const [theme, setThemee] = React.useState(themee === "dark" ? true : themee == "light" ? false : false);

    React.useEffect(() => {
        setThemee(themee === "dark" ? true : themee == "light" ? false : false)
    }, [themee]);

    return theme;
}

export default useTheme