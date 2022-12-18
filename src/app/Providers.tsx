'use client';

import { ReactNode, useState, useMemo, useEffect } from 'react'
import { Provider } from 'react-redux'
import { useRouter, usePathname } from 'next/navigation';

import { I18nextProvider, getI18n, useTranslation } from 'react-i18next'
import { ThemeProvider, createTheme } from '@mui/material/styles';
import localforage from 'localforage';

import { isPermissionGranted, requestPermission } from '@tauri-apps/api/notification'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/tauri'

import { ThemeProvider as ModeThemeProvider } from '../components/Theme'
import i18n from '../components/i18n'
import { useStore } from '../redux/store'
import { PaletteMode } from '@mui/material';
import { defaultStoreData } from "../lib/constants";
import { setGlobalShortcutActive, setGlobalShortcut, } from '../redux/actions';

export default function Providers({ children, ...props }: { children: ReactNode }) {
    const [MUImode, setMUIMode] = useState('light');
    const store = useStore(props?.pageProps?.initialReduxState);
    const { t } = useTranslation();
    const router = useRouter();
    const pathname = usePathname();

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode: MUImode as PaletteMode,
                },
            }),
        [MUImode],
    );

    useEffect(() => {
        console.log(pathname);
        const routeSettings = (event: any) => {
            if (Boolean(event.payload)) {
                router.push("/settings")
            }
        }

        // Notification permission request
        if (pathname !== "/update") {
            isPermissionGranted().then(res => {
                // console.log(res);
                if (!res) {
                    requestPermission();
                }
            })
        }

        localforage.getItem("settings").then(async (res: any) => {
            if (!res) {
                localforage.setItem("settings", JSON.stringify(defaultStoreData));
                localStorage.setItem("theme", "light");
            }

            if (!localStorage.getItem("theme")) {
                let state = JSON.parse(res)?.isDarkMode ? "dark" : "light";
                localStorage.setItem("theme", state);
            }

            // Set Theme
            document.body.style.backgroundColor = JSON.parse(res)?.isDarkMode ? "rgba(32,28,28,1)" : "#ffffff";

            store.dispatch(setGlobalShortcut(JSON.parse(res || "{}").isShortcut || defaultStoreData.isShortcut));
            await getI18n().changeLanguage(JSON.parse(res || "{}").language || defaultStoreData.language);

            // watch startup plugin state and set a value to global store
            invoke("plugin:autostart|is_enabled").then((enabledState) => { // tauri plugin function
                if (enabledState) {
                    localforage.setItem("settings", JSON.stringify(res ? { ...JSON.parse(res), isStartUp: true } : { ...defaultStoreData, isStartUp: true }));
                } else {
                    localforage.setItem("settings", JSON.stringify(res ? { ...JSON.parse(res), isStartUp: false } : { ...defaultStoreData, isStartUp: false }));
                }
            })

            if (pathname !== "/update") {
                isPermissionGranted().then(res => {
                    if (!res) return;

                    invoke("administation_notification", {
                        invokeMessage: JSON.stringify({
                            title: t('attention'),
                            body: t('not_admin_text'),
                        })
                    });
                })
            }
        }).catch(async err => {
            localforage.setItem("settings", JSON.stringify(defaultStoreData))
            await getI18n().changeLanguage("English");

            if (pathname !== "/update") {
                isPermissionGranted().then(res => {
                    if (!res) return;

                    invoke("administation_notification", {
                        invokeMessage: JSON.stringify({
                            title: t('attention'),
                            body: t('not_admin_text'),
                        })
                    });
                })
            }
        });

        const routeSettingsListen = listen("routeSettings", routeSettings);
        const shortcutActivationListen = listen("activate_shortcuts", () => {
            store.dispatch(setGlobalShortcutActive(true));
        });

        // Disable context menu function
        let contextMenuListener = (event: any) => {
            event.preventDefault();
            return false;
        }

        window.document.addEventListener(
            "contextmenu",
            contextMenuListener,
            { capture: true }
        );

        // Disable F5 and CTRL+R to disable refresh applicaton
        let reloadKeyDown = (e) => {
            if ((e.which || e.keyCode) == 116 /*F5*/ || ((e.which || e.keyCode) == 82 && e.ctrlKey) /*CTRL+R*/) {
                e.preventDefault();
            }
        }
        window.document.addEventListener("keydown", reloadKeyDown);

        return () => {
            shortcutActivationListen.then((f) => f());
            routeSettingsListen.then((f) => f());

            window.document.removeEventListener("contextmenu", contextMenuListener);
            window.document.removeEventListener("keydown", reloadKeyDown);
        }
    }, [])

    return (
        <I18nextProvider i18n={i18n}>
            <Provider store={store}>
                <ThemeProvider theme={theme}>
                    <ModeThemeProvider
                        enableSystem={false}
                        attribute="class"
                    >
                        {children}
                    </ModeThemeProvider>
                </ThemeProvider>
            </Provider>
        </I18nextProvider>
    )
}
