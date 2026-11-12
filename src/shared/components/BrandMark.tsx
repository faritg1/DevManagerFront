import React from 'react';

interface Props {
    /** Side in px. A `size-*` class in `className` overrides it for responsive sizes. */
    size?: number;
    className?: string;
    /** Accessible name. Omit it when the mark sits next to the product name (decorative). */
    title?: string;
}

/** Product isotype: two pieces closing around a shared core. Same geometry as public/favicon.svg. */
export const BrandMark: React.FC<Props> = ({ size = 32, className = '', title }) => (
    <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill="none"
        strokeWidth={10}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`shrink-0 ${className}`}
        role={title ? 'img' : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : true}
    >
        <path className="stroke-primary-600 dark:stroke-primary" d="M12 36V12h24M52 28v24H28" />
        <circle className="fill-primary dark:fill-primary-400" cx="32" cy="32" r="6" />
    </svg>
);
