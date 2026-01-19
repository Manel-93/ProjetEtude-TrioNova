import express from 'express';
import { OrderController } from '../controllers/orderController.js';
import { InvoiceController } from '../controllers/invoiceController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/adminMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { updateOrderStatusSchema } from '../validators/orderValidator.js';

const router = express.Router();
const orderController = new OrderController();
const invoiceController = new InvoiceController();

// Routes commandes (utilisateur authentifié)
router.get('/', authenticate, orderController.getMyOrders);
router.get('/:id', authenticate, orderController.getOrderById);

// Routes commandes (admin)
router.get('/admin/orders', authenticate, isAdmin, orderController.getAllOrders);
router.post('/admin/orders/:id/status', authenticate, isAdmin, validate(updateOrderStatusSchema), orderController.updateOrderStatus);

// Routes factures
router.get('/invoices/:id/pdf', authenticate, invoiceController.getInvoicePDF);

export default router;

