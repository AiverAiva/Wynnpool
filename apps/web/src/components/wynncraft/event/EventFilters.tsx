'use client'

import { DualSlider } from '@/components/ui/dual-slider'

interface EventFiltersProps {
    difficulty: string[]
    onDifficultyChange: (d: string[]) => void
    levelRange: [number, number]
    onLevelRangeChange: (range: [number, number]) => void
    levelMin: number
    levelMax: number
    length: string[]
    onLengthChange: (l: string[]) => void
}

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD']
const LENGTHS = ['SHORT', 'MEDIUM', 'LONG']

const difficultyBadge: Record<string, { active: string }> = {
    EASY: { active: 'bg-green-500/15 text-green-400 border-green-500/30' },
    MEDIUM: { active: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
    HARD: { active: 'bg-red-500/15 text-red-400 border-red-500/30' },
}

export default function EventFilters({
    difficulty,
    onDifficultyChange,
    levelRange,
    onLevelRangeChange,
    levelMin,
    levelMax,
    length,
    onLengthChange,
}: EventFiltersProps) {
    const toggleDifficulty = (d: string) => {
        if (difficulty.includes(d)) {
            onDifficultyChange(difficulty.filter((x) => x !== d))
        } else {
            onDifficultyChange([...difficulty, d])
        }
    }

    const toggleLength = (l: string) => {
        if (length.includes(l)) {
            onLengthChange(length.filter((x) => x !== l))
        } else {
            onLengthChange([...length, l])
        }
    }

    const hasFilters = difficulty.length > 0 || length.length > 0 || levelRange[0] !== levelMin || levelRange[1] !== levelMax

    return (
        <div className="space-y-5">
            {/* Difficulty */}
            <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2">Difficulty</p>
                <div className="flex flex-wrap gap-1.5">
                    {DIFFICULTIES.map((d) => {
                        const active = difficulty.includes(d)
                        const style = difficultyBadge[d]
                        return (
                            <button
                                key={d}
                                onClick={() => toggleDifficulty(d)}
                                className={`text-[11px] px-2.5 py-1 rounded-full uppercase tracking-widest font-medium border transition-colors ${
                                    active
                                        ? style.active
                                        : 'bg-transparent text-muted-foreground border-border hover:border-foreground/20'
                                }`}
                            >
                                {d}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Level Range */}
            <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2">
                    Level {levelRange[0]} — {levelRange[1]}
                </p>
                <DualSlider
                    min={levelMin}
                    max={levelMax}
                    step={1}
                    value={levelRange}
                    onValueChange={onLevelRangeChange}
                />
            </div>

            {/* Length */}
            <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2">Length</p>
                <div className="flex flex-wrap gap-1.5">
                    {LENGTHS.map((l) => {
                        const active = length.includes(l)
                        return (
                            <button
                                key={l}
                                onClick={() => toggleLength(l)}
                                className={`text-[11px] px-2.5 py-1 rounded-full uppercase tracking-widest font-medium border transition-colors ${
                                    active
                                        ? 'bg-primary text-primary-foreground border-transparent'
                                        : 'bg-transparent text-muted-foreground border-border hover:border-foreground/20'
                                }`}
                            >
                                {l}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Clear all */}
            {hasFilters && (
                <button
                    onClick={() => {
                        onDifficultyChange([])
                        onLengthChange([])
                        onLevelRangeChange([levelMin, levelMax])
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                >
                    Clear all filters
                </button>
            )}
        </div>
    )
}
