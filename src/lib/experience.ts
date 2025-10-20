// Optimized experience performance
export const experienceThresholds = [
    { level: "Apprentice", minXp: 0 },
    { level: "Artisan", minXp: 100 },
    { level: "Maestro", minXp: 300 },
    { level: "Visionary", minXp: 600 },
];

export function getExperienceLevel(xp: number) {
    for (let i = experienceThresholds.length - 1; i >= 0; i -= 1) {
        if (xp >= experienceThresholds[i].minXp) {
            return experienceThresholds[i].level;
        }
    }
    return experienceThresholds[0]?.level ?? "Apprentice";
}

