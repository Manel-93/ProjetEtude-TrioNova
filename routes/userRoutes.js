import express from 'express';
import { UserController } from '../controllers/userController.js';
import { AdminController } from '../controllers/adminController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/adminMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import {
  updateProfileSchema,
  addressSchema,
  updateAddressSchema,
  paymentMethodSchema,
  updateUserStatusSchema
} from '../validators/userValidator.js';

const router = express.Router();
const userController = new UserController();
const adminController = new AdminController();

// Routes utilisateur (authentifié)
router.get('/me', authenticate, userController.getMyProfile);
router.patch('/me', authenticate, validate(updateProfileSchema), userController.updateMyProfile);
router.delete('/me', authenticate, userController.deleteMyAccount);
router.get('/me/login-history', authenticate, userController.getMyLoginHistory);

// Routes adresses
router.get('/me/addresses', authenticate, userController.getMyAddresses);
router.post('/me/addresses', authenticate, validate(addressSchema), userController.createAddress);
router.patch('/me/addresses/:id', authenticate, validate(updateAddressSchema), userController.updateAddress);
router.patch('/me/addresses/:id/default', authenticate, userController.setDefaultAddress);
router.delete('/me/addresses/:id', authenticate, userController.deleteAddress);

// Routes méthodes de paiement
router.get('/me/payment-methods', authenticate, userController.getMyPaymentMethods);
router.post('/me/payment-methods', authenticate, validate(paymentMethodSchema), userController.createPaymentMethod);
router.patch('/me/payment-methods/:id/default', authenticate, userController.setDefaultPaymentMethod);
router.delete('/me/payment-methods/:id', authenticate, userController.deletePaymentMethod);

// Routes admin (authentifié + admin)
router.get('/admin/users', authenticate, isAdmin, adminController.getAllUsers);
router.get('/admin/users/:id', authenticate, isAdmin, adminController.getUserById);
router.patch('/admin/users/:id/status', authenticate, isAdmin, validate(updateUserStatusSchema), adminController.updateUserStatus);
router.delete('/admin/users/:id', authenticate, isAdmin, adminController.deleteUser);

export default router;

