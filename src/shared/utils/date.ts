/**
 * Date formatting utilities
 */

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date: Date | string | number): string => {
    const now = new Date();
    const target = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
    if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
    
    return target.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    });
};

// Format date for display
export const formatDate = (
    date: Date | string | number, 
    options: Intl.DateTimeFormatOptions = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    },
    locale: string = 'es-ES'
): string => {
    return new Date(date).toLocaleDateString(locale, options);
};

// Format datetime for display
export const formatDateTime = (
    date: Date | string | number,
    locale: string = 'es-ES'
): string => {
    return new Date(date).toLocaleString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Format time only
export const formatTime = (
    date: Date | string | number,
    locale: string = 'es-ES'
): string => {
    return new Date(date).toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Get greeting based on time of day
export const getGreeting = (): string => {
    const hour = new Date().getHours();
    
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
};

// Check if date is today
export const isToday = (date: Date | string | number): boolean => {
    const today = new Date();
    const target = new Date(date);
    
    return (
        target.getDate() === today.getDate() &&
        target.getMonth() === today.getMonth() &&
        target.getFullYear() === today.getFullYear()
    );
};

// Format duration in milliseconds to human readable
export const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
};
