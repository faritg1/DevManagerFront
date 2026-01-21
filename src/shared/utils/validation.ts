/**
 * Form validation utilities
 */

export type ValidationRule = (value: any, values?: any) => string | undefined;

// Common validation rules
export const required = (message = 'Este campo es requerido'): ValidationRule => {
    return (value) => {
        if (value === undefined || value === null || value === '') {
            return message;
        }
        return undefined;
    };
};

export const email = (message = 'Email inválido'): ValidationRule => {
    return (value) => {
        if (!value) return undefined;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? undefined : message;
    };
};

export const minLength = (length: number, message?: string): ValidationRule => {
    return (value) => {
        if (!value) return undefined;
        return value.length >= length 
            ? undefined 
            : message || `Mínimo ${length} caracteres`;
    };
};

export const maxLength = (length: number, message?: string): ValidationRule => {
    return (value) => {
        if (!value) return undefined;
        return value.length <= length 
            ? undefined 
            : message || `Máximo ${length} caracteres`;
    };
};

export const pattern = (regex: RegExp, message: string): ValidationRule => {
    return (value) => {
        if (!value) return undefined;
        return regex.test(value) ? undefined : message;
    };
};

export const min = (minValue: number, message?: string): ValidationRule => {
    return (value) => {
        if (value === undefined || value === null) return undefined;
        return Number(value) >= minValue 
            ? undefined 
            : message || `El valor mínimo es ${minValue}`;
    };
};

export const max = (maxValue: number, message?: string): ValidationRule => {
    return (value) => {
        if (value === undefined || value === null) return undefined;
        return Number(value) <= maxValue 
            ? undefined 
            : message || `El valor máximo es ${maxValue}`;
    };
};

export const match = (fieldName: string, message?: string): ValidationRule => {
    return (value, values) => {
        if (!value || !values) return undefined;
        return value === values[fieldName] 
            ? undefined 
            : message || `Los campos no coinciden`;
    };
};

// Combine multiple validation rules
export const composeValidators = (...validators: ValidationRule[]): ValidationRule => {
    return (value, values) => {
        for (const validator of validators) {
            const error = validator(value, values);
            if (error) return error;
        }
        return undefined;
    };
};

// Validate entire form
export const validateForm = <T extends Record<string, any>>(
    values: T,
    rules: Partial<Record<keyof T, ValidationRule>>
): Partial<Record<keyof T, string>> => {
    const errors: Partial<Record<keyof T, string>> = {};

    Object.keys(rules).forEach((key) => {
        const rule = rules[key as keyof T];
        if (rule) {
            const error = rule(values[key as keyof T], values);
            if (error) {
                errors[key as keyof T] = error;
            }
        }
    });

    return errors;
};
