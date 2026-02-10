import React, { createContext, useContext, useEffect, useState } from 'react';
import { configService } from '../api';
import { AllConfigCatalogsDto } from '../api/types';
import { useNotification } from './NotificationContext';

interface ConfigContextType {
    catalogs: AllConfigCatalogsDto | null;
    isLoading: boolean;
    error: string | null;
    refreshCatalogs: () => Promise<void>;
}

export const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
};

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [catalogs, setCatalogs] = useState<AllConfigCatalogsDto | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { showNotification } = useNotification();

    const fetchCatalogs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await configService.getAll();
            if (response.success) {
                setCatalogs(response.data);
            } else {
                setError(response.message || 'Error al cargar configuraciones');
                showNotification({
                    type: 'error',
                    message: 'Error al cargar catálogos del sistema'
                });
            }
        } catch (err) {
            setError('Error de conexión al cargar configuraciones');
            console.error('Error fetching configs:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCatalogs();
    }, []);

    return (
        <ConfigContext.Provider value={{ catalogs, isLoading, error, refreshCatalogs: fetchCatalogs }}>
            {children}
        </ConfigContext.Provider>
    );
};