import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { apiClient, API_ENDPOINTS } from '../api';

// Types
export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    organizationId?: string;
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

// Storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Provider
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>(initialState);

    // Initialize auth state from storage
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem(TOKEN_KEY);
            const storedUser = localStorage.getItem(USER_KEY);

            if (token && storedUser) {
                try {
                    // Optionally verify token with backend
                    // const { data } = await apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
                    const user = JSON.parse(storedUser);
                    setState({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch {
                    // Token invalid, clear storage
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem(USER_KEY);
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
            // TODO: Uncomment when backend is ready
            // const { data } = await apiClient.post<{ user: User; token: string }>(
            //     API_ENDPOINTS.AUTH.LOGIN,
            //     { email, password }
            // );

            // Mock login for now
            const mockUser: User = {
                id: '1',
                name: 'Sofia Martinez',
                email: email,
                role: 'Admin',
                avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
            };
            const mockToken = 'mock-jwt-token';

            localStorage.setItem(TOKEN_KEY, mockToken);
            localStorage.setItem(USER_KEY, JSON.stringify(mockUser));

            setState({
                user: mockUser,
                token: mockToken,
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
            // TODO: Uncomment when backend is ready
            // const { data: response } = await apiClient.post<{ user: User; token: string }>(
            //     API_ENDPOINTS.AUTH.REGISTER,
            //     data
            // );

            // Mock registration
            const mockUser: User = {
                id: '1',
                name: data.name,
                email: data.email,
                role: 'Admin',
            };
            const mockToken = 'mock-jwt-token';

            localStorage.setItem(TOKEN_KEY, mockToken);
            localStorage.setItem(USER_KEY, JSON.stringify(mockUser));

            setState({
                user: mockUser,
                token: mockToken,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error) {
            setState(prev => ({ ...prev, isLoading: false }));
            throw error;
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setState({ ...initialState, isLoading: false });
    }, []);

    const updateUser = useCallback((updates: Partial<User>) => {
        setState(prev => {
            if (!prev.user) return prev;
            
            const updatedUser = { ...prev.user, ...updates };
            localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
            
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
