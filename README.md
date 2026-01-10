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

# Elasticsearch Configuration (optionnel)
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_INDEX=products
ELASTICSEARCH_USERNAME=  # Optionnel (si authentification requise)
ELASTICSEARCH_PASSWORD=  # Optionnel (si authentification requise)
ALLOW_NO_ELASTICSEARCH=true  # Permet de continuer sans Elasticsearch en développement
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

**Elasticsearch (optionnel pour la recherche avancée) :**

**Option 1: Script automatique (recommandé) :**
```bash
# Windows (PowerShell)
.\scripts\start-elasticsearch.ps1

# Linux/Mac (Bash)
chmod +x scripts/start-elasticsearch.sh
./scripts/start-elasticsearch.sh
```

**Option 2: Docker Compose :**
```bash
docker-compose -f docker-compose.elasticsearch.yml up -d
```

**Option 3: Docker run :**
```bash
docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
  elasticsearch:8.11.0
```

**Option 4: Installation manuelle :**
- Télécharger depuis https://www.elastic.co/downloads/elasticsearch
- Suivre les instructions d'installation
- Démarrer Elasticsearch manuellement

**Vérifier que Elasticsearch fonctionne :**
```bash
curl http://localhost:9200
```

**Gestion des conteneurs :**
```bash
# Arrêter Elasticsearch
docker stop elasticsearch

# Redémarrer Elasticsearch
docker start elasticsearch

# Voir les logs
docker logs elasticsearch

# Supprimer le conteneur (ATTENTION: supprime les données)
docker rm -f elasticsearch
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

### Routes Produits (Publiques)
- GET /products (avec pagination, filtres: categoryId, status, search, inStock)
- GET /products/search (recherche avancée Elasticsearch - voir documentation ci-dessous)
- GET /products/:slug

### Routes Admin Produits (Authentifié + Admin)
- GET /products/admin/products
- GET /products/admin/products/:id
- POST /products/admin/products
- PATCH /products/admin/products/:id
- DELETE /products/admin/products/:id
- POST /products/admin/products/:id/images
- PATCH /products/admin/products/:id/images/:imageId
- PATCH /products/admin/products/:id/images/:imageId/primary
- DELETE /products/admin/products/:id/images/:imageId

### Routes Admin Catégories (Authentifié + Admin)
- GET /products/admin/categories
- GET /products/admin/categories/:id
- POST /products/admin/categories
- PATCH /products/admin/categories/:id
- DELETE /products/admin/categories/:id

### Routes Recherche Elasticsearch (Admin)
- POST /products/admin/search/reindex (réindexer tous les produits)

Le serveur démarre sur `http://localhost:5000`

## Architecture

```
trio-nova-api/
├── config/
│   ├── database.js         # Connexions MySQL et MongoDB
│   ├── elasticsearch.js    # Configuration Elasticsearch
│   ├── jwt.js              # Configuration JWT
│   └── email.js            # Configuration email (Nodemailer)
│
├── repositories/
│   ├── userRepository.js          # Accès DB MySQL (users)
│   ├── tokenRepository.js         # Accès DB MongoDB (tokens)
│   ├── loginHistoryRepository.js  # Accès DB MongoDB (historique connexions)
│   ├── addressRepository.js       # Accès DB MySQL (adresses)
│   ├── paymentMethodRepository.js # Accès DB MySQL (méthodes paiement)
│   ├── productRepository.js      # Accès DB MySQL (produits)
│   ├── categoryRepository.js      # Accès DB MySQL (catégories)
│   └── productImageRepository.js # Accès DB MongoDB (images produits)
│
├── services/
│   ├── authService.js           # Logique métier authentification
│   ├── userService.js           # Logique métier utilisateurs
│   ├── productService.js        # Logique métier produits
│   ├── categoryService.js       # Logique métier catégories
│   ├── elasticsearchService.js  # Recherche avancée Elasticsearch
│   ├── jwtService.js            # Génération/vérification JWT
│   ├── passwordService.js       # Hashage et validation mot de passe
│   └── emailService.js          # Envoi emails (confirmation, reset)
│
├── controllers/
│   ├── authController.js          # Contrôleurs authentification
│   ├── userController.js          # Contrôleurs utilisateur
│   ├── adminController.js         # Contrôleurs admin
│   ├── productController.js       # Contrôleurs produits (public)
│   ├── adminProductController.js  # Contrôleurs produits (admin)
│   ├── adminCategoryController.js # Contrôleurs catégories (admin)
│   ├── searchController.js        # Contrôleurs recherche (public)
│   └── adminSearchController.js   # Contrôleurs recherche (admin)
│
├── middlewares/
│   ├── authMiddleware.js         # Protection JWT
│   ├── adminMiddleware.js         # Vérification rôle admin
│   ├── validationMiddleware.js    # Validation Joi
│   └── errorMiddleware.js         # Gestion centralisée erreurs
│
├── routes/
│   ├── authRoutes.js         # Routes authentification
│   ├── userRoutes.js          # Routes utilisateurs et admin
│   └── productRoutes.js      # Routes produits et catégories
│
├── validators/
│   ├── authValidator.js       # Schémas validation auth
│   ├── userValidator.js      # Schémas validation users
│   ├── productValidator.js   # Schémas validation produits
│   └── categoryValidator.js  # Schémas validation catégories
│
├── models/
│   ├── Token.js              # Modèle Token (MongoDB)
│   ├── LoginHistory.js       # Modèle historique connexions (MongoDB)
│   └── ProductImage.js       # Modèle images produits (MongoDB)
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

## Recherche avancée avec Elasticsearch

### Configuration

1. **Installer Elasticsearch** (local ou cloud) :
   ```bash
   # Option 1: Docker
   docker run -d --name elasticsearch -p 9200:9200 -e "discovery.type=single-node" elasticsearch:8.11.0
   
   # Option 2: Télécharger depuis https://www.elastic.co/downloads/elasticsearch
   ```

2. **Configurer les variables d'environnement** dans `.env` :
   ```env
   ELASTICSEARCH_NODE=http://localhost:9200
   ELASTICSEARCH_INDEX=products
   ALLOW_NO_ELASTICSEARCH=true  # Permet de continuer sans Elasticsearch
   ```

3. **Réindexer les produits existants** (première fois) :
   ```bash
   POST /api/products/admin/search/reindex
   ```

### Fonctionnalités

- **Recherche texte** : Nom, description, caractéristiques techniques (avec stemming français)
- **Filtres** : Prix (min/max), catégorie, disponibilité (en stock/hors stock)
- **Tri** : Priorité, prix (croissant/décroissant), nouveauté, stock
- **Performance** : Résultats en < 100ms
- **Synchronisation automatique** : Indexation lors de la création/modification/suppression de produits

### Endpoint de recherche

```
GET /api/products/search
```

**Paramètres de requête :**
- `q` (string, optionnel) : Terme de recherche (nom, description, caractéristiques)
- `minPrice` (number, optionnel) : Prix minimum (TTC)
- `maxPrice` (number, optionnel) : Prix maximum (TTC)
- `categoryId` (number, optionnel) : ID de la catégorie
- `inStock` (boolean, optionnel) : `true` pour produits en stock uniquement
- `sortBy` (string, optionnel) : `priority` (défaut), `price_asc`, `price_desc`, `newest`, `stock`
- `page` (number, défaut: 1) : Numéro de page
- `limit` (number, défaut: 20) : Nombre de résultats par page

**Exemple de réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Stéthoscope professionnel",
      "description": "...",
      "priceTtc": 54.00,
      "stock": 50,
      "score": 2.5,
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "meta": {
    "query": "stéthoscope",
    "filters": {
      "minPrice": null,
      "maxPrice": null,
      "categoryId": null,
      "inStock": null
    },
    "sortBy": "priority",
    "duration": "45ms"
  }
}
```

## Guide de test Postman

### Configuration initiale

1. **Créer une collection Postman** nommée "TrioNova API"
2. **Créer une variable d'environnement** :
   - Variable : `baseUrl`
   - Valeur : `http://localhost:5000/api`

### Tests d'authentification

#### 1. Créer un compte admin
```
POST {{baseUrl}}/auth/register
Body (JSON):
{
  "email": "admin@trionova.com",
  "password": "Admin123!",
  "firstName": "Admin",
  "lastName": "User"
}
```

#### 2. Se connecter
```
POST {{baseUrl}}/auth/login
Body (JSON):
{
  "email": "admin@trionova.com",
  "password": "Admin123!"
}
```

**Important** : Copier le `accessToken` de la réponse et créer une variable d'environnement `token` dans Postman.

#### 3. Configurer l'authentification pour les routes admin
Dans Postman, pour chaque requête admin :
- Onglet "Authorization"
- Type : "Bearer Token"
- Token : `{{token}}`

### Tests de la recherche Elasticsearch

#### 1. Réindexer tous les produits (Admin - première fois)
```
POST {{baseUrl}}/products/admin/search/reindex
Headers:
  Authorization: Bearer {{token}}
```

**Note** : À exécuter une fois après l'installation d'Elasticsearch pour indexer tous les produits existants.

#### 2. Recherche simple par texte
```
GET {{baseUrl}}/products/search?q=stéthoscope&page=1&limit=20
```

#### 3. Recherche avec filtres de prix
```
GET {{baseUrl}}/products/search?q=équipement&minPrice=30&maxPrice=100&page=1&limit=20
```

#### 4. Recherche par catégorie
```
GET {{baseUrl}}/products/search?categoryId=1&page=1&limit=20
```

#### 5. Recherche produits en stock uniquement
```
GET {{baseUrl}}/products/search?inStock=true&page=1&limit=20
```

#### 6. Recherche avec tri par prix croissant
```
GET {{baseUrl}}/products/search?q=&sortBy=price_asc&page=1&limit=20
```

#### 7. Recherche avec tri par prix décroissant
```
GET {{baseUrl}}/products/search?q=&sortBy=price_desc&page=1&limit=20
```

#### 8. Recherche avec tri par nouveauté
```
GET {{baseUrl}}/products/search?sortBy=newest&page=1&limit=20
```

#### 9. Recherche avec tri par stock
```
GET {{baseUrl}}/products/search?sortBy=stock&page=1&limit=20
```

#### 10. Recherche combinée (tous les filtres)
```
GET {{baseUrl}}/products/search?q=médical&categoryId=1&minPrice=20&maxPrice=200&inStock=true&sortBy=price_asc&page=1&limit=20
```

### Tests des catégories (Admin)

#### 1. Créer une catégorie
```
POST {{baseUrl}}/products/admin/categories
Headers:
  Authorization: Bearer {{token}}
Body (JSON):
{
  "name": "Équipements médicaux",
  "description": "Tous les équipements médicaux professionnels",
  "slug": "equipements-medicaux",
  "displayOrder": 1,
  "status": "active"
}
```

#### 2. Lister toutes les catégories
```
GET {{baseUrl}}/products/admin/categories
Headers:
  Authorization: Bearer {{token}}
```

### Tests des produits (Admin)

#### 1. Créer un produit
```
POST {{baseUrl}}/products/admin/products
Headers:
  Authorization: Bearer {{token}}
Body (JSON):
{
  "name": "Stéthoscope professionnel",
  "description": "Stéthoscope médical haute qualité avec double pavillon",
  "technicalSpecs": {
    "poids": "200g",
    "longueur": "75cm",
    "matiere": "Acier inoxydable"
  },
  "priceHt": 45.00,
  "tva": 20,
  "stock": 50,
  "priority": 10,
  "status": "active",
  "slug": "stethoscope-professionnel",
  "categoryId": 1,
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "alt": "Stéthoscope vue principale",
      "order": 0
    }
  ]
}
```

**Note** : Après la création, le produit est automatiquement indexé dans Elasticsearch.

#### 2. Modifier un produit (synchronisation automatique Elasticsearch)
```
PATCH {{baseUrl}}/products/admin/products/:id
Headers:
  Authorization: Bearer {{token}}
Body (JSON):
{
  "stock": 75,
  "priority": 15
}
```

**Note** : L'index Elasticsearch est automatiquement mis à jour.

#### 3. Supprimer un produit (suppression automatique de l'index)
```
DELETE {{baseUrl}}/products/admin/products/:id
Headers:
  Authorization: Bearer {{token}}
```

**Note** : Le produit est automatiquement supprimé de l'index Elasticsearch.

### Notes importantes pour les tests

1. **Pagination obligatoire** : Toutes les routes GET `/products` nécessitent les paramètres `page` et `limit`
2. **Synchronisation automatique** : Les opérations CRUD sur les produits synchronisent automatiquement Elasticsearch en arrière-plan
3. **Performance** : Les recherches Elasticsearch doivent retourner des résultats en moins de 100ms
4. **Stemming français** : Elasticsearch utilise un analyseur français pour une meilleure recherche (ex: "stéthoscope" trouve "stethoscope")
5. **Tri intelligent** : Par défaut, tri par priorité décroissante, puis produits en stock, puis prix croissant

### Exemples de réponses

#### Réponse recherche Elasticsearch
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Stéthoscope professionnel",
      "description": "Stéthoscope médical haute qualité",
      "priceTtc": 54.00,
      "stock": 50,
      "score": 2.543,
      "images": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "meta": {
    "query": "stéthoscope",
    "filters": {
      "minPrice": null,
      "maxPrice": null,
      "categoryId": null,
      "inStock": null
    },
    "sortBy": "priority",
    "duration": "45ms"
  }
}
```

## Important !

- Les tokens de confirmation email expirent après 24h
- Les tokens de réinitialisation expirent après 1h
- Les access tokens expirent après 15 minutes
- Les refresh tokens expirent après 7 jours
- Le changement de mot de passe invalide tous les refresh tokens (force nouvelle connexion)
- **Elasticsearch** : Synchronisation automatique lors des opérations CRUD produits
- **Elasticsearch** : L'index est automatiquement créé au démarrage du serveur
- **Elasticsearch** : Les produits sont automatiquement indexés lors de la création/modification
- **Elasticsearch** : Les produits sont automatiquement supprimés de l'index lors de la suppression

