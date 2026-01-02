# TrioNova Backend API

API Backend REST pour la refonte de la plateforme e-commerce AltheSystems

## Guide d'installation

### Prérequis
- Node.js
- MySQL (phpmyadmin) 
- MongoDB Atlas (cluster voir lien dans le fichier .env)
- npm 

### Étapes d'installation

#### a. Cloner le projet et installer les dépendances
```bash
npm install
```

#### b. Configurer les variables d'environnement
Créer un fichier `.env` à la racine du projet avec les variables suivantes :

```env
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
```

#### c. Configurer les bases de données

**MySQL :**
```sql
CREATE DATABASE trio_nova_db;
```

**MongoDB Atlas:**
- Créer un cluster sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Créer un utilisateur avec les permissions nécessaires
- Ajouter votre IP dans la whitelist (Network Access)
- Copier l'URI de connexion et l'ajouter dans `.env` :

  ```
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trio_nova_db?retryWrites=true&w=majority
  ```

#### d. Démarrer le serveur

**Mode développement :**
```bash
npm run dev
```

**Mode production :**
```bash
npm start
```

## Routes API - Collection Postman

Base URL: `http://localhost:5000/api/`

### Routes Authentification
- POST /auth/register
- POST /auth/confirm-email
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- POST /auth/forgot-password
- POST /auth/reset-password
- PATCH /auth/change-password

### Routes Utilisateurs (Authentifié)
- GET /users/me
- PATCH /users/me
- DELETE /users/me
- GET /users/me/login-history
- GET /users/me/addresses
- POST /users/me/addresses
- PATCH /users/me/addresses/:id
- PATCH /users/me/addresses/:id/default
- DELETE /users/me/addresses/:id
- GET /users/me/payment-methods
- POST /users/me/payment-methods
- PATCH /users/me/payment-methods/:id/default
- DELETE /users/me/payment-methods/:id

### Routes Admin (Authentifié + Admin)
- GET /users/admin/users
- GET /users/admin/users/:id
- PATCH /users/admin/users/:id/status
- DELETE /users/admin/users/:id

Le serveur démarre sur `http://localhost:5000`

## Architecture

```
trio-nova-api/
├── config/
│   ├── database.js      # Connexions MySQL et MongoDB
│   ├── jwt.js           # Configuration JWT
│   └── email.js         # Configuration email (Nodemailer)
│
├── repositories/
│   ├── userRepository.js          # Accès DB MySQL (users)
│   ├── tokenRepository.js         # Accès DB MongoDB (tokens)
│   ├── loginHistoryRepository.js  # Accès DB MongoDB (historique connexions)
│   ├── addressRepository.js       # Accès DB MongoDB (adresses)
│   └── paymentMethodRepository.js # Accès DB MongoDB (méthodes paiement)
│
├── services/
│   ├── authService.js        # Logique métier authentification
│   ├── userService.js        # Logique métier utilisateurs
│   ├── jwtService.js         # Génération/vérification JWT
│   ├── passwordService.js    # Hashage et validation mot de passe
│   └── emailService.js       # Envoi emails (confirmation, reset)
│
├── controllers/
│   ├── authController.js     # Contrôleurs authentification
│   ├── userController.js     # Contrôleurs utilisateur
│   └── adminController.js    # Contrôleurs admin
│
├── middlewares/
│   ├── authMiddleware.js         # Protection JWT
│   ├── adminMiddleware.js         # Vérification rôle admin
│   ├── validationMiddleware.js    # Validation Joi
│   └── errorMiddleware.js         # Gestion centralisée erreurs
│
├── routes/
│   ├── authRoutes.js         # Routes authentification
│   └── userRoutes.js          # Routes utilisateurs et admin
│
├── validators/
│   ├── authValidator.js       # Schémas validation auth
│   └── userValidator.js      # Schémas validation users
│
├── models/
│   ├── Token.js              # Modèle Token (MongoDB)
│   ├── LoginHistory.js       # Modèle historique connexions (MongoDB)
│   ├── PaymentMethod.js      # Modèle méthodes paiement (MongoDB)
│   └── Address.js            # Modèle adresses (MongoDB)
│
├── server.js                 # Point d'entrée Express
└── package.json
```

## Flux de données

```
Client → Routes → Middlewares (validation/auth) → Controllers → Services → Repositories → Database
                                                                                    ↓
                                                                          Réponse JSON 
```

- **Routes** : Définition des endpoints et association middlewares
- **Controllers** : Gestion requêtes/réponses HTTP
- **Services** : Logique métier et orchestration
- **Repositories** : Accès aux bases de données 
- **Middlewares** : Validation, authentification, gestion erreurs
- **Validators** : Schémas de validation des données

## Important !

- Les tokens de confirmation email expirent après 24h
- Les tokens de réinitialisation expirent après 1h
- Les access tokens expirent après 15 minutes
- Les refresh tokens expirent après 7 jours
- Le changement de mot de passe invalide tous les refresh tokens (force nouvelle connexion)
