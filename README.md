1) TrioNova Backend API 

API Backend REST pour la refonte de la plateforme e-commerce AltheSystems 

Guide d'installation :

Prérequis
- Node.js
- MySQL (phpmyadmin) 
- MongoDB Atlas (cluster voir lien dans le fichier .env)
- npm 

Étapes d'installation

a. Cloner le projet et installer les dépendances
ctrl + %ù
npm install


b.Configurer les variables d'environnement
Créer un fichier `.env` à la racine du projet avec les variables suivantes :
# MySQL Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=""
DB_NAME=trio_nova_db

MONGODB_URI=mongodb+srv://sterenngougeon_db_user:rqlTLsE2HUV87P6q@cluster0.0mkb2aa.mongodb.net/?appName=Cluster0

JWT_SECRET=votre_secret_jwt_super_securise
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_EMAIL_CONFIRM_EXPIRES_IN=24h
JWT_PASSWORD_RESET_EXPIRES_IN=1h

EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=8c4af8d35e888f
EMAIL_PASSWORD=5af72577da5741
EMAIL_FROM=noreply@trionova.com

PORT=5000


c. Configurer les bases de données

MySQL :
CREATE DATABASE trio_nova_db;


MongoDB Atlas:
- Créer un cluster sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Créer un utilisateur avec les permissions nécessaires
- Ajouter votre IP dans la whitelist (Network Access)
- Copier l'URI de connexion et l'ajouter dans `.env` :

  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trio_nova_db?retryWrites=true&w=majority

d. Démarrer le serveur
Ouvrir le terminal
npm run dev

Mode production
npm start


2. Routes API - Collection Postman

http://localhost:5000/api/

POST /auth/register
POST /auth/confirm-email
POST /auth/login
POST /auth/refresh-token
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password
PATCH /auth/change-password

Le serveur démarre sur `http://localhost:5000`


3. Architecture

trio-nova-api/
├── config/
│   ├── database.js      # Connexions MySQL et MongoDB
│   ├── jwt.js           # Configuration JWT
│   └── email.js         # Configuration email (Nodemailer)
│
├── repositories/
│   ├── userRepository.js    # Accès DB MySQL (users)
│   └── tokenRepository.js   # Accès DB MongoDB (tokens)
│
├── services/
│   ├── authService.js        # Logique métier authentification
│   ├── jwtService.js         # Génération/vérification JWT
│   ├── passwordService.js    # Hashage et validation mot de passe
│   └── emailService.js       # Envoi emails (confirmation, reset)
│
├── controllers/
│   └── authController.js     # Contrôleurs HTTP
│
├── middlewares/
│   ├── authMiddleware.js         # Protection JWT
│   ├── validationMiddleware.js   # Validation Joi
│   └── errorMiddleware.js        # Gestion centralisée erreurs
│
├── routes/
│   └── authRoutes.js         # Définition routes Express
│
├── validators/
│   └── authValidator.js     # Schémas validation Joi
│
├── server.js                 # Point d'entrée Express
└── package.json

5. Flux de données

Client → Routes * → Middlewares * (validation/auth) * → Controllers * → Services * → Repositories * → Database
                                                                                    ↓
                                                                          Réponse JSON 

Routes* : Définition des endpoints et association middlewares
Controllers* : Gestion requêtes/réponses HTTP
Services* : Logique métier et orchestration
Repositories* : Accès aux bases de données 
Middlewares* : Validation, authentification, gestion erreurs
Validators* : Schémas de validation des données

Important !
- Les tokens de confirmation email expirent après 24h
- Les tokens de réinitialisation expirent après 1h
- Les access tokens expirent après 15 minutes
- Les refresh tokens expirent après 7 jours
- Le changement de mot de passe invalide tous les refresh tokens (force nouvelle connexion)
