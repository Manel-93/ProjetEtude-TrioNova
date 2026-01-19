import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import xss from 'xss-clean';
import hpp from 'hpp';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { initializeDatabases } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler, notFoundHandler } from './middlewares/errorMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Sécurité - Helmet (headers de sécurité)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Pour Swagger UI
      scriptSrc: ["'self'", "'unsafe-inline'"], // Pour Swagger UI
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  crossOriginEmbedderPolicy: false // Pour Swagger UI
}));

// CORS
app.use(cors());

// Protection XSS - Nettoyer les entrées utilisateur
app.use(xss());

// Protection HTTP Parameter Pollution
app.use(hpp());

// Logs HTTP avec Morgan
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Format coloré pour le développement
} else {
  app.use(morgan('combined')); // Format Apache combined pour la production
}

// Rate Limiting - Protection contre les attaques par force brute
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par fenêtre
  message: {
    success: false,
    error: {
      type: 'RateLimitError',
      message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard'
    }
  },
  standardHeaders: true, // Retourne les headers RateLimit-* dans la réponse
  legacyHeaders: false
});

// Rate limiting plus strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives de connexion par fenêtre
  message: {
    success: false,
    error: {
      type: 'RateLimitError',
      message: 'Trop de tentatives de connexion, veuillez réessayer plus tard'
    }
  },
  skipSuccessfulRequests: true // Ne pas compter les requêtes réussies
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// IMPORTANT: La route webhook Stripe doit être configurée AVANT express.json()
// car Stripe a besoin du body brut pour vérifier la signature
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Parser JSON pour toutes les autres routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Documentation Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'TrioNova API Documentation',
  swaggerOptions: {
    persistAuthorization: true, // Garder le token JWT après refresh
    displayRequestDuration: true
  }
}));

// Route pour récupérer le JSON Swagger
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Gestion des erreurs
app.use(notFoundHandler);
app.use(errorHandler);

// Demarrage du serveur
const startServer = async () => {
  try {
    await initializeDatabases();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

