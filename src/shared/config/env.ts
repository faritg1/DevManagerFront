/**
 * Environment configuration
 */

interface EnvConfig {
    apiUrl: string;
    isDevelopment: boolean;
    isProduction: boolean;
    appName: string;
    appVersion: string;
}

const getEnvVar = (key: string, defaultValue: string = ''): string => {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return (import.meta.env as any)[key] || defaultValue;
    }
    return defaultValue;
};

export const env: EnvConfig = {
    apiUrl: getEnvVar('VITE_API_URL', 'http://localhost:5000/api'),
    isDevelopment: getEnvVar('MODE', 'development') === 'development',
    isProduction: getEnvVar('MODE', 'development') === 'production',
    appName: 'DevManager',
    appVersion: '1.0.0',
};

export default env;
