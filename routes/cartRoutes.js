import express from 'express';
import { CartController } from '../controllers/cartController.js';
import { handleGuestToken } from '../middlewares/cartMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { addItemSchema, updateItemSchema, removeItemSchema } from '../validators/cartValidator.js';

const router = express.Router();
const cartController = new CartController();

// Toutes les routes du panier nécessitent le middleware handleGuestToken
// pour gérer le guest token (même pour les utilisateurs authentifiés)
router.use(handleGuestToken);

// Route pour obtenir le panier (public - invité ou utilisateur)
router.get('/', cartController.getCart);

// Route pour valider le panier avant checkout (public - invité ou utilisateur)
router.get('/validate', cartController.validateCart);

// Route pour ajouter un produit au panier (public - invité ou utilisateur)
router.post('/add', validate(addItemSchema), cartController.addItem);

// Route pour mettre à jour la quantité d'un produit (public - invité ou utilisateur)
router.patch('/update', validate(updateItemSchema), cartController.updateItem);

// Route pour supprimer un produit du panier (public - invité ou utilisateur)
router.delete('/remove', validate(removeItemSchema), cartController.removeItem);

export default router;

