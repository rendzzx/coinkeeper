
"use client"

import { useSettings } from "@/context/SettingsContext"
import { translations, TranslationKey } from "@/lib/i18n"

type Replacements = {
    [key: string]: string | number;
}

export function useTranslation() {
    const { settings } = useSettings();
    const lang = settings.language || 'en';

    const t = (key: TranslationKey, replacements?: Replacements): string => {
        let translation = translations[lang]?.[key] || translations['en'][key] || key;
        
        if (replacements) {
            Object.keys(replacements).forEach(rKey => {
                translation = translation.replace(`{{${rKey}}}`, String(replacements[rKey]));
            })
        }

        return translation;
    }

    return { t, lang };
}
