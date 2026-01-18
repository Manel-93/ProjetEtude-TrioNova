import { getStripeClient } from '../config/stripe.js';
import { PaymentRepository } from '../repositories/paymentRepository.js';
import { CartService } from './cartService.js';

export class StripeService {
  constructor() {
    this.stripe = getStripeClient();
    this.paymentRepository = new PaymentRepository();
    this.cartService = new CartService();
  }

  // Créer un PaymentIntent
  async createPaymentIntent(userId, guestToken, cartId = null) {
    try {
      // Valider le panier et obtenir le total
      const validationResult = await this.cartService.validateCartStock(userId, guestToken);
      const cartData = validationResult.cart;
      
      if (!cartData.cart || !cartData.items || cartData.items.length === 0) {
        throw new Error('Le panier est vide');
      }

      const amount = Math.round(cartData.total * 100); // Convertir en centimes
      const currency = 'eur';

      // Créer le PaymentIntent avec Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        metadata: {
          userId: userId ? userId.toString() : null,
          cartId: cartData.cart.id.toString(),
          guestToken: guestToken || null
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Enregistrer le paiement en base de données
      const payment = await this.paymentRepository.create({
        userId: userId || null,
        cartId: cartData.cart.id,
        stripePaymentIntentId: paymentIntent.id,
        amount: cartData.total,
        currency: currency.toUpperCase(),
        status: 'pending',
        metadata: {
          cartItems: cartData.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.priceTtc
          })),
          subtotal: cartData.subtotal,
          tva: cartData.tva,
          total: cartData.total
        }
      });

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: cartData.total,
        currency: currency.toUpperCase(),
        payment: payment
      };
    } catch (error) {
      console.error('❌ Error creating payment intent:', error.message);
      throw error;
    }
  }

  // Gérer les événements webhook Stripe
  async handleWebhookEvent(event) {
    try {
      const paymentIntentId = event.data.object.id;
      let payment = await this.paymentRepository.findByPaymentIntentId(paymentIntentId);

      // Si le paiement n'existe pas encore, le créer (cas rare)
      if (!payment && event.type === 'payment_intent.created') {
        const paymentIntent = event.data.object;
        payment = await this.paymentRepository.create({
          userId: paymentIntent.metadata?.userId ? parseInt(paymentIntent.metadata.userId) : null,
          cartId: paymentIntent.metadata?.cartId ? parseInt(paymentIntent.metadata.cartId) : null,
          stripePaymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100, // Convertir de centimes en euros
          currency: paymentIntent.currency.toUpperCase(),
          status: this.mapStripeStatusToPaymentStatus(paymentIntent.status),
          metadata: paymentIntent.metadata
        });
      }

      // Mettre à jour le statut selon l'événement
      if (payment) {
        let newStatus = null;
        let metadata = null;

        switch (event.type) {
          case 'payment_intent.succeeded':
            newStatus = 'succeeded';
            metadata = {
              ...payment.metadata,
              succeededAt: new Date().toISOString(),
              chargeId: event.data.object.latest_charge
            };
            break;

          case 'payment_intent.payment_failed':
            newStatus = 'failed';
            metadata = {
              ...payment.metadata,
              failedAt: new Date().toISOString(),
              failureMessage: event.data.object.last_payment_error?.message || 'Payment failed'
            };
            break;

          case 'payment_intent.canceled':
            newStatus = 'canceled';
            metadata = {
              ...payment.metadata,
              canceledAt: new Date().toISOString()
            };
            break;

          case 'payment_intent.processing':
            newStatus = 'processing';
            break;

          case 'charge.refunded':
            newStatus = 'refunded';
            metadata = {
              ...payment.metadata,
              refundedAt: new Date().toISOString(),
              refundId: event.data.object.id
            };
            break;

          default:
            // Pour les autres événements, on ne change pas le statut
            return { processed: false, message: `Event type ${event.type} not handled` };
        }

        if (newStatus) {
          payment = await this.paymentRepository.updateStatus(paymentIntentId, newStatus, metadata);
        }
      }

      return {
        processed: true,
        payment: payment,
        eventType: event.type
      };
    } catch (error) {
      console.error('❌ Error handling webhook event:', error.message);
      throw error;
    }
  }

  // Mapper le statut Stripe vers notre statut de paiement
  mapStripeStatusToPaymentStatus(stripeStatus) {
    const statusMap = {
      'requires_payment_method': 'pending',
      'requires_confirmation': 'pending',
      'requires_action': 'pending',
      'processing': 'processing',
      'requires_capture': 'processing',
      'succeeded': 'succeeded',
      'canceled': 'canceled'
    };

    return statusMap[stripeStatus] || 'pending';
  }

  // Récupérer le statut d'un paiement
  async getPaymentStatus(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      const payment = await this.paymentRepository.findByPaymentIntentId(paymentIntentId);

      return {
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency
        },
        payment: payment
      };
    } catch (error) {
      console.error('❌ Error retrieving payment status:', error.message);
      throw error;
    }
  }
}

