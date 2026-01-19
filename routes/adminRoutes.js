import express from 'express';
import { Admin2FAController } from '../controllers/admin2faController.js';
import { DashboardController } from '../controllers/dashboardController.js';
import { ContactMessageController } from '../controllers/contactMessageController.js';
import { AdminController } from '../controllers/adminController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/adminMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { logAdminActivity } from '../middlewares/adminActivityLogMiddleware.js';
import {
  enable2FASchema,
  resetUserPasswordSchema
} from '../validators/adminValidator.js';
import {
  createContactMessageSchema,
  updateContactMessageStatusSchema
} from '../validators/contactMessageValidator.js';

const router = express.Router();
const admin2faController = new Admin2FAController();
const dashboardController = new DashboardController();
const contactMessageController = new ContactMessageController();
const adminController = new AdminController();

// Routes 2FA Admin
router.get('/2fa/status', authenticate, isAdmin, admin2faController.getStatus);
router.post('/2fa/generate', authenticate, isAdmin, logAdminActivity('2FA_GENERATE'), admin2faController.generateSecret);
router.post('/2fa/enable', authenticate, isAdmin, validate(enable2FASchema), logAdminActivity('2FA_ENABLE'), admin2faController.enable2FA);
router.post('/2fa/disable', authenticate, isAdmin, logAdminActivity('2FA_DISABLE'), admin2faController.disable2FA);

// Routes Dashboard
router.get('/dashboard', authenticate, isAdmin, dashboardController.getDashboard);
router.get('/dashboard/revenue', authenticate, isAdmin, dashboardController.getRevenue);
router.get('/dashboard/sales-by-category', authenticate, isAdmin, dashboardController.getSalesByCategory);
router.get('/dashboard/stock-alerts', authenticate, isAdmin, dashboardController.getStockAlerts);

// Routes Messages de contact
router.post('/contact-messages', validate(createContactMessageSchema), contactMessageController.create);
router.get('/contact-messages', authenticate, isAdmin, contactMessageController.getAll);
router.get('/contact-messages/stats', authenticate, isAdmin, contactMessageController.getStats);
router.get('/contact-messages/:id', authenticate, isAdmin, contactMessageController.getById);
router.patch('/contact-messages/:id/status', authenticate, isAdmin, validate(updateContactMessageStatusSchema), logAdminActivity('CONTACT_MESSAGE_UPDATE', 'contact_message'), contactMessageController.updateStatus);

// Routes Admin Utilisateurs (supplémentaires)
router.post('/users/:id/reset-password', authenticate, isAdmin, validate(resetUserPasswordSchema), logAdminActivity('USER_RESET_PASSWORD', 'user'), adminController.resetUserPassword);
router.get('/users/:id/revenue-stats', authenticate, isAdmin, adminController.getUserRevenueStats);

export default router;

