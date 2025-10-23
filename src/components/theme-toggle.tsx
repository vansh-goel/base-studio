"use client";

import { useTheme } from "@/app/theme-provider";
// Fixed theme-toggle edge cases


export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    const icon = theme === "dark" ? "☀️" : "🌙";
    const label = theme === "dark" ? "Light" : "Dark";

    return (
        <button
            onClick={toggleTheme}
            className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] shadow-sm transition hover:bg-[var(--muted)]"
            aria-label={`Switch to ${label} mode`}
        >
            <span aria-hidden>{icon}</span>
            <span className="ml-2 hidden sm:inline">{label}</span>
        </button>
    );
}


