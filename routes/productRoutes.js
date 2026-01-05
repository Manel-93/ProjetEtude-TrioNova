import express from 'express';
import { ProductController } from '../controllers/productController.js';
import { AdminProductController } from '../controllers/adminProductController.js';
import { AdminCategoryController } from '../controllers/adminCategoryController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/adminMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import {
  createProductSchema,
  updateProductSchema,
  productImageSchema,
  updateProductImageSchema
} from '../validators/productValidator.js';
import {
  createCategorySchema,
  updateCategorySchema
} from '../validators/categoryValidator.js';

const router = express.Router();
const productController = new ProductController();
const adminProductController = new AdminProductController();
const adminCategoryController = new AdminCategoryController();

// Routes publiques produits (doivent être avant les routes admin pour éviter les conflits)
router.get('/', productController.getAllProducts);
router.get('/:slug', productController.getProductBySlug);

// Routes admin produits
router.get('/admin/products', authenticate, isAdmin, adminProductController.getAllProducts);
router.get('/admin/products/:id', authenticate, isAdmin, adminProductController.getProductById);
router.post('/admin/products', authenticate, isAdmin, validate(createProductSchema), adminProductController.createProduct);
router.patch('/admin/products/:id', authenticate, isAdmin, validate(updateProductSchema), adminProductController.updateProduct);
router.delete('/admin/products/:id', authenticate, isAdmin, adminProductController.deleteProduct);

// Routes admin images produits
router.post('/admin/products/:id/images', authenticate, isAdmin, validate(productImageSchema), adminProductController.addProductImage);
router.patch('/admin/products/:id/images/:imageId', authenticate, isAdmin, validate(updateProductImageSchema), adminProductController.updateProductImage);
router.patch('/admin/products/:id/images/:imageId/primary', authenticate, isAdmin, adminProductController.setPrimaryImage);
router.delete('/admin/products/:id/images/:imageId', authenticate, isAdmin, adminProductController.deleteProductImage);

// Routes admin catégories
router.get('/admin/categories', authenticate, isAdmin, adminCategoryController.getAllCategories);
router.get('/admin/categories/:id', authenticate, isAdmin, adminCategoryController.getCategoryById);
router.post('/admin/categories', authenticate, isAdmin, validate(createCategorySchema), adminCategoryController.createCategory);
router.patch('/admin/categories/:id', authenticate, isAdmin, validate(updateCategorySchema), adminCategoryController.updateCategory);
router.delete('/admin/categories/:id', authenticate, isAdmin, adminCategoryController.deleteCategory);

export default router;

