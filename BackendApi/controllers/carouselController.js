import { CarouselService } from '../services/carouselService.js';

export class CarouselController {
  constructor() {
    this.carouselService = new CarouselService();
  }

  getPublicSlides = async (req, res, next) => {
    try {
      const slides = await this.carouselService.getPublicSlides();
      res.status(200).json({
        success: true,
        data: slides
      });
    } catch (error) {
      next(error);
    }
  };

  getAdminSlides = async (req, res, next) => {
    try {
      const slides = await this.carouselService.getAdminSlides();
      res.status(200).json({
        success: true,
        data: slides
      });
    } catch (error) {
      next(error);
    }
  };

  createSlide = async (req, res, next) => {
    try {
      const slide = await this.carouselService.createSlide(req.body);
      res.status(201).json({
        success: true,
        data: slide,
        message: 'Slide créée avec succès'
      });
    } catch (error) {
      next(error);
    }
  };

  updateSlide = async (req, res, next) => {
    try {
      const { id } = req.params;
      const slide = await this.carouselService.updateSlide(Number(id), req.body);
      res.status(200).json({
        success: true,
        data: slide,
        message: 'Slide mise à jour avec succès'
      });
    } catch (error) {
      next(error);
    }
  };

  deleteSlide = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.carouselService.deleteSlide(Number(id));
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };

  reorderSlides = async (req, res, next) => {
    try {
      const slides = await this.carouselService.reorderSlides(req.body.items);
      res.status(200).json({
        success: true,
        data: slides,
        message: 'Ordre des slides mis à jour'
      });
    } catch (error) {
      next(error);
    }
  };

  upload = async (req, res) => {
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'ValidationError',
          message: "Le champ 'url' est requis"
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: { url },
      message: 'Upload simulé: URL enregistrée'
    });
  };
}
