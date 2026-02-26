import React from 'react';

export interface Level {
    id: number;
    name: string;
}

interface LevelSelectorProps {
    levels: Level[];
    selectedId: number;
    onSelect: (id: number) => void;
    className?: string;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
    levels,
    selectedId,
    onSelect,
    className = '',
}) => {
    return (
        <div className={`grid grid-cols-3 sm:grid-cols-5 gap-2 ${className}`}>
            {levels.map(level => (
                <button
                    key={level.id}
                    type="button"
                    title={level.name}
                    onClick={() => onSelect(level.id)}
                    className={`
                        flex flex-col items-center p-3 rounded-xl border transition-all min-w-[60px] max-w-[80px]
                        ${selectedId === level.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-slate-200 dark:border-[#233948] hover:border-primary/50'
                        }
                    `}
                >
                    <p className="text-lg font-bold leading-tight">{level.id}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-normal break-words text-center">
                        {level.name}
                    </p>
                </button>
            ))}
        </div>
    );
};

export default LevelSelector;