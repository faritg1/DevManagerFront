import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { authService } from '../api';
import { STORAGE_KEYS } from '../config/constants';

// Types
export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    organizationId?: string;
    organizationName?: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

interface AuthContextValue extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
}

interface RegisterData {
    name: string;
    email: string;
    password: string;
    organizationName?: string;
}

// Initial state
const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
};

// Context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Provider
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>(initialState);

    // Initialize auth state from storage
    useEffect(() => {
        const initAuth = async () => {
            // El token puede estar en 'auth_token' (nuestro formato) o en 'token' (formato heredado)
            const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
                ?? localStorage.getItem('token');
            // El usuario puede estar en 'auth_user' (nuestro formato) o en 'user' (formato heredado)
            const storedUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER)
                ?? localStorage.getItem('user');

            if (token && storedUser) {
                try {
                    const raw = JSON.parse(storedUser);

                    // Si el auth_user guardado no tiene rol (fue guardado con el formato
                    // antiguo donde los campos API en español quedaron como undefined),
                    // intentamos rescatar el rol desde la key 'user' heredada del backend.
                    let roleResolved = raw.role ?? raw.rol ?? '';
                    let nameResolved = raw.name ?? raw.nombreCompleto ?? '';
                    let idResolved = raw.id ? String(raw.id) : '';

                    if (!roleResolved || !idResolved) {
                        const legacyRaw = localStorage.getItem('user');
                        if (legacyRaw) {
                            try {
                                const legacy = JSON.parse(legacyRaw);
                                roleResolved = roleResolved || legacy.rol || legacy.role || '';
                                nameResolved = nameResolved || legacy.nombreCompleto || legacy.name || '';
                                idResolved = idResolved || String(legacy.id ?? '');
                            } catch { /* ignorar si falla el parse */ }
                        }
                    }

                    const user: User = {
                        id: idResolved,
                        name: nameResolved,
                        email: raw.email ?? '',
                        role: roleResolved,
                        avatar: raw.avatar,
                        organizationId: raw.organizationId,
                        organizationName: raw.organizationName,
                    };

                    // Reescribir auth_user con el objeto ya normalizado
                    // para que las próximas recargas no necesiten el fallback
                    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));

                    setState({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch {
                    // Token invalid, clear storage
                    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
                    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
                    setState({ ...initialState, isLoading: false });
                }
            } else {
                setState({ ...initialState, isLoading: false });
            }
        };

        initAuth();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            const response = await authService.login({ email, password });

            if (!response.success || !response.data) {
                throw new Error(response.message || 'Error al iniciar sesión');
            }

            const { token, id, nombreCompleto, rol, organizationId, organizationName } = response.data;

            const user: User = {
                id: String(id),
                name: nombreCompleto,
                email: email,
                role: rol,
                organizationId: organizationId,
                organizationName: organizationName,
            };

            setState({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error) {
            setState(prev => ({ ...prev, isLoading: false }));
            throw error;
        }
    }, []);

    const register = useCallback(async (data: RegisterData) => {
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            const response = await authService.registerOrganization({
                organizationName: data.organizationName || 'Mi Organización',
                adminEmail: data.email,
                adminPassword: data.password,
                adminFullName: data.name,
            });

            if (!response.success || !response.data) {
                throw new Error(response.message || 'Error al registrar organización');
            }

            const { token, adminUserId, adminEmail, organizationId, organizationName } = response.data;

            const user: User = {
                id: adminUserId,
                name: data.name,
                email: adminEmail,
                role: 'Admin',
                organizationId: organizationId,
                organizationName: organizationName,
            };

            setState({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error) {
            setState(prev => ({ ...prev, isLoading: false }));
            throw error;
        }
    }, []);

    const logout = useCallback(() => {
        authService.logout();
        setState({ ...initialState, isLoading: false });
    }, []);

    const updateUser = useCallback((updates: Partial<User>) => {
        setState(prev => {
            if (!prev.user) return prev;
            
            const updatedUser = { ...prev.user, ...updates };
            localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(updatedUser));
            
            return { ...prev, user: updatedUser };
        });
    }, []);

    const value: AuthContextValue = {
        ...state,
        login,
        register,
        logout,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook
export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
