export const validateName = (
    value: string,
    fieldName: string,
    required = true,
) => {
    if (required && !value.trim()) {
        return `${fieldName} is required`;
    }
    if (value && !/^[a-zA-Z\s'-]*$/.test(value)) {
        return `${fieldName} can only contain letters and spaces`;
    }
    return '';
};

export const validateEmail = (value: string) => {
    if (!value.trim()) {
        return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
    }
    return '';
};

export const validatePhoneNumber = (value: string) => {
    if (value && !/^[0-9]{10,15}$/.test(value)) {
        return 'Phone number must be 10-15 digits only';
    }
    return '';
};

export const validatePassword = (value: string) => {
    if (!value) {
        return 'Password is required';
    }
    if (value.length < 8) {
        return 'Password must be at least 8 characters';
    }
    if (!/[a-zA-Z]/.test(value)) {
        return 'Password must contain at least one letter';
    }
    if (!/[0-9]/.test(value)) {
        return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        return 'Password must contain at least one symbol';
    }
    return '';
};

export const validatePasswordConfirmation = (
    value: string,
    password: string,
) => {
    if (!value) {
        return 'Password confirmation is required';
    }
    if (value !== password) {
        return 'Passwords do not match';
    }
    return '';
};
