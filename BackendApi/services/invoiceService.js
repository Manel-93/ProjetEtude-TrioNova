import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { InvoiceRepository } from '../repositories/invoiceRepository.js';
import { OrderRepository } from '../repositories/orderRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { EmailService } from './emailService.js';
import { getMySQLConnection } from '../config/database.js';
import { renderCreditNoteDocument, renderInvoiceDocument } from '../utils/billingPdfLayout.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Statuts pour lesquels une facture peut être émise (paiement validé ou commande finalisée). */
const INVOICE_ELIGIBLE_ORDER_STATUSES = ['processing', 'completed'];

export class InvoiceService {
  constructor() {
    this.invoiceRepository = new InvoiceRepository();
    this.orderRepository = new OrderRepository();
    this.userRepository = new UserRepository();
    this.emailService = new EmailService();
    
    // Créer le dossier invoices s'il n'existe pas
    this.invoicesDir = path.join(__dirname, '..', 'invoices');
    if (!fs.existsSync(this.invoicesDir)) {
      fs.mkdirSync(this.invoicesDir, { recursive: true });
    }
  }

  // Créer une facture à partir d'une commande
  async createInvoiceFromOrder(orderId) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Commande introuvable');
    }

    // Vérifier si une facture existe déjà
    const existingInvoice = await this.invoiceRepository.findByOrderId(orderId);
    if (existingInvoice) {
      return existingInvoice;
    }

    if (!INVOICE_ELIGIBLE_ORDER_STATUSES.includes(order.status)) {
      throw new Error(
        'La facture ne peut être générée que pour une commande payée (en traitement ou finalisée)'
      );
    }

    // Créer la facture
    const invoice = await this.invoiceRepository.create({
      orderId: orderId,
      userId: order.userId,
      subtotal: order.subtotal,
      tva: order.tva,
      total: order.total,
      currency: order.currency,
      status: 'draft',
      metadata: {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt
      }
    });

    // Générer le PDF et mettre à jour le statut
    await this.generateInvoicePDF(invoice.id);

    return invoice;
  }

  // Générer le PDF d'une facture
  async generateInvoicePDF(invoiceId) {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new Error('Facture introuvable');
    }

    const order = await this.orderRepository.findById(invoice.orderId);
    if (!order) {
      throw new Error('Commande introuvable');
    }

    const items = await this.orderRepository.getOrderItems(invoice.orderId);
    
    let user = null;
    if (invoice.userId) {
      user = await this.userRepository.findById(invoice.userId);
    }

    const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
    const filename = `invoice_${invoice.invoiceNumber}.pdf`;
    const filepath = path.join(this.invoicesDir, filename);

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    renderInvoiceDocument(doc, { invoice, order, items, user });

    doc.end();

    // Attendre que le stream soit terminé
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // Mettre à jour la facture avec le chemin du PDF et le statut
    await this.invoiceRepository.updateStatus(invoiceId, 'issued', filepath);

    return filepath;
  }

  // Récupérer une facture par ID
  async getInvoiceById(invoiceId, userId = null) {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new Error('Facture introuvable');
    }

    // Vérifier que l'utilisateur peut accéder à cette facture
    if (userId) {
      // Si l'utilisateur est connecté, vérifier qu'il est propriétaire
      // Si invoice.userId correspond, autoriser
      if (invoice.userId && invoice.userId === userId) {
        return invoice;
      }
      
      // Si invoice.userId est null ou différent, vérifier via la commande associée
      if (invoice.orderId) {
        try {
          const order = await this.orderRepository.findById(invoice.orderId);
          // Si la commande appartient à l'utilisateur connecté, autoriser
          if (order && order.userId === userId) {
            return invoice;
          }
          // Si la commande n'appartient pas à l'utilisateur, refuser
          if (order && order.userId && order.userId !== userId) {
            throw new Error('Accès non autorisé à cette facture');
          }
        } catch (error) {
          if (error.message === 'Accès non autorisé à cette facture') {
            throw error;
          }
          console.warn('⚠️ Could not verify order for invoice access:', error.message);
        }
      }
      
      // Si invoice.userId existe mais est différent de userId, refuser
      if (invoice.userId && invoice.userId !== userId) {
        throw new Error('Accès non autorisé à cette facture');
      }
      
      // Si on arrive ici, invoice.userId est null et on n'a pas pu vérifier via la commande
      // Autoriser par défaut si userId est fourni (l'utilisateur est authentifié)
      return invoice;
    } else {
      // Si l'utilisateur n'est pas connecté, autoriser seulement si invoice.userId est aussi null (invité)
      if (invoice.userId !== null) {
        throw new Error('Authentification requise pour accéder à cette facture');
      }
      return invoice;
    }
  }

  // Récupérer une facture par commande
  async getInvoiceByOrderId(orderId) {
    return await this.invoiceRepository.findByOrderId(orderId);
  }

  // Récupérer le PDF d'une facture
  async getInvoicePDF(invoiceId, userId = null) {
    await this.getInvoiceById(invoiceId, userId);
    await this.generateInvoicePDF(invoiceId);
    const updatedInvoice = await this.invoiceRepository.findById(invoiceId);
    return updatedInvoice.pdfPath;
  }

  // Créer un avoir (credit note)
  async createCreditNote(invoiceId, creditNoteData) {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new Error('Facture introuvable');
    }

    if (!['draft', 'issued', 'paid', 'canceled'].includes(invoice.status)) {
      throw new Error('Statut de facture non compatible pour la génération d’un avoir');
    }

    const order = await this.orderRepository.findById(invoice.orderId);
    
    const triggerType = creditNoteData.triggerType || 'manual';
    if (triggerType !== 'manual') {
      const existingForTrigger = await this.invoiceRepository.findCreditNoteByInvoiceAndTrigger(invoiceId, triggerType);
      if (existingForTrigger) {
        return existingForTrigger.id;
      }
    }

    const creditNoteId = await this.invoiceRepository.createCreditNote({
      invoiceId: invoiceId,
      orderId: invoice.orderId,
      userId: invoice.userId,
      amount: creditNoteData.amount || invoice.total,
      currency: invoice.currency,
      reason: creditNoteData.reason || 'Annulation de commande',
      status: 'draft',
      metadata: {
        triggerType,
        source: creditNoteData.source || 'backoffice'
      }
    });

    // Générer le PDF de l'avoir
    await this.generateCreditNotePDF(creditNoteId);

    // Mettre à jour le statut de la facture
    await this.invoiceRepository.updateStatus(invoiceId, 'canceled');

    // Alimenter le solde client si l'avoir est émis et qu'un client est lié
    if (invoice.userId) {
      await this.userRepository.incrementCreditBalance(invoice.userId, creditNoteData.amount || invoice.total);
      await this.invoiceRepository.createCustomerCreditTransaction({
        userId: invoice.userId,
        creditNoteId,
        invoiceId: invoice.id,
        orderId: invoice.orderId,
        amount: creditNoteData.amount || invoice.total,
        reason: creditNoteData.reason || 'Avoir automatique',
        metadata: {
          triggerType,
          source: creditNoteData.source || 'backoffice'
        }
      });

      try {
        const user = await this.userRepository.findById(invoice.userId);
        const creditNote = await this.invoiceRepository.findCreditNoteById(creditNoteId);
        if (user?.email && creditNote?.pdfPath) {
          await this.emailService.sendCreditNoteEmail(
            user.email,
            user.first_name || '',
            creditNote.creditNoteNumber,
            creditNote.amount,
            creditNote.reason,
            creditNote.pdfPath
          );
        }
      } catch (mailErr) {
        console.warn('⚠️ Could not send credit note email:', mailErr.message);
      }
    }

    return creditNoteId;
  }

  // Suppression logique d'une facture avec création d'avoir automatique
  async deleteInvoiceWithAutoCreditNote(invoiceId, options = {}) {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new Error('Facture introuvable');
    }

    const existingNotes = await this.invoiceRepository.findCreditNotesByInvoiceId(invoiceId);
    let creditNoteId = existingNotes[0]?.id || null;

    if (!creditNoteId) {
      creditNoteId = await this.createCreditNote(invoiceId, {
        reason: options.reason || 'Suppression de facture depuis le back-office',
        amount: options.amount || invoice.total,
        triggerType: 'billing_error',
        source: 'backoffice.invoice_delete'
      });
    }

    // Suppression logique: conserver l'enregistrement pour la traçabilité comptable
    await this.invoiceRepository.updateStatus(invoiceId, 'canceled');

    if (invoice.pdfPath && fs.existsSync(invoice.pdfPath)) {
      try {
        fs.unlinkSync(invoice.pdfPath);
      } catch (err) {
        console.warn('⚠️ Unable to delete invoice PDF:', err.message);
      }
    }

    return {
      invoiceId,
      creditNoteId
    };
  }

  async createAutomaticCreditNoteByOrder(orderId, triggerType, payload = {}) {
    const allowed = ['order_cancellation', 'goods_return', 'billing_error'];
    if (!allowed.includes(triggerType)) {
      throw new Error('Type de déclencheur d’avoir invalide');
    }

    const invoice = await this.invoiceRepository.findByOrderId(orderId);
    if (!invoice) {
      throw new Error('Facture introuvable pour cette commande');
    }

    const reasonByTrigger = {
      order_cancellation: 'Annulation d’une commande',
      goods_return: 'Retour de marchandise',
      billing_error: 'Erreur de facturation'
    };

    const amount = payload.amount != null ? Number(payload.amount) : Number(invoice.total);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Montant d’avoir invalide');
    }

    return this.createCreditNote(invoice.id, {
      reason: payload.reason || reasonByTrigger[triggerType],
      amount,
      triggerType,
      source: payload.source || 'backoffice.automatic'
    });
  }

  async getCreditNotePDF(creditNoteId, userId = null) {
    const creditNote = await this.invoiceRepository.findCreditNoteById(creditNoteId);
    if (!creditNote) {
      throw new Error('Avoir introuvable');
    }

    if (userId && creditNote.userId && creditNote.userId !== userId) {
      throw new Error('Accès non autorisé à cet avoir');
    }

    await this.generateCreditNotePDF(creditNoteId);
    const updated = await this.invoiceRepository.findCreditNoteById(creditNoteId);
    return updated?.pdfPath;
  }

  // Générer le PDF d'un avoir
  async generateCreditNotePDF(creditNoteId) {
    const creditNote = await this.invoiceRepository.findCreditNoteById(creditNoteId);
    if (!creditNote) {
      throw new Error('Avoir introuvable');
    }

    const invoice = await this.invoiceRepository.findById(creditNote.invoiceId);
    const order = await this.orderRepository.findById(creditNote.orderId);
    
    let user = null;
    if (creditNote.userId) {
      user = await this.userRepository.findById(creditNote.userId);
    }

    const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
    const filename = `credit_note_${creditNote.creditNoteNumber}.pdf`;
    const filepath = path.join(this.invoicesDir, filename);

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    renderCreditNoteDocument(doc, { creditNote, invoice, order, user });

    doc.end();

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // Mettre à jour l'avoir avec le chemin du PDF
    const pool = await getMySQLConnection();
    await pool.execute(
      'UPDATE credit_notes SET pdf_path = ?, status = ?, issued_at = CURRENT_TIMESTAMP WHERE id = ?',
      [filepath, 'issued', creditNoteId]
    );

    return filepath;
  }
}

