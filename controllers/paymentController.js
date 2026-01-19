import { StripeService } from '../services/stripeService.js';

export class PaymentController {
  constructor() {
    this.stripeService = new StripeService();
  }

  // Créer un PaymentIntent
  createPaymentIntent = async (req, res, next) => {
    try {
      const userId = req.user?.userId || null;
      const guestToken = req.guestToken || null;

      const result = await this.stripeService.createPaymentIntent(userId, guestToken);
      
      res.status(200).json({
        success: true,
        data: {
          paymentIntentId: result.paymentIntentId,
          clientSecret: result.clientSecret,
          amount: result.amount,
          currency: result.currency
        },
        message: 'PaymentIntent créé avec succès'
      });
    } catch (error) {
      next(error);
    }
  };

  // Gérer les webhooks Stripe
  handleWebhook = async (req, res, next) => {
    try {
      const event = req.stripeEvent;

      console.log('🔔 Webhook received:', {
        type: event.type,
        id: event.id,
        paymentIntentId: event.data?.object?.id
      });

      // Traiter l'événement
      const result = await this.stripeService.handleWebhookEvent(event);
      
      console.log('✅ Webhook processed:', {
        type: event.type,
        processed: result.processed
      });

      // Répondre rapidement à Stripe (dans les 3 secondes)
      res.status(200).json({
        success: true,
        received: true,
        processed: result.processed,
        eventType: result.eventType
      });
    } catch (error) {
      console.error('❌ Error in webhook handler:', error);
      // Répondre quand même 200 pour éviter que Stripe réessaie
      res.status(200).json({
        success: false,
        received: true,
        error: error.message
      });
    }
  };
}

