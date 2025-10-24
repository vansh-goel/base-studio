"use client";

import { useExperienceNFT, EXPERIENCE_LEVELS } from '@/lib/experienceNFT';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
// Enhanced evolution UX


interface EvolutionStage {
    level: string;
    threshold: number;
    description: string;
    image: string;
    traits: string[];
    unlocked: boolean;
}

const EVOLUTION_STAGES: EvolutionStage[] = [
    {
        level: "Apprentice",
        threshold: 0,
        description: "Starting your creative journey with basic tools",
        image: "🎨",
        traits: ["Basic Editing", "Color Adjustment"],
        unlocked: true
    },
    {
        level: "Artisan",
        threshold: 100,
        description: "Developing your craft with advanced techniques",
        image: "🖌️",
        traits: ["Advanced Filters", "RAW Processing", "Batch Editing"],
        unlocked: false
    },
    {
        level: "Maestro",
        threshold: 300,
        description: "Mastering your skills with professional tools",
        image: "🎭",
        traits: ["AI Enhancement", "Style Transfer", "Professional Workflow"],
        unlocked: false
    },
    {
        level: "Visionary",
        threshold: 600,
        description: "Leading the creative revolution with cutting-edge technology",
        image: "🌟",
        traits: ["AI Collaboration", "Blockchain Integration", "Community Leadership"],
        unlocked: false
    }
];

export function NFTEvolution() {
    const { address, isConnected } = useAccount();
    const { experience, levelIndex, hasAvatar } = useExperienceNFT();
    const [currentStage, setCurrentStage] = useState<EvolutionStage | null>(null);
    const [nextStage, setNextStage] = useState<EvolutionStage | null>(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!hasAvatar) return;

        // Find current stage based on experience
        let current = EVOLUTION_STAGES[0];
        let next = null;

        for (let i = EVOLUTION_STAGES.length - 1; i >= 0; i--) {
            if (experience >= EVOLUTION_STAGES[i].threshold) {
                current = EVOLUTION_STAGES[i];
                if (i < EVOLUTION_STAGES.length - 1) {
                    next = EVOLUTION_STAGES[i + 1];
                }
                break;
            }
        }

        setCurrentStage(current);
        setNextStage(next);

        // Calculate progress to next stage
        if (next) {
            const currentThreshold = current.threshold;
            const nextThreshold = next.threshold;
            const progressToNext = Math.min(100,
                ((experience - currentThreshold) / (nextThreshold - currentThreshold)) * 100
            );
            setProgress(progressToNext);
        } else {
            setProgress(100);
        }
    }, [experience, hasAvatar]);

    if (!isConnected) {
        return (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
                <h3 className="text-lg font-semibold mb-4">Connect to See Evolution</h3>
                <p className="text-muted-foreground">
                    Connect your wallet to see your avatar's evolution journey.
                </p>
            </div>
        );
    }

    if (!hasAvatar) {
        return (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
                <h3 className="text-lg font-semibold mb-4">Mint Your Avatar</h3>
                <p className="text-muted-foreground">
                    Mint your soulbound avatar to start your evolution journey.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h3 className="text-lg font-semibold mb-6">Avatar Evolution</h3>

            {/* Current Stage */}
            {currentStage && (
                <div className="mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="text-4xl">{currentStage.image}</div>
                        <div>
                            <h4 className="text-xl font-semibold">{currentStage.level}</h4>
                            <p className="text-sm text-muted-foreground">{currentStage.description}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {currentStage.traits.map((trait, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                                <span className="text-green-500">✓</span>
                                <span>{trait}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Progress to Next Stage */}
            {nextStage && (
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Progress to {nextStage.level}</span>
                        <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                    </div>

                    <div className="w-full bg-[var(--muted)] rounded-full h-2 mb-2">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{currentStage?.threshold} XP</span>
                        <span>{nextStage.threshold} XP</span>
                    </div>
                </div>
            )}

            {/* Evolution Timeline */}
            <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Evolution Timeline
                </h4>

                <div className="space-y-3">
                    {EVOLUTION_STAGES.map((stage, index) => {
                        const isUnlocked = experience >= stage.threshold;
                        const isCurrent = currentStage?.level === stage.level;

                        return (
                            <div
                                key={stage.level}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isCurrent
                                    ? 'border-[var(--foreground)] bg-[var(--muted)]'
                                    : isUnlocked
                                        ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                        : 'border-[var(--border)] bg-[var(--card)] opacity-60'
                                    }`}
                            >
                                <div className="text-2xl">{stage.image}</div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h5 className="font-medium">{stage.level}</h5>
                                        {isCurrent && (
                                            <span className="text-xs bg-[var(--foreground)] text-[var(--background)] px-2 py-1 rounded">
                                                Current
                                            </span>
                                        )}
                                        {isUnlocked && !isCurrent && (
                                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                                                Unlocked
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{stage.description}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {stage.traits.map((trait, traitIndex) => (
                                            <span
                                                key={traitIndex}
                                                className={`text-xs px-2 py-1 rounded ${isUnlocked
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                    : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                                                    }`}
                                            >
                                                {trait}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium">{stage.threshold} XP</div>
                                    {isUnlocked && (
                                        <div className="text-xs text-green-500">✓</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Evolution Benefits */}
            <div className="mt-6 p-4 bg-[var(--muted)] rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Evolution Benefits</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Unlock new editing tools and features</li>
                    <li>• Access to exclusive AI models and filters</li>
                    <li>• Priority access to new features and updates</li>
                    <li>• Community recognition and leadership opportunities</li>
                    <li>• Special NFT traits and metadata evolution</li>
                </ul>
            </div>
        </div>
    );
}
