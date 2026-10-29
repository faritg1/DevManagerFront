import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { authService, beginImpersonation, endImpersonation, organizationsService, platformService, rbacService, readImpersonation, reloadAt, type ImpersonationSession } from '../api';
import { ROUTES, STORAGE_KEYS } from '../config/constants';

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
    /** Set while a super admin acts as another user (persistent banner) */
    impersonation: ImpersonationSession | null;
    /** Super admin only: swaps to a short-lived session of that user and reloads the app as them */
    startImpersonation: (userId: string) => Promise<void>;
    /** Restores the super admin's own session and returns to the super admin area */
    stopImpersonation: () => Promise<void>;
}

interface RegisterData {
    name: string;
    email: string;
    password: string;
    organizationName?: string;
    entityType?: number;
}

const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>(initialState);

    useEffect(() => {
        const initAuth = () => {
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

            // El login tampoco devuelve el nombre de la organización
            let organizationName: string | undefined;
            try {
                const orgResp = await organizationsService.getCurrent();
                if (orgResp.success && orgResp.data) organizationName = orgResp.data.name;
            } catch {
                // Sin nombre: las vistas muestran "Sin definir"
            }

            const user: User = {
                id: userId,
                name: fullName,
                email,
                role,
                organizationId,
                organizationName,
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
                entityType: data.entityType,
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

            localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
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

    // Read once: every start/stop reloads the page
    const [impersonation] = useState(readImpersonation);

    const startImpersonation = useCallback(async (userId: string) => {
        const { data } = await platformService.impersonate(userId);
        beginImpersonation(data.token, {
            targetName: data.fullName,
            organizationName: data.organizationName,
            expiresAt: data.expiresAt,
        });

        // Same as login: the role comes from the (now impersonated) effective permissions
        let role = '';
        try {
            role = (await rbacService.getMyPermissions()).data?.roles?.[0]?.name ?? '';
        } catch {
            // Without a role the menu still follows the permissions
        }
        const user: User = {
            id: data.userId,
            name: data.fullName,
            email: data.email,
            role,
            organizationId: data.organizationId,
            organizationName: data.organizationName,
        };
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
        reloadAt(`#${ROUTES.DASHBOARD}`);
    }, []);

    const stopImpersonation = useCallback(async () => {
        try {
            await platformService.stopImpersonation();
        } catch {
            // Best effort: the log keeps the start; the token expires on its own
        }
        endImpersonation();
        reloadAt(`#${ROUTES.SUPER_ADMIN}`);
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
        impersonation,
        startImpersonation,
        stopImpersonation,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

