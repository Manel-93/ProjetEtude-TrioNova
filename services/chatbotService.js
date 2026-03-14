import crypto from 'crypto';
import { ChatbotConversationModel } from '../models/ChatbotConversation.js';

const FAQ_ENTRIES = [
  {
    id: 'shipping_delay',
    keywords: ['livraison', 'délai', 'delai', 'expedition', 'expédition'],
    answer:
      'Les délais de livraison sont généralement de 3 à 5 jours ouvrés pour la France métropolitaine. Vous recevrez un email avec un lien de suivi dès l\'expédition de votre commande.'
  },
  {
    id: 'order_tracking',
    keywords: ['suivi', 'tracking', 'où est ma commande', 'ou est ma commande'],
    answer:
      'Pour suivre votre commande, connectez-vous à votre compte TrioNova et rendez-vous dans la rubrique "Mes commandes". Un lien de suivi est disponible pour chaque commande expédiée.'
  },
  {
    id: 'refund',
    keywords: ['remboursement', 'rembourser', 'retour', 'satisfait ou remboursé'],
    answer:
      'Vous disposez de 14 jours après réception pour demander un retour. Après validation et réception du produit, le remboursement est effectué sous 5 à 10 jours ouvrés.'
  }
];

export class ChatbotService {
  async getOrCreateConversation(sessionId, userId = null) {
    if (sessionId) {
      const existing = await ChatbotConversationModel.findOne({ sessionId });
      if (existing) {
        return existing;
      }
    }

    const newSessionId = sessionId || crypto.randomUUID();
    const conversation = new ChatbotConversationModel({
      sessionId: newSessionId,
      userId: userId || null,
      status: 'open',
      isEscalated: false,
      messages: []
    });

    await conversation.save();
    return conversation;
  }

  findFaqAnswer(message) {
    const normalized = message.toLowerCase();
    for (const faq of FAQ_ENTRIES) {
      if (faq.keywords.some((kw) => normalized.includes(kw))) {
        return faq;
      }
    }
    return null;
  }

  async handleMessage({ sessionId, message, userId = null, metadata = {} }) {
    const conversation = await this.getOrCreateConversation(sessionId, userId);

    conversation.messages.push({
      sender: 'user',
      message,
      metadata
    });

    const matchedFaq = this.findFaqAnswer(message);

    let botReply;
    let isEscalation = false;

    if (matchedFaq) {
      botReply = matchedFaq.answer;
    } else {
      botReply =
        'Je ne suis pas certain de pouvoir répondre précisément à votre question. ' +
        'Je transmets votre demande à un conseiller humain qui vous répondra dans les plus brefs délais.';
      isEscalation = true;
      conversation.isEscalated = true;
      conversation.status = 'pending_human';
    }

    conversation.messages.push({
      sender: 'bot',
      message: botReply,
      metadata,
      faqMatchedQuestion: matchedFaq ? matchedFaq.keywords[0] : null,
      faqMatchedAnswer: matchedFaq ? matchedFaq.answer : null,
      isEscalation
    });

    await conversation.save();

    return {
      sessionId: conversation.sessionId,
      reply: botReply,
      isEscalated: isEscalation,
      matchedFaq: matchedFaq
        ? {
            id: matchedFaq.id,
            answer: matchedFaq.answer
          }
        : null
    };
  }
}

