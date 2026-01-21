import { useState, useCallback, ChangeEvent } from 'react';

type FormValues = Record<string, any>;
type FormErrors<T> = Partial<Record<keyof T, string>>;
type ValidationRules<T> = Partial<Record<keyof T, (value: any, values: T) => string | undefined>>;

interface UseFormReturn<T extends FormValues> {
    values: T;
    errors: FormErrors<T>;
    touched: Partial<Record<keyof T, boolean>>;
    isValid: boolean;
    isDirty: boolean;
    handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleBlur: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    setValue: (name: keyof T, value: any) => void;
    setError: (name: keyof T, error: string) => void;
    reset: () => void;
    validate: () => boolean;
}

export const useForm = <T extends FormValues>(
    initialValues: T,
    validationRules?: ValidationRules<T>
): UseFormReturn<T> => {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<FormErrors<T>>({});
    const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
    const [isDirty, setIsDirty] = useState(false);

    const validateField = useCallback((name: keyof T, value: any): string | undefined => {
        if (!validationRules || !validationRules[name]) return undefined;
        return validationRules[name]!(value, values);
    }, [validationRules, values]);

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        
        setValues(prev => ({ ...prev, [name]: newValue }));
        setIsDirty(true);

        // Validate on change if field has been touched
        if (touched[name as keyof T]) {
            const error = validateField(name as keyof T, newValue);
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    }, [touched, validateField]);

    const handleBlur = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        
        const error = validateField(name as keyof T, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    }, [validateField]);

    const setValue = useCallback((name: keyof T, value: any) => {
        setValues(prev => ({ ...prev, [name]: value }));
        setIsDirty(true);
    }, []);

    const setError = useCallback((name: keyof T, error: string) => {
        setErrors(prev => ({ ...prev, [name]: error }));
    }, []);

    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsDirty(false);
    }, [initialValues]);

    const validate = useCallback((): boolean => {
        if (!validationRules) return true;

        const newErrors: FormErrors<T> = {};
        let isValid = true;

        Object.keys(validationRules).forEach(key => {
            const error = validateField(key as keyof T, values[key as keyof T]);
            if (error) {
                newErrors[key as keyof T] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    }, [validationRules, values, validateField]);

    const isValid = Object.keys(errors).length === 0;

    return {
        values,
        errors,
        touched,
        isValid,
        isDirty,
        handleChange,
        handleBlur,
        setValue,
        setError,
        reset,
        validate,
    };
};

export default useForm;
