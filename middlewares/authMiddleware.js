import { JwtService } from '../services/jwtService.js';
import { UserRepository } from '../repositories/userRepository.js';

const jwtService = new JwtService();
const userRepository = new UserRepository();

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          type: 'AuthenticationError',
          message: 'Token d\'authentification manquant'
        }
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwtService.verifyToken(token);
      
      // Vérifier que l'utilisateur existe toujours
      const user = await userRepository.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            type: 'AuthenticationError',
            message: 'Utilisateur introuvable'
          }
        });
      }

      // Vérifier que l'email est confirmé
      if (!user.is_email_confirmed) {
        return res.status(403).json({
          success: false,
          error: {
            type: 'AuthorizationError',
            message: 'Veuillez confirmer votre email avant d\'accéder à cette ressource'
          }
        });
      }

      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          type: 'AuthenticationError',
          message: 'Token invalide ou expiré'
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

