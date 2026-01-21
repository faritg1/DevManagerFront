/**
 * Utility functions for common operations
 */

// Class name utility (like clsx/classnames)
export const cn = (...classes: (string | boolean | undefined | null)[]): string => {
    return classes.filter(Boolean).join(' ');
};

// Generate initials from name
export const getInitials = (name: string, maxLength: number = 2): string => {
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .slice(0, maxLength)
        .join('')
        .toUpperCase();
};

// Format currency
export const formatCurrency = (
    value: number, 
    currency: string = 'USD', 
    locale: string = 'en-US'
): string => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
    }).format(value);
};

// Format percentage
export const formatPercentage = (value: number, decimals: number = 0): string => {
    return `${value.toFixed(decimals)}%`;
};

// Format number with separators
export const formatNumber = (value: number, locale: string = 'en-US'): string => {
    return new Intl.NumberFormat(locale).format(value);
};

// Truncate text
export const truncate = (text: string, maxLength: number, suffix: string = '...'): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - suffix.length) + suffix;
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): ((...args: Parameters<T>) => void) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
    fn: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Sleep/delay utility
export const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// Generate unique ID
export const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
};

// Check if object is empty
export const isEmpty = (obj: object): boolean => {
    return Object.keys(obj).length === 0;
};

// Pick specific keys from object
export const pick = <T extends object, K extends keyof T>(
    obj: T, 
    keys: K[]
): Pick<T, K> => {
    return keys.reduce((acc, key) => {
        if (key in obj) acc[key] = obj[key];
        return acc;
    }, {} as Pick<T, K>);
};

// Omit specific keys from object
export const omit = <T extends object, K extends keyof T>(
    obj: T, 
    keys: K[]
): Omit<T, K> => {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
};
