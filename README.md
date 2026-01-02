# TrioNova API - Module d'Authentification

API Backend REST pour plateforme e-commerce de produits médicaux - Module d'authentification sécurisé.

## 🚀 Installation

### Prérequis
- Node.js (v18+)
- MySQL (v8+) ou MySQL hébergé (ex: AWS RDS, PlanetScale)
- MongoDB (v6+) local ou MongoDB Atlas (cluster)
- npm ou yarn

### Étapes d'installation

1. **Cloner le projet et installer les dépendances**
```bash
npm install
```

2. **Configurer les variables d'environnement**
Créer un fichier `.env` à la racine du projet avec les variables suivantes :
```env
PORT=3000
NODE_ENV=development

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=votre_mot_de_passe
MYSQL_DATABASE=trio_nova_db

# MongoDB - URI complète (local ou MongoDB Atlas)
# Format local: mongodb://localhost:27017/trio_nova_db
# Format Atlas: mongodb+srv://username:password@cluster.mongodb.net/trio_nova_db?retryWrites=true&w=majority
MONGODB_URI=mongodb://localhost:27017/trio_nova_db
# Optionnel: nom de la base de données (si différent de celui dans l'URI)
# MONGODB_DATABASE=trio_nova_db

JWT_SECRET=votre_secret_jwt_super_securise
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_EMAIL_CONFIRM_EXPIRES_IN=24h
JWT_PASSWORD_RESET_EXPIRES_IN=1h

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email@gmail.com
EMAIL_PASSWORD=votre_mot_de_passe_application
EMAIL_FROM=noreply@trionova.com
```

3. **Configurer les bases de données**

**MySQL :**
```sql
CREATE DATABASE trio_nova_db;
```

**MongoDB Atlas (si utilisé) :**
- Créer un cluster sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Créer un utilisateur avec les permissions nécessaires
- Ajouter votre IP dans la whitelist (Network Access)
- Copier l'URI de connexion et l'ajouter dans `.env` :
  ```
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trio_nova_db?retryWrites=true&w=majority
  ```

4. **Démarrer le serveur**
```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

Le serveur démarre sur `http://localhost:3000`

## 📋 Routes API - Collection Postman

### Base URL
```
http://localhost:3000/api/auth
```

### 1. Inscription
**POST** `/register`

**Body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Réponse 201:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "message": "Inscription réussie. Un email de confirmation a été envoyé."
  }
}
```

### 2. Confirmation Email
**POST** `/confirm-email`

**Body (JSON):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Réponse 200:**
```json
{
  "success": true,
  "message": "Email confirmé avec succès"
}
```

### 3. Connexion
**POST** `/login`

**Body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Réponse 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### 4. Refresh Token
**POST** `/refresh`

**Body (JSON):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Réponse 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 5. Déconnexion
**POST** `/logout`

**Body (JSON):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Réponse 200:**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

### 6. Mot de passe oublié
**POST** `/forgot-password`

**Body (JSON):**
```json
{
  "email": "user@example.com"
}
```

**Réponse 200:**
```json
{
  "success": true,
  "message": "Si cet email existe, un lien de réinitialisation a été envoyé"
}
```

### 7. Réinitialisation mot de passe
**POST** `/reset-password`

**Body (JSON):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NewPassword123!"
}
```

**Réponse 200:**
```json
{
  "success": true,
  "message": "Mot de passe réinitialisé avec succès"
}
```

### 8. Changement mot de passe
**PATCH** `/change-password`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Body (JSON):**
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword123!"
}
```

**Réponse 200:**
```json
{
  "success": true,
  "message": "Mot de passe modifié avec succès"
}
```

## 🏗️ Architecture

```
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
```

### Flux de données

```
Client → Routes → Middlewares (validation/auth) → Controllers → Services → Repositories → Database
                                                                                    ↓
                                                                              Réponse JSON normalisée
```

### Séparation des responsabilités

- **Routes** : Définition des endpoints et association middlewares
- **Controllers** : Gestion requêtes/réponses HTTP
- **Services** : Logique métier et orchestration
- **Repositories** : Accès aux bases de données (abstraction)
- **Middlewares** : Validation, authentification, gestion erreurs
- **Validators** : Schémas de validation des données

### Bases de données

- **MySQL** : Données utilisateurs (table `users`)
- **MongoDB** : Tokens (collection `tokens` - email_confirm, refresh, password_reset)

### Sécurité

- ✅ Hashage bcrypt (10 rounds)
- ✅ JWT avec expiration configurable
- ✅ Validation mot de passe fort (8+ caractères, majuscule, minuscule, chiffre, caractère spécial)
- ✅ Email unique
- ✅ Compte non confirmé → accès refusé
- ✅ Rate limiting (100 req/15min)
- ✅ Helmet.js (headers sécurité)
- ✅ Validation entrées (Joi)
- ✅ Gestion centralisée erreurs

## 📝 Notes

- Les tokens de confirmation email expirent après 24h
- Les tokens de réinitialisation expirent après 1h
- Les access tokens expirent après 15 minutes
- Les refresh tokens expirent après 7 jours
- Le changement de mot de passe invalide tous les refresh tokens (force nouvelle connexion)
