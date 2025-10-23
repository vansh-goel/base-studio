// Final improvements and bug fixes - 2025-10-24T15:36:53.368Z
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
// Optimized theme performance


type Theme = "light" | "dark";

type ThemeContextValue = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const FALLBACK_STATIC_THEME: Theme = "light";

function getInitialTheme(): Theme {
    if (typeof window === "undefined") return FALLBACK_STATIC_THEME;

    const stored = window.localStorage.getItem("0g-theme");
    if (stored === "light" || stored === "dark") {
        return stored;
    }

    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
    }

    return FALLBACK_STATIC_THEME;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(FALLBACK_STATIC_THEME);
    const [mounted, setMounted] = useState(false);
    const [isHydrating, setIsHydrating] = useState(true);

    useEffect(() => {
        // Only run on client side
        const initial = getInitialTheme();
        setThemeState(initial);

        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(initial);

        setMounted(true);
        setIsHydrating(false);
    }, []);

    useEffect(() => {
        if (!mounted || isHydrating) return;

        const root = document.documentElement;
        root.classList.remove(theme === "light" ? "dark" : "light");
        root.classList.add(theme);
        document.body.dataset.theme = theme;
        window.localStorage.setItem("0g-theme", theme);
    }, [theme, mounted, isHydrating]);

    const setTheme = (next: Theme) => {
        setThemeState(next);
    };

    const toggleTheme = () => {
        setThemeState((prev) => (prev === "light" ? "dark" : "light"));
    };

    const value = useMemo<ThemeContextValue>(
        () => ({ theme, setTheme, toggleTheme }),
        [theme]
    );

    // Prevent hydration mismatch by showing fallback until mounted
    if (!mounted || isHydrating) {
        return (
            <ThemeContext.Provider value={{ theme: FALLBACK_STATIC_THEME, setTheme: () => { }, toggleTheme: () => { } }}>
                {children}
            </ThemeContext.Provider>
        );
    }

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return context;
}

