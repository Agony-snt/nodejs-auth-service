const yup = require('yup');

// Register validation schema
const registerSchema = yup.object().shape({
    firstname: yup
        .string()
        .required('First name is required')
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name must be less than 50 characters'),
    lastname: yup
        .string()
        .required('Last name is required')
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name must be less than 50 characters'),
    username: yup
        .string()
        .required('Username is required')
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be less than 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
    phone: yup
        .string()
        .required('Phone number is required')
        .matches(/(^(0?9)|(\+?989))\d{2}\W?\d{3}\W?\d{4}/g, 'Invalid phone number format'),
    email: yup
        .string()
        .nullable()
        .transform((value) => value === '' ? null : value)
        .email('Invalid email format'),
    password: yup
        .string()
        .required('Password is required')
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must be less than 100 characters')
});

// Login validation schema
const loginSchema = yup.object().shape({
    identifier: yup
        .string()
        .required('Username or phone is required'),
    password: yup
        .string()
        .required('Password is required')
});

// Profile update validation schema
const profileUpdateSchema = yup.object().shape({
    firstname: yup
        .string()
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name must be less than 50 characters'),
    lastname: yup
        .string()
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name must be less than 50 characters')
}).test(
    'at-least-one-field',
    'At least one field must be provided',
    (value) => value.firstname !== undefined || value.lastname !== undefined
);

// Change password validation schema
const changePasswordSchema = yup.object().shape({
    currentPassword: yup
        .string()
        .required('Current password is required'),
    newPassword: yup
        .string()
        .required('New password is required')
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must be less than 100 characters')
        .notOneOf([yup.ref('currentPassword')], 'New password must be different from current password')
});

// Verification code validation schema
const verificationSchema = yup.object().shape({
    verificationId: yup
        .string()
        .required('Verification ID is required'),
    code: yup
        .string()
        .required('Code is required')
        .length(6, 'Code must be 6 digits')
        .matches(/^\d+$/, 'Code must contain only numbers')
});

// Send code validation schema
const sendCodeSchema = yup.object().shape({
    type: yup
        .string()
        .required('Type is required')
        .oneOf(['phone', 'email', 'password'], 'Invalid verification type'),
    newValue: yup
        .string()
        .when('type', {
            is: (type) => type === 'phone' || type === 'email',
            then: (schema) => schema.required('New value is required for phone/email change'),
            otherwise: (schema) => schema.notRequired()
        })
});

// Add email validation schema
const addEmailSchema = yup.object().shape({
    email: yup
        .string()
        .required('Email is required')
        .email('Invalid email format')
});

// Delete account validation schema
const deleteAccountSchema = yup.object().shape({
    password: yup
        .string()
        .required('Password is required to delete account')
});

// Helper function to validate and return errors
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.validate(req.body, { abortEarly: false });
            next();
        } catch (err) {
            if (err.name === 'ValidationError') {
                const errors = err.errors || [err.message];
                return res.status(400).json({
                    success: false,
                    message: errors[0],
                    errors: errors
                });
            }
            next(err);
        }
    };
};

// Helper to wrap async validation
const validateAsync = (schema) => {
    return async (data) => {
        try {
            return { valid: true, data: await schema.validate(data, { abortEarly: false }) };
        } catch (err) {
            if (err.name === 'ValidationError') {
                return {
                    valid: false,
                    errors: err.errors,
                    message: err.errors[0]
                };
            }
            throw err;
        }
    };
};

module.exports = {
    registerSchema,
    loginSchema,
    profileUpdateSchema,
    changePasswordSchema,
    verificationSchema,
    sendCodeSchema,
    addEmailSchema,
    deleteAccountSchema,
    validate,
    validateAsync
};
