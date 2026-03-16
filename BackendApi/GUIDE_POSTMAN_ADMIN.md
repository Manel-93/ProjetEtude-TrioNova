# Guide Postman - API Admin TrioNova

Ce guide vous permet de tester tous les endpoints admin de l'API TrioNova pour le backoffice administrateur.

## Configuration de base

**Base URL** : `http://localhost:5000/api`

### Variables d'environnement Postman (recommandé)

Créez un environnement Postman avec les variables suivantes :
- `base_url` : `http://localhost:5000/api`
- `access_token` : (sera rempli après connexion admin)
- `refresh_token` : (sera rempli après connexion admin)
- `admin_user_id` : (ID de l'utilisateur admin)
- `user_id` : (ID d'un utilisateur pour les tests)
- `product_id` : (ID d'un produit)
- `category_id` : (ID d'une catégorie)
- `order_id` : (ID d'une commande)
- `contact_message_id` : (ID d'un message de contact)

---

## Prérequis : Authentification Admin

### 1. Connexion en tant qu'admin

**POST** `{{base_url}}/auth/login`

**Body (JSON)** :
```json
{
  "email": "admin@example.com",
  "password": "MotDePasse123!"
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "role": "ADMIN"
    }
  }
}
```

**⚠️ Important** : Sauvegardez le `accessToken` dans la variable `{{access_token}}` pour toutes les requêtes suivantes.

**Headers à ajouter** :
```
Authorization: Bearer {{access_token}}
```

---

## 1. Dashboard & Statistiques

### 1.1. Dashboard principal
**GET** `{{base_url}}/admin/dashboard`

**Headers** :
```
Authorization: Bearer {{access_token}}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "revenue": {
      "today": { "amount": 1250.50, "ordersCount": 5, "averageOrderValue": 250.10 },
      "week": { "amount": 8750.00, "ordersCount": 35, "averageOrderValue": 250.00 },
      "month": { "amount": 35000.00, "ordersCount": 140, "averageOrderValue": 250.00 }
    },
    "orders": {
      "pending": { "count": 10, "totalAmount": 2500.00 },
      "processing": { "count": 5, "totalAmount": 1250.00 },
      "completed": { "count": 120, "totalAmount": 30000.00 },
      "canceled": { "count": 5, "totalAmount": 1250.00 }
    },
    "users": {
      "total": 500,
      "active": 450,
      "admins": 3
    },
    "products": {
      "total": 200,
      "active": 180,
      "lowStock": 15
    },
    "salesByCategory": [
      { "categoryId": 1, "categoryName": "Électronique", "ordersCount": 50, "totalRevenue": 12500.00, "totalQuantity": 75 },
      { "categoryId": 2, "categoryName": "Vêtements", "ordersCount": 30, "totalRevenue": 7500.00, "totalQuantity": 60 }
    ],
    "stockAlerts": [
      { "productId": 10, "productName": "Produit A", "stock": 0, "alertLevel": "out_of_stock" },
      { "productId": 15, "productName": "Produit B", "stock": 3, "alertLevel": "critical" }
    ],
    "messages": {
      "pending": 5,
      "inProgress": 2,
      "totalUnresolved": 7
    }
  }
}
```

### 1.2. CA par période
**GET** `{{base_url}}/admin/dashboard/revenue?period=month`

**Query Parameters** :
- `period` : `day` | `week` | `month` (défaut: `month`)

**Réponse** :
```json
{
  "success": true,
  "data": {
    "period": "month",
    "orders_count": 140,
    "total_revenue": 35000.00,
    "total_subtotal": 29166.67,
    "total_tva": 5833.33,
    "average_order_value": 250.00
  }
}
```

### 1.3. Ventes par catégorie
**GET** `{{base_url}}/admin/dashboard/sales-by-category?period=month`

**Query Parameters** :
- `period` : `day` | `week` | `month` (défaut: `month`)

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "categoryId": 1,
      "categoryName": "Électronique",
      "ordersCount": 50,
      "totalRevenue": 12500.00,
      "totalQuantity": 75
    }
  ]
}
```

### 1.4. Alertes stock
**GET** `{{base_url}}/admin/dashboard/stock-alerts?threshold=10`

**Query Parameters** :
- `threshold` : Nombre minimum de stock pour l'alerte (défaut: `10`)

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "productId": 10,
      "productName": "Produit A",
      "productSlug": "produit-a",
      "stock": 0,
      "status": "active",
      "alertLevel": "out_of_stock"
    },
    {
      "productId": 15,
      "productName": "Produit B",
      "productSlug": "produit-b",
      "stock": 3,
      "status": "active",
      "alertLevel": "critical"
    }
  ]
}
```

---

## 2. Authentification 2FA (Admin)

### 2.1. Vérifier le statut 2FA
**GET** `{{base_url}}/admin/2fa/status`

**Réponse** :
```json
{
  "success": true,
  "data": {
    "isEnabled": false
  }
}
```

### 2.2. Générer un secret 2FA
**POST** `{{base_url}}/admin/2fa/generate`

**Réponse** :
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "manualEntryKey": "JBSWY3DPEHPK3PXP"
  },
  "message": "Secret 2FA généré. Scannez le QR code avec votre application d'authentification."
}
```

**⚠️ Note** : Scannez le QR code avec une application d'authentification (Google Authenticator, Authy, etc.)

### 2.3. Activer le 2FA
**POST** `{{base_url}}/admin/2fa/enable`

**Body (JSON)** :
```json
{
  "token": "123456"
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "backupCodes": [
      "ABC12345",
      "DEF67890",
      "GHI11111",
      "JKL22222",
      "MNO33333",
      "PQR44444",
      "STU55555",
      "VWX66666",
      "YZA77777",
      "BCD88888"
    ]
  },
  "message": "2FA activé avec succès. Conservez vos codes de secours en lieu sûr."
}
```

**⚠️ Important** : Sauvegardez les codes de secours, ils ne seront plus affichés.

### 2.4. Désactiver le 2FA
**POST** `{{base_url}}/admin/2fa/disable`

**Réponse** :
```json
{
  "success": true,
  "message": "2FA désactivé avec succès"
}
```

---

## 3. Gestion des Utilisateurs

### 3.1. Lister tous les utilisateurs
**GET** `{{base_url}}/users/admin/users?page=1&limit=10&role=USER&is_active=true&search=john`

**Query Parameters** :
- `page` : Numéro de page (défaut: `1`)
- `limit` : Nombre d'éléments par page (défaut: `10`)
- `role` : Filtrer par rôle (`USER` | `ADMIN`)
- `is_active` : Filtrer par statut (`true` | `false`)
- `search` : Recherche dans email, prénom, nom

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### 3.2. Récupérer un utilisateur par ID
**GET** `{{base_url}}/users/admin/users/{{user_id}}`

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+33123456789",
    "role": "USER",
    "isActive": true,
    "isEmailConfirmed": true,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

### 3.3. Activer/Désactiver un utilisateur
**PATCH** `{{base_url}}/users/admin/users/{{user_id}}/status`

**Body (JSON)** :
```json
{
  "is_active": false
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": 1,
    "isActive": false
  },
  "message": "Compte désactivé avec succès"
}
```

### 3.4. Supprimer un utilisateur
**DELETE** `{{base_url}}/users/admin/users/{{user_id}}`

**Réponse** :
```json
{
  "success": true,
  "message": "Utilisateur supprimé avec succès"
}
```

### 3.5. Réinitialiser le mot de passe d'un utilisateur
**POST** `{{base_url}}/admin/users/{{user_id}}/reset-password`

**Body (JSON)** :
```json
{
  "newPassword": "NouveauMotDePasse123!",
  "sendEmail": true
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Mot de passe réinitialisé avec succès"
}
```

### 3.6. Statistiques CA par utilisateur
**GET** `{{base_url}}/admin/users/{{user_id}}/revenue-stats?period=month`

**Query Parameters** :
- `period` : `day` | `week` | `month` (défaut: `month`)

**Réponse** :
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "period": "month",
    "ordersCount": 15,
    "totalRevenue": 3750.00,
    "averageOrderValue": 250.00
  }
}
```

---

## 4. Gestion des Produits

### 4.1. Lister tous les produits (admin)
**GET** `{{base_url}}/products/admin/products?page=1&limit=20&status=active&categoryId=1&search=laptop&inStock=true`

**Query Parameters** :
- `page` : Numéro de page (défaut: `1`)
- `limit` : Nombre d'éléments par page (défaut: `20`)
- `status` : Filtrer par statut (`active` | `inactive` | `draft`)
- `categoryId` : Filtrer par catégorie
- `search` : Recherche dans nom et description
- `inStock` : Filtrer par disponibilité (`true` | `false`)

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Laptop Pro",
      "slug": "laptop-pro",
      "priceHt": 833.33,
      "priceTtc": 1000.00,
      "tva": 20.00,
      "stock": 50,
      "status": "active",
      "categoryId": 1,
      "images": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 4.2. Récupérer un produit par ID
**GET** `{{base_url}}/products/admin/products/{{product_id}}`

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Laptop Pro",
    "description": "Description du produit",
    "priceHt": 833.33,
    "priceTtc": 1000.00,
    "tva": 20.00,
    "stock": 50,
    "status": "active",
    "images": []
  }
}
```

### 4.3. Créer un produit
**POST** `{{base_url}}/products/admin/products`

**Body (JSON)** :
```json
{
  "name": "Nouveau Produit",
  "description": "Description du nouveau produit",
  "slug": "nouveau-produit",
  "priceHt": 100.00,
  "tva": 20.00,
  "priceTtc": 120.00,
  "stock": 100,
  "priority": 5,
  "status": "active",
  "categoryId": 1,
  "technicalSpecs": {
    "dimensions": "30x20x10 cm",
    "weight": "1.5 kg"
  }
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": 10,
    "name": "Nouveau Produit",
    "slug": "nouveau-produit"
  },
  "message": "Produit créé avec succès"
}
```

### 4.4. Mettre à jour un produit
**PATCH** `{{base_url}}/products/admin/products/{{product_id}}`

**Body (JSON)** :
```json
{
  "name": "Produit Modifié",
  "stock": 150,
  "status": "active"
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Produit Modifié",
    "stock": 150
  },
  "message": "Produit mis à jour avec succès"
}
```

### 4.5. Supprimer un produit
**DELETE** `{{base_url}}/products/admin/products/{{product_id}}`

**Réponse** :
```json
{
  "success": true,
  "message": "Produit supprimé avec succès"
}
```

### 4.6. Ajouter une image à un produit
**POST** `{{base_url}}/products/admin/products/{{product_id}}/images`

**Body (form-data)** :
- `image` : (file) Fichier image
- `alt` : Texte alternatif
- `isPrimary` : `true` | `false`

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": "image_id",
    "url": "https://storage.example.com/images/product_1_image.jpg",
    "alt": "Description de l'image",
    "isPrimary": true
  },
  "message": "Image ajoutée avec succès"
}
```

### 4.7. Mettre à jour une image
**PATCH** `{{base_url}}/products/admin/products/{{product_id}}/images/{{imageId}}`

**Body (JSON)** :
```json
{
  "alt": "Nouvelle description",
  "isPrimary": false
}
```

### 4.8. Définir une image comme principale
**PATCH** `{{base_url}}/products/admin/products/{{product_id}}/images/{{imageId}}/primary`

**Réponse** :
```json
{
  "success": true,
  "message": "Image principale mise à jour"
}
```

### 4.9. Supprimer une image
**DELETE** `{{base_url}}/products/admin/products/{{product_id}}/images/{{imageId}}`

**Réponse** :
```json
{
  "success": true,
  "message": "Image supprimée avec succès"
}
```

---

## 5. Gestion des Catégories

### 5.1. Lister toutes les catégories
**GET** `{{base_url}}/products/admin/categories?status=active&hierarchy=true`

**Query Parameters** :
- `status` : Filtrer par statut (`active` | `inactive`)
- `hierarchy` : `true` pour obtenir la hiérarchie complète (défaut: `false`)

**Réponse (sans hiérarchie)** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Électronique",
      "slug": "electronique",
      "parentId": null,
      "displayOrder": 1,
      "status": "active"
    },
    {
      "id": 2,
      "name": "Ordinateurs",
      "slug": "ordinateurs",
      "parentId": 1,
      "displayOrder": 1,
      "status": "active"
    }
  ]
}
```

**Réponse (avec hiérarchie)** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Électronique",
      "slug": "electronique",
      "parentId": null,
      "children": [
        {
          "id": 2,
          "name": "Ordinateurs",
          "slug": "ordinateurs",
          "parentId": 1,
          "children": []
        }
      ]
    }
  ]
}
```

### 5.2. Récupérer une catégorie par ID
**GET** `{{base_url}}/products/admin/categories/{{category_id}}`

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Électronique",
    "description": "Description de la catégorie",
    "slug": "electronique",
    "parentId": null,
    "displayOrder": 1,
    "status": "active"
  }
}
```

### 5.3. Créer une catégorie
**POST** `{{base_url}}/products/admin/categories`

**Body (JSON)** :
```json
{
  "name": "Nouvelle Catégorie",
  "description": "Description de la catégorie",
  "slug": "nouvelle-categorie",
  "parentId": null,
  "displayOrder": 1,
  "status": "active"
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "Nouvelle Catégorie",
    "slug": "nouvelle-categorie"
  },
  "message": "Catégorie créée avec succès"
}
```

### 5.4. Mettre à jour une catégorie
**PATCH** `{{base_url}}/products/admin/categories/{{category_id}}`

**Body (JSON)** :
```json
{
  "name": "Catégorie Modifiée",
  "parentId": 1,
  "status": "active"
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Catégorie Modifiée",
    "parentId": 1
  },
  "message": "Catégorie mise à jour avec succès"
}
```

### 5.5. Supprimer une catégorie
**DELETE** `{{base_url}}/products/admin/categories/{{category_id}}`

**Réponse** :
```json
{
  "success": true,
  "message": "Catégorie supprimée avec succès"
}
```

---

## 6. Gestion des Commandes

### 6.1. Lister toutes les commandes
**GET** `{{base_url}}/orders/admin/orders?page=1&limit=50&status=completed&userId=1&orderNumber=ORD-&sortBy=created_at&sortOrder=DESC&dateFrom=2024-01-01&dateTo=2024-12-31`

**Query Parameters** :
- `page` : Numéro de page (défaut: `1`)
- `limit` : Nombre d'éléments par page (défaut: `50`)
- `status` : Filtrer par statut (`pending` | `processing` | `completed` | `canceled`)
- `userId` : Filtrer par utilisateur
- `orderNumber` : Recherche par numéro de commande
- `sortBy` : Trier par (`created_at` | `updated_at` | `total` | `status` | `order_number`)
- `sortOrder` : Ordre de tri (`ASC` | `DESC`)
- `dateFrom` : Date de début (format: `YYYY-MM-DD`)
- `dateTo` : Date de fin (format: `YYYY-MM-DD`)

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "orderNumber": "ORD-1234567890-001",
      "userId": 1,
      "total": 250.00,
      "status": "completed",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

### 6.2. Mettre à jour le statut d'une commande
**POST** `{{base_url}}/orders/admin/orders/{{order_id}}/status`

**Body (JSON)** :
```json
{
  "status": "processing",
  "notes": "Commande en cours de traitement"
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderNumber": "ORD-1234567890-001",
    "status": "processing",
    "statusHistory": [
      {
        "status": "pending",
        "changedAt": "2024-01-15T10:00:00.000Z",
        "changedBy": null,
        "notes": "Commande créée automatiquement après paiement réussi"
      },
      {
        "status": "processing",
        "changedAt": "2024-01-15T11:00:00.000Z",
        "changedBy": 1,
        "notes": "Commande en cours de traitement"
      }
    ]
  },
  "message": "Statut de la commande mis à jour avec succès"
}
```

---

## 7. Gestion des Factures

### 7.1. Télécharger le PDF d'une facture
**GET** `{{base_url}}/orders/invoices/{{invoice_id}}/pdf`

**Réponse** : Fichier PDF téléchargé

**Note** : Cette route est accessible aux utilisateurs pour leurs propres factures et aux admins pour toutes les factures.

---

## 8. Messages de Contact

### 8.1. Créer un message de contact (Public)
**POST** `{{base_url}}/admin/contact-messages`

**Body (JSON)** :
```json
{
  "name": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "subject": "Question sur un produit",
  "message": "Bonjour, j'aimerais avoir des informations sur le produit X."
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "subject": "Question sur un produit",
    "status": "pending",
    "createdAt": "2024-01-15T10:00:00.000Z"
  },
  "message": "Message envoyé avec succès"
}
```

### 8.2. Lister tous les messages (Admin)
**GET** `{{base_url}}/admin/contact-messages?page=1&limit=50&status=pending&assignedTo=1&sortBy=created_at&sortOrder=DESC`

**Query Parameters** :
- `page` : Numéro de page (défaut: `1`)
- `limit` : Nombre d'éléments par page (défaut: `50`)
- `status` : Filtrer par statut (`pending` | `in_progress` | `resolved` | `archived`)
- `assignedTo` : Filtrer par admin assigné
- `sortBy` : Champ de tri (défaut: `created_at`)
- `sortOrder` : Ordre de tri (`ASC` | `DESC`)

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Jean Dupont",
      "email": "jean.dupont@example.com",
      "subject": "Question sur un produit",
      "message": "Bonjour, j'aimerais avoir des informations...",
      "status": "pending",
      "userId": null,
      "assignedTo": null,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50
  }
}
```

### 8.3. Statistiques des messages
**GET** `{{base_url}}/admin/contact-messages/stats`

**Réponse** :
```json
{
  "success": true,
  "data": {
    "pending": 5,
    "inProgress": 2,
    "resolved": 50,
    "archived": 10,
    "total": 67
  }
}
```

### 8.4. Récupérer un message par ID
**GET** `{{base_url}}/admin/contact-messages/{{contact_message_id}}`

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "subject": "Question sur un produit",
    "message": "Bonjour, j'aimerais avoir des informations sur le produit X.",
    "status": "pending",
    "assignedTo": null,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

### 8.5. Mettre à jour le statut d'un message
**PATCH** `{{base_url}}/admin/contact-messages/{{contact_message_id}}/status`

**Body (JSON)** :
```json
{
  "status": "in_progress",
  "assignedTo": 1
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "in_progress",
    "assignedTo": 1,
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  "message": "Statut du message mis à jour avec succès"
}
```

---

## 9. Recherche Elasticsearch (Admin)

### 9.1. Réindexer tous les produits
**POST** `{{base_url}}/products/admin/search/reindex`

**Réponse** :
```json
{
  "success": true,
  "message": "Réindexation terminée. 200 produits indexés."
}
```

---

## Notes importantes

### Authentification
- Toutes les routes admin nécessitent un token JWT valide dans le header `Authorization: Bearer {{access_token}}`
- Le token expire après 15 minutes (configurable)
- Utilisez `/auth/refresh` pour obtenir un nouveau token

### Gestion des erreurs
Toutes les erreurs suivent ce format :
```json
{
  "success": false,
  "error": {
    "type": "ValidationError",
    "message": "Message d'erreur",
    "details": []
  }
}
```

### Codes de statut HTTP
- `200` : Succès
- `201` : Créé avec succès
- `400` : Erreur de validation
- `401` : Non authentifié
- `403` : Accès refusé (pas admin)
- `404` : Ressource introuvable
- `500` : Erreur serveur

### Rate Limiting
- Limite : 100 requêtes par 15 minutes par IP
- Headers de réponse : `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

---

## Collection Postman

Pour faciliter les tests, vous pouvez créer une collection Postman avec :
1. **Variables d'environnement** : `base_url`, `access_token`, etc.
2. **Pre-request Script** : Ajouter automatiquement le header Authorization
3. **Tests** : Sauvegarder automatiquement le token après login

### Exemple de Pre-request Script
```javascript
if (pm.environment.get("access_token")) {
    pm.request.headers.add({
        key: "Authorization",
        value: "Bearer " + pm.environment.get("access_token")
    });
}
```

### Exemple de Test Script (après login)
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    if (jsonData.data && jsonData.data.accessToken) {
        pm.environment.set("access_token", jsonData.data.accessToken);
        pm.environment.set("refresh_token", jsonData.data.refreshToken);
        pm.environment.set("admin_user_id", jsonData.data.user.id);
    }
}
```

