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

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Obtenir le panier (utilisateur ou invité)
 *     tags: [Panier]
 *     security:
 *       - bearerAuth: []
 *       - guestToken: []
 *     description: |
 *       Récupère le panier de l'utilisateur connecté ou du visiteur invité.
 *       Si un utilisateur est connecté, retourne son panier utilisateur.
 *       Sinon, utilise le guest token fourni dans le header X-Guest-Token.
 *     responses:
 *       200:
 *         description: Panier récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     cart:
 *                       type: object
 *                     items:
 *                       type: array
 *                     subtotal:
 *                       type: number
 *                     tva:
 *                       type: number
 *                     total:
 *                       type: number
 */
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

