import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import languageEN from '../localization/en.json'
import languageTR from '../localization/tr.json'
import languageRU from '../localization/ru.json'
import languageES from '../localization/es.json'
import languagePT from '../localization/pt.json'
import languageFR from '../localization/fr.json'
import languageDE from '../localization/de.json'
import languageAR from '../localization/ar.json'

function convertLocales<T extends Record<string, any>>(locale: T, excludeKeys: string[] = ["_version"]): { translation: T } {
    const filtered = Object.fromEntries(
        Object.entries(locale).filter(([key]) => !excludeKeys.includes(key))
    )

    return {
        translation: filtered as T
    }
}

i18n
    .use(initReactI18next)
    .init({
        resources: {
            English: convertLocales(languageEN),
            "Türkçe": convertLocales(languageTR),
            "Русский": convertLocales(languageRU),
            "Español": convertLocales(languageES),
            "Português": convertLocales(languagePT),
            "Français": convertLocales(languageFR),
            "Deutsch": convertLocales(languageDE),
            "عربي": convertLocales(languageAR),
        },
        supportedLngs: ['English', 'Türkçe', "Русский", "Español", "Português", "Français", "Deutsch", "عربي"],
        fallbackLng: 'English',
        debug: process.env.NODE_ENV === 'development',
        keySeparator: '.',
        interpolation: {
            formatSeparator: ',',
            prefix: "%{",
            suffix: "}"
        },
        react: {
            bindI18n: 'languageChanged loaded',
            bindI18nStore: 'added removed',
            nsMode: 'default',
            useSuspense: true,
        }
    })

export default i18n
