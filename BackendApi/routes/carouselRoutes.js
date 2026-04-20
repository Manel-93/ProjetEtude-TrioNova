import express from 'express';
import { CarouselController } from '../controllers/carouselController.js';

const router = express.Router();
const carouselController = new CarouselController();

router.get('/carousel', carouselController.getPublicSlides);

export default router;
