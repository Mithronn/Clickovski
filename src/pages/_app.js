import React from 'react';
import Head from "next/head";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AnimatePresence } from 'framer-motion'
import { Provider } from 'react-redux'
import { emit, listen } from '@tauri-apps/api/event'
import dynamic from "next/dynamic";
import localforage from 'localforage';
import { I18nextProvider, getI18n } from 'react-i18next'

import { useStore } from '../redux/store'
import Launcher from "../components/Launcher.tsx";
import '../styles/globals.css';
import { defaultStoreData } from "../lib/constants";
import i18n from '../components/i18n'
import { setGlobalShortcutActive, setGlobalShortcut, } from '../redux/actions';

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
        window.__TAURI__.notification.isPermissionGranted().then(res => {
            // console.log(res);
            if (!res) {
                window.__TAURI__.notification.requestPermission();
            }
        })

        localforage.getItem("settings").then(async (res) => {
            if (!res) {
                localforage.setItem("settings", JSON.stringify(defaultStoreData));
            }

            store.dispatch(setGlobalShortcut(JSON.parse(res || "{}").isShortcut || defaultStoreData.isShortcut));
            await getI18n().changeLanguage(JSON.parse(res || "{}").language || defaultStoreData.language);

            //register for shortcuts
            let globalShortcut = JSON.parse(res || "{}").isShortcut || defaultStoreData.isShortcut;
            window.__TAURI__.globalShortcut.unregisterAll().then(res1 => {
                // not registered yet
                window.__TAURI__.globalShortcut.register(globalShortcut, (globalShortcut1) => {
                    window.__TAURI__.invoke("start_stop_global_shortcut_pressed", { invokeMessage: true });
                });
            })

            // watch startup plugin state and set a value to global store
            window.__TAURI__.invoke("plugin:autostart|is_enabled").then((enabledState) => { // tauri plugin function
                if (enabledState) {
                    localforage.setItem("settings", JSON.stringify(res ? { ...JSON.parse(res), isStartUp: true } : { ...defaultStoreData, isStartUp: true }));
                } else {
                    localforage.setItem("settings", JSON.stringify(res ? { ...JSON.parse(res), isStartUp: false } : { ...defaultStoreData, isStartUp: false }));
                }
            })
        }).catch(async err => {
            localforage.setItem("settings", JSON.stringify(defaultStoreData))
            await getI18n().changeLanguage("English");
        });

        const routeSettingsListen = listen("routeSettings", routeSettings);
        const shortcutActivationListen = listen("activate_shortcuts", () => {
            store.dispatch(setGlobalShortcutActive(true));
            // console.log(store.getState(""));
        });

        let contextMenuListener = (event) => {
            // alert("You've tried to open context menu"); //here you draw your own menu
            event.preventDefault();
            return false;
        }

        window.document.addEventListener(
            "contextmenu",
            contextMenuListener,
            { capture: true }
        );

        return () => {
            shortcutActivationListen.then((f) => f());
            routeSettingsListen.then((f) => f());

            window.document.removeEventListener("contextmenu", contextMenuListener);
        }
    }, [])

    return (
        <SafeHydrate>
            <I18nextProvider i18n={i18n}>
                <Provider store={store}>
                    <ThemeProvider theme={theme}>
                        <div className="w-full min-h-screen overflow-hidden">
                            <Head>
                                <title>Clickovski</title>
                            </Head>

                            {/* <Frame {...pageProps} key="FRAME" /> */}
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
                    </ThemeProvider>
                </Provider>
            </I18nextProvider>
        </SafeHydrate>
    )
}

export default dynamic(() => Promise.resolve(App), {
    ssr: false,
});