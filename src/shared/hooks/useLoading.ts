import { useState, useCallback } from 'react';

interface UseLoadingReturn {
    isLoading: boolean;
    startLoading: () => void;
    stopLoading: () => void;
    withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
}

export const useLoading = (initialState = false): UseLoadingReturn => {
    const [isLoading, setIsLoading] = useState(initialState);

    const startLoading = useCallback(() => setIsLoading(true), []);
    const stopLoading = useCallback(() => setIsLoading(false), []);

    const withLoading = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
        setIsLoading(true);
        try {
            return await fn();
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { isLoading, startLoading, stopLoading, withLoading };
};

export default useLoading;
