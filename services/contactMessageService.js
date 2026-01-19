import { ContactMessageRepository } from '../repositories/contactMessageRepository.js';

export class ContactMessageService {
  constructor() {
    this.contactMessageRepository = new ContactMessageRepository();
  }

  async create(messageData) {
    return await this.contactMessageRepository.create(messageData);
  }

  async getById(id) {
    const message = await this.contactMessageRepository.findById(id);
    if (!message) {
      throw new Error('Message introuvable');
    }
    return message;
  }

  async getAll(filters = {}, pagination = {}) {
    const messages = await this.contactMessageRepository.findAll(filters, pagination);
    return {
      data: messages,
      pagination: {
        page: parseInt(pagination.page || 1),
        limit: parseInt(pagination.limit || 50)
      }
    };
  }

  async updateStatus(id, status, assignedTo = null) {
    return await this.contactMessageRepository.updateStatus(id, status, assignedTo);
  }

  async getStats() {
    const counts = await this.contactMessageRepository.countByStatus();
    return {
      pending: counts.pending || 0,
      inProgress: counts.in_progress || 0,
      resolved: counts.resolved || 0,
      archived: counts.archived || 0,
      total: Object.values(counts).reduce((sum, count) => sum + parseInt(count), 0)
    };
  }
}

