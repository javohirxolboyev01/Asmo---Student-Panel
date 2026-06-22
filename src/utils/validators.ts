// Validators

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Username validation
export const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Phone number validation
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

// URL validation
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Required field validation
export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

// Min length validation
export const validateMinLength = (value: string, min: number): boolean => {
  return value.length >= min;
};

// Max length validation
export const validateMaxLength = (value: string, max: number): boolean => {
  return value.length <= max;
};

// Number range validation
export const validateRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

// Match validation (e.g., password confirmation)
export const validateMatch = (value: string, matchValue: string): boolean => {
  return value === matchValue;
};

// Form validation helper
export const validateField = (
  value: string,
  rules: {
    required?: boolean;
    email?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  }
): { isValid: boolean; error?: string } => {
  if (rules.required && !validateRequired(value)) {
    return { isValid: false, error: 'This field is required' };
  }

  if (rules.email && !validateEmail(value)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  if (rules.minLength && !validateMinLength(value, rules.minLength)) {
    return { isValid: false, error: `Minimum length is ${rules.minLength} characters` };
  }

  if (rules.maxLength && !validateMaxLength(value, rules.maxLength)) {
    return { isValid: false, error: `Maximum length is ${rules.maxLength} characters` };
  }

  if (rules.pattern && !rules.pattern.test(value)) {
    return { isValid: false, error: 'Invalid format' };
  }

  return { isValid: true };
};
