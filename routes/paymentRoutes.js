import express from 'express';
import { PaymentController } from '../controllers/paymentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { handleGuestToken } from '../middlewares/cartMiddleware.js';
import { verifyStripeWebhook } from '../middlewares/stripeWebhookMiddleware.js';

const router = express.Router();
const paymentController = new PaymentController();

// Route pour créer un PaymentIntent (authentifié ou invité)
// Nécessite le middleware handleGuestToken pour gérer les invités
router.post('/create-intent', handleGuestToken, paymentController.createPaymentIntent);

// Route webhook Stripe (pas d'authentification, vérification signature uniquement)
// NOTE: Le body brut est déjà configuré dans server.js pour cette route
router.post('/webhook', 
  verifyStripeWebhook,
  paymentController.handleWebhook
);

export default router;

