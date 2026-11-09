import React from 'react';

interface AvatarProps {
    src?: string;
    alt?: string;
    name?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeStyles = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
};

const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({
    src,
    alt = 'Avatar',
    name,
    size = 'md',
    className = '',
}) => {
    if (src) {
        return (
            <img
                src={src}
                alt={alt}
                className={`${sizeStyles[size]} shrink-0 rounded-full object-cover ${className}`}
            />
        );
    }

    return (
        <div
            className={`
                ${sizeStyles[size]} 
                shrink-0 rounded-full 
                bg-primary-600
                flex items-center justify-center 
                text-white font-semibold
                ${className}
            `}
        >
            {name ? getInitials(name) : '?'}
        </div>
    );
};

