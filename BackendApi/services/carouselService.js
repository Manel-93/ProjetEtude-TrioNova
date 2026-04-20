import { CarouselRepository } from '../repositories/carouselRepository.js';

export class CarouselService {
  constructor() {
    this.carouselRepository = new CarouselRepository();
  }

  async getPublicSlides() {
    return this.carouselRepository.findAllActive();
  }

  async getAdminSlides() {
    return this.carouselRepository.findAll();
  }

  async createSlide(payload) {
    if (!payload.imageUrl) {
      const error = new Error("Le champ 'imageUrl' est requis");
      error.statusCode = 400;
      throw error;
    }
    return this.carouselRepository.create(payload);
  }

  async updateSlide(id, payload) {
    const slide = await this.carouselRepository.findById(id);
    if (!slide) {
      const error = new Error('Slide introuvable');
      error.statusCode = 404;
      throw error;
    }

    return this.carouselRepository.update(id, payload);
  }

  async deleteSlide(id) {
    const slide = await this.carouselRepository.findById(id);
    if (!slide) {
      const error = new Error('Slide introuvable');
      error.statusCode = 404;
      throw error;
    }

    await this.carouselRepository.delete(id);
    return { message: 'Slide supprimée avec succès' };
  }

  async reorderSlides(orderItems) {
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      const error = new Error("Le tableau 'items' est requis");
      error.statusCode = 400;
      throw error;
    }

    const normalized = orderItems.map((item, index) => ({
      id: Number(item.id),
      displayOrder: item.displayOrder !== undefined ? Number(item.displayOrder) : index
    }));

    if (normalized.some((item) => Number.isNaN(item.id) || Number.isNaN(item.displayOrder))) {
      const error = new Error('Format de réordonnancement invalide');
      error.statusCode = 400;
      throw error;
    }

    await this.carouselRepository.reorder(normalized);
    return this.getAdminSlides();
  }
}
