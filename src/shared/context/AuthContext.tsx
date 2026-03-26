import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { authService, rbacService } from '../api';
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
            // Solo leer las keys propias del app (auth_token / auth_user).
            // NO hacer fallback a keys heredadas de otros sistemas: pueden tener
            // tokens expirados que causarían bucles de 401 → login → dashboard → 401.
            const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            const storedUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);

            if (token && storedUser) {
                try {
                    const raw = JSON.parse(storedUser);
                    const user: User = {
                        id: String(raw.id ?? ''),
                        name: raw.name ?? raw.nombreCompleto ?? '',
                        email: raw.email ?? '',
                        role: raw.role ?? raw.rol ?? '',
                        avatar: raw.avatar,
                        organizationId: raw.organizationId,
                        organizationName: raw.organizationName,
                    };
                    setState({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch {
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

    // Escuchar evento global de 401: resetear estado de React sin cambiar hash
    useEffect(() => {
        const handleUnauthorized = () => {
            setState({ ...initialState, isLoading: false });
        };
        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            const response = await authService.login({ email, password });

            if (!response.success || !response.data?.token) {
                throw new Error(response.message || 'Credenciales inválidas.');
            }

            const { userId, firstName, lastName, organizationId } = response.data;
            const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim();

            // El login no devuelve rol — lo obtenemos de los permisos efectivos
            let role = '';
            try {
                const permsResp = await rbacService.getUserEffectivePermissions(userId);
                if (permsResp.success && permsResp.data?.roles?.length) {
                    role = permsResp.data.roles[0].name;
                }
            } catch {
                // Si falla, continuamos sin rol (el usuario podrá ver contenido básico)
            }

            const user: User = {
                id: userId,
                name: fullName,
                email,
                role,
                organizationId,
            };

            localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
            setState({ user, token: response.data.token, isAuthenticated: true, isLoading: false });
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
