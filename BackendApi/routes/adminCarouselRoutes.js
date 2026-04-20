import express from 'express';
import { CarouselController } from '../controllers/carouselController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/adminMiddleware.js';

const router = express.Router();
const carouselController = new CarouselController();

router.get('/carousel', authenticate, isAdmin, carouselController.getAdminSlides);
router.post('/carousel', authenticate, isAdmin, carouselController.createSlide);
router.put('/carousel/:id', authenticate, isAdmin, carouselController.updateSlide);
router.delete('/carousel/:id', authenticate, isAdmin, carouselController.deleteSlide);
router.patch('/carousel/reorder', authenticate, isAdmin, carouselController.reorderSlides);
router.post('/upload', authenticate, isAdmin, carouselController.upload);

export default router;
