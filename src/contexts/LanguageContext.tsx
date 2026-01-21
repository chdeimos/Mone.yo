"use client";

import { createContext, useContext, useState, useEffect } from "react";
import es from "../locales/es.json";
import en from "../locales/en.json";

const translations: any = { es, en };

type LanguageContextType = {
    lang: string;
    setLang: (lang: string) => void;
    t: (path: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLang] = useState("es");

    useEffect(() => {
        const saved = localStorage.getItem("lang");
        if (saved) setLang(saved);
    }, []);

    const changeLang = (newLang: string) => {
        setLang(newLang);
        localStorage.setItem("lang", newLang);
    };

    const t = (path: string) => {
        const keys = path.split(".");
        let result = translations[lang];
        for (const key of keys) {
            if (result[key]) {
                result = result[key];
            } else {
                return path;
            }
        }
        return result;
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang: changeLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) throw new Error("useLanguage must be used within LanguageProvider");
    return context;
}
