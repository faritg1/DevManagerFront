import React from 'react';

interface AvatarProps {
    src?: string;
    alt?: string;
    name?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    gradient?: string;
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
    gradient = 'from-primary to-primary-dark',
    className = '',
}) => {
    if (src) {
        return (
            <img
                src={src}
                alt={alt}
                className={`${sizeStyles[size]} rounded-full object-cover ${className}`}
            />
        );
    }

    return (
        <div
            className={`
                ${sizeStyles[size]} 
                rounded-full 
                bg-gradient-to-br ${gradient}
                flex items-center justify-center 
                text-white font-bold
                ${className}
            `}
        >
            {name ? getInitials(name) : '?'}
        </div>
    );
};

// Avatar Group Component
interface AvatarGroupProps {
    avatars: Array<{ src?: string; name?: string }>;
    max?: number;
    size?: AvatarProps['size'];
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
    avatars,
    max = 4,
    size = 'md',
}) => {
    const visibleAvatars = avatars.slice(0, max);
    const remaining = avatars.length - max;

    return (
        <div className="flex -space-x-3">
            {visibleAvatars.map((avatar, index) => (
                <Avatar
                    key={index}
                    src={avatar.src}
                    name={avatar.name}
                    size={size}
                    className="ring-2 ring-white dark:ring-[#16222b]"
                />
            ))}
            {remaining > 0 && (
                <div 
                    className={`
                        ${sizeStyles[size]} 
                        rounded-full 
                        bg-slate-100 dark:bg-[#111b22] 
                        ring-2 ring-white dark:ring-[#16222b] 
                        flex items-center justify-center 
                        text-slate-600 dark:text-slate-400 
                        font-bold
                    `}
                >
                    +{remaining}
                </div>
            )}
        </div>
    );
};

export default Avatar;
