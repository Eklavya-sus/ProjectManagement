import Joi from 'joi';

export const sendInviteSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  orgId: Joi.string().required().messages({
    'any.required': 'Organization ID is required'
  })
});

// Reuse existing registerSchema for accept invite
export const acceptInviteSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required'
  }),
  password: Joi.string().min(6).pattern(RegExp('^[a-zA-Z0-9]{6,30}$')).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.pattern.base': 'Password must contain only alphanumeric characters and be 6-30 characters long',
    'any.required': 'Password is required'
  })
});