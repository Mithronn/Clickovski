"use client";

import { ReactNode, useEffect, useLayoutEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

import { I18nextProvider, getI18n } from "react-i18next";

import {
  isPermissionGranted,
  requestPermission,
} from "@tauri-apps/plugin-notification";
import { listen } from "@tauri-apps/api/event";

import i18n from "@/components/i18n";
import { useStateStore as useEngineStore } from "@/state/store";

export default function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const setGlobalShortcutActive = useEngineStore((state) => state.setGlobalShortcutActive);
  const isDarkMode = useEngineStore((state) => state.isDarkMode);
  const isLanguage = useEngineStore((state) => state.isLanguage);

  useLayoutEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    document.body.style.backgroundColor = isDarkMode
      ? "rgba(32,28,28,1)"
      : "#ffffff";

    (async () => {
      await getI18n().changeLanguage(isLanguage ?? undefined);
    })();

    const shortcutActivationListen = listen("activate_shortcuts", () => {
      setGlobalShortcutActive(true);
    });

    return () => {
      shortcutActivationListen.then((f) => f());
    }
  }, [isDarkMode, isLanguage, setGlobalShortcutActive]);

  useEffect(() => {
    // Notification permission request
    if (pathname !== "/update") {
      isPermissionGranted().then((res) => {
        if (!res) {
          requestPermission();
        }
      });
    }
  }, []);

  useEffect(() => {
    const routeSettings = (event: any) => {
      if (Boolean(event.payload)) {
        router.push("/settings");
      }
    };

    const routeSettingsListen = listen("routeSettings", routeSettings);

    // Disable context menu function
    let contextMenuListener = (event: MouseEvent) => {
      event.preventDefault();
      return false;
    };

    window.document.addEventListener("contextmenu", contextMenuListener, {
      capture: true,
    });

    // Disable F5 and CTRL+R to disable refresh applicaton
    let reloadKeyDown = (e: KeyboardEvent) => {
      if (
        (e.which || e.keyCode) == 116 /*F5*/ ||
        ((e.which || e.keyCode) == 82 && e.ctrlKey) /*CTRL+R*/
      ) {
        e.preventDefault();
      }
    };
    window.document.addEventListener("keydown", reloadKeyDown);

    return () => {
      routeSettingsListen.then((f) => f());

      window.document.removeEventListener("contextmenu", contextMenuListener);
      window.document.removeEventListener("keydown", reloadKeyDown);
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
