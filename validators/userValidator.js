import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Le prénom doit contenir au moins 2 caractères',
    'string.max': 'Le prénom ne peut pas dépasser 100 caractères'
  }),
  lastName: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'string.max': 'Le nom ne peut pas dépasser 100 caractères'
  }),
  phone: Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).optional().messages({
    'string.pattern.base': 'Format de téléphone invalide'
  })
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la mise à jour'
});

export const addressSchema = Joi.object({
  type: Joi.string().valid('billing', 'shipping').required().messages({
    'any.only': 'Le type doit être "billing" ou "shipping"',
    'any.required': 'Le type est requis'
  }),
  firstName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Le prénom doit contenir au moins 2 caractères',
    'any.required': 'Le prénom est requis'
  }),
  lastName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'any.required': 'Le nom est requis'
  }),
  company: Joi.string().max(100).optional(),
  addressLine1: Joi.string().min(5).max(200).required().messages({
    'string.min': 'L\'adresse doit contenir au moins 5 caractères',
    'any.required': 'L\'adresse est requise'
  }),
  addressLine2: Joi.string().max(200).optional(),
  city: Joi.string().min(2).max(100).required().messages({
    'string.min': 'La ville doit contenir au moins 2 caractères',
    'any.required': 'La ville est requise'
  }),
  postalCode: Joi.string().pattern(/^[0-9A-Z\s-]{3,10}$/).required().messages({
    'string.pattern.base': 'Format de code postal invalide',
    'any.required': 'Le code postal est requis'
  }),
  country: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Le pays doit contenir au moins 2 caractères',
    'any.required': 'Le pays est requis'
  }),
  phone: Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).optional().messages({
    'string.pattern.base': 'Format de téléphone invalide'
  })
});

export const updateAddressSchema = Joi.object({
  firstName: Joi.string().min(2).max(100).optional(),
  lastName: Joi.string().min(2).max(100).optional(),
  company: Joi.string().max(100).optional(),
  addressLine1: Joi.string().min(5).max(200).optional(),
  addressLine2: Joi.string().max(200).optional(),
  city: Joi.string().min(2).max(100).optional(),
  postalCode: Joi.string().pattern(/^[0-9A-Z\s-]{3,10}$/).optional().messages({
    'string.pattern.base': 'Format de code postal invalide'
  }),
  country: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).optional().messages({
    'string.pattern.base': 'Format de téléphone invalide'
  })
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la mise à jour'
});

export const paymentMethodSchema = Joi.object({
  stripeCustomerId: Joi.string().required().messages({
    'any.required': 'L\'ID client Stripe est requis'
  }),
  stripePaymentMethodId: Joi.string().required().messages({
    'any.required': 'L\'ID méthode de paiement Stripe est requis'
  }),
  type: Joi.string().valid('card', 'bank_account').default('card').optional(),
  last4: Joi.string().length(4).optional(),
  brand: Joi.string().optional(),
  expiryMonth: Joi.number().min(1).max(12).optional(),
  expiryYear: Joi.number().min(new Date().getFullYear()).optional()
});

export const updateUserStatusSchema = Joi.object({
  is_active: Joi.boolean().required().messages({
    'any.required': 'Le statut is_active est requis'
  })
});

