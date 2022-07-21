import React from 'react';
import Head from "next/head";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AnimatePresence } from 'framer-motion'
import { Provider } from 'react-redux'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/tauri'
import { isPermissionGranted, requestPermission } from '@tauri-apps/api/notification'
import dynamic from "next/dynamic";
import localforage from 'localforage';
import { I18nextProvider, getI18n, useTranslation } from 'react-i18next'

import { useStore } from '../redux/store'
import Launcher from "../components/Launcher.tsx";
import '../styles/globals.css';
import { defaultStoreData } from "../lib/constants";
import i18n from '../components/i18n'
import { setGlobalShortcutActive, setGlobalShortcut, } from '../redux/actions';
import { ThemeProvider as ModeThemeProvider } from '../components/Theme.tsx'

function SafeHydrate({ children }) {
    return (
        <div suppressHydrationWarning>
            {typeof window === 'undefined' ? null : children}
        </div>
    )
}


function App(props) {
    const { Component, pageProps, router } = props;
    const store = useStore(pageProps.initialReduxState);
    const { t } = useTranslation();

    const [MUImode, setMUIMode] = React.useState('light');

    const colorMode = React.useMemo(
        () => ({
            toggleColorMode: () => {
                setMUIMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
            },
        }),
        [],
    );

    const theme = React.useMemo(
        () =>
            createTheme({
                palette: {
                    mode: MUImode,
                },
            }),
        [MUImode],
    );

    React.useEffect(() => {
        const routeSettings = (event) => {
            if (Boolean(event.payload)) {
                router.push("/settings")
            }
        }

        // Notification permission request
        if (router.pathname !== "/update") {
            isPermissionGranted().then(res => {
                // console.log(res);
                if (!res) {
                    requestPermission();
                }
            })
        }

        localforage.getItem("settings").then(async (res) => {
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
            // document.style.backgroundColor = JSON.parse(res)?.isDarkMode ? "rgba(32,28,28,1)" : "#ffffff";

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

            if (router.pathname !== "/update") {
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

            if (router.pathname !== "/update") {
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
        let contextMenuListener = (event) => {
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
        <SafeHydrate>
            <I18nextProvider i18n={i18n}>
                <Provider store={store}>
                    <ThemeProvider theme={theme}>
                        <ModeThemeProvider
                            enableSystem={false}
                            attribute="class"
                        >
                            <div className="w-full min-h-screen overflow-hidden">
                                <Head>
                                    <title>Clickovski</title>
                                </Head>

                                <AnimatePresence
                                    exitBeforeEnter
                                    initial={false}
                                    onExitComplete={() => window.scrollTo(0, 0)}
                                >
                                    <div key={router.route} className="overflow-hidden">
                                        <Component {...pageProps} />
                                    </div>
                                </AnimatePresence>
                                <Launcher {...pageProps} key="LAUNCHER" />
                            </div>
                        </ModeThemeProvider>
                    </ThemeProvider>
                </Provider>
            </I18nextProvider>
        </SafeHydrate>
    )
}

export default dynamic(() => Promise.resolve(App), {
    ssr: false,
});
