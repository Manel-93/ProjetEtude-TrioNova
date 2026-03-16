# Guide Postman - TrioNova API

Ce guide vous permet de tester tous les endpoints de l'API TrioNova, notamment les nouvelles fonctionnalités de commandes et facturation.

## Configuration de base

**Base URL** : `http://localhost:5000/api`

### Variables d'environnement Postman (recommandé)

Créez un environnement Postman avec les variables suivantes :
- `base_url` : `http://localhost:5000/api`
- `access_token` : (sera rempli après connexion)
- `refresh_token` : (sera rempli après connexion)
- `user_id` : (sera rempli après connexion)
- `order_id` : (sera rempli après création de commande)
- `invoice_id` : (sera rempli après création de facture)
- `cart_id` : (sera rempli après récupération du panier)

---

## 1. Authentification

### 1.1. Inscription
**POST** `{{base_url}}/auth/register`

**Body (JSON)** :
```json
{
  "email": "test@example.com",
  "password": "MotDePasse123!",
  "firstName": "Jean",
  "lastName": "Dupont"
}
```

**Réponse** : Token de confirmation email (à utiliser dans l'étape suivante)

### 1.2. Confirmation email
**POST** `{{base_url}}/auth/confirm-email`

**Body (JSON)** :
```json
{
  "token": "token_de_confirmation"
}
```

### 1.3. Connexion
**POST** `{{base_url}}/auth/login`

**Body (JSON)** :
```json
{
  "email": "test@example.com",
  "password": "MotDePasse123!"
}
```

**Réponse** : 
```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "user": { ... }
  }
}
```

**⚠️ Important** : Sauvegardez le `accessToken` dans la variable `{{access_token}}` pour les requêtes suivantes.

**Headers à ajouter** :
- `Authorization: Bearer {{access_token}}`

---

## 2. Produits (prérequis pour les commandes)

### 2.1. Lister les produits
**GET** `{{base_url}}/products`

**Query params** (optionnels) :
- `page` : 1
- `limit` : 20
- `status` : active
- `inStock` : true

### 2.2. Obtenir un produit par slug
**GET** `{{base_url}}/products/:slug`

Exemple : `{{base_url}}/products/produit-medical-123`

---

## 3. Panier

### 3.1. Ajouter un produit au panier
**POST** `{{base_url}}/cart/add`

**Headers** :
- `Authorization: Bearer {{access_token}}` (si utilisateur connecté)
- OU `X-Guest-Token: votre_token_invite` (si invité)

**Body (JSON)** :
```json
{
  "productId": 1,
  "quantity": 2
}
```

### 3.2. Récupérer le panier
**GET** `{{base_url}}/cart`

**Headers** :
- `Authorization: Bearer {{access_token}}` (si utilisateur connecté)
- OU `X-Guest-Token: votre_token_invite` (si invité)

**Réponse** :
```json
{
  "success": true,
  "data": {
    "cart": { ... },
    "items": [ ... ],
    "subtotal": 100.00,
    "tva": 20.00,
    "total": 120.00
  }
}
```

### 3.3. Valider le stock du panier
**GET** `{{base_url}}/cart/validate`

**Headers** :
- `Authorization: Bearer {{access_token}}` (si utilisateur connecté)
- OU `X-Guest-Token: votre_token_invite` (si invité)

---

## 4. Paiement

### 4.1. Créer un PaymentIntent
**POST** `{{base_url}}/payments/create-intent`

**Headers** :
- `Authorization: Bearer {{access_token}}` (si utilisateur connecté)
- OU `X-Guest-Token: votre_token_invite` (si invité)

**Réponse** :
```json
{
  "success": true,
  "data": {
    "paymentIntentId": "pi_...",
    "clientSecret": "pi_..._secret_...",
    "amount": 120.00,
    "currency": "EUR"
  }
}
```

**⚠️ Note** : Utilisez le `clientSecret` côté frontend avec Stripe.js pour finaliser le paiement.

### 4.2. Webhook Stripe (automatique)
Le webhook Stripe est configuré pour créer automatiquement une commande et une facture après un paiement réussi.

**POST** `{{base_url}}/payments/webhook`

**⚠️ Note** : Cette route est appelée automatiquement par Stripe. Pour tester manuellement, vous devez configurer un webhook dans le dashboard Stripe.

---

## 5. Commandes

### 5.1. Récupérer mes commandes
**GET** `{{base_url}}/orders`

**Headers** :
- `Authorization: Bearer {{access_token}}`

**Query params** (optionnels) :
- `page` : 1
- `limit` : 20

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "orderNumber": "ORD-1234567890-001",
      "status": "processing",
      "total": 120.00,
      "currency": "EUR",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

**💡 Astuce** : Sauvegardez l'`id` de la première commande dans `{{order_id}}` pour les tests suivants.

### 5.2. Récupérer une commande par ID
**GET** `{{base_url}}/orders/{{order_id}}`

**Headers** :
- `Authorization: Bearer {{access_token}}`

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderNumber": "ORD-1234567890-001",
    "status": "processing",
    "subtotal": 100.00,
    "tva": 20.00,
    "total": 120.00,
    "currency": "EUR",
    "shippingAddress": { ... },
    "billingAddress": { ... },
    "items": [
      {
        "id": 1,
        "productId": 1,
        "productName": "Produit médical",
        "quantity": 2,
        "unitPriceHt": 50.00,
        "unitPriceTtc": 60.00,
        "total": 120.00
      }
    ],
    "statusHistory": [
      {
        "id": 1,
        "status": "pending",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "changedBy": null,
        "notes": "Commande créée automatiquement après paiement réussi"
      },
      {
        "id": 2,
        "status": "processing",
        "createdAt": "2024-01-15T10:30:05.000Z",
        "changedBy": null,
        "notes": null
      }
    ],
    "invoice": {
      "id": 1,
      "invoiceNumber": "FAC-2024-000001",
      "status": "issued",
      "pdfPath": "/path/to/invoice.pdf"
    }
  }
}
```

**💡 Astuce** : Sauvegardez l'`id` de la facture dans `{{invoice_id}}` pour télécharger le PDF.

---

## 6. Factures

### 6.1. Télécharger le PDF d'une facture
**GET** `{{base_url}}/orders/invoices/{{invoice_id}}/pdf`

**Headers** :
- `Authorization: Bearer {{access_token}}`

**Réponse** : Fichier PDF (Content-Type: application/pdf)

**💡 Astuce Postman** : 
1. Dans l'onglet "Tests", ajoutez :
```javascript
pm.response.headers.get("Content-Type") === "application/pdf"
```
2. Cliquez sur "Send and Download" pour sauvegarder le PDF.

---

## 7. Administration (Admin uniquement)

### 7.1. Récupérer toutes les commandes (Admin)
**GET** `{{base_url}}/orders/admin/orders`

**Headers** :
- `Authorization: Bearer {{access_token}}` (token d'un utilisateur ADMIN)

**Query params** (optionnels) :
- `status` : pending, processing, completed, canceled
- `userId` : ID de l'utilisateur
- `page` : 1
- `limit` : 50

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "orderNumber": "ORD-1234567890-001",
      "userId": 1,
      "status": "processing",
      "total": 120.00,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50
  }
}
```

### 7.2. Mettre à jour le statut d'une commande (Admin)
**POST** `{{base_url}}/orders/admin/orders/{{order_id}}/status`

**Headers** :
- `Authorization: Bearer {{access_token}}` (token d'un utilisateur ADMIN)
- `Content-Type: application/json`

**Body (JSON)** :
```json
{
  "status": "completed",
  "notes": "Commande expédiée avec succès"
}
```

**Statuts possibles** :
- `pending` : Commande en attente
- `processing` : Commande en cours de traitement
- `completed` : Commande terminée
- `canceled` : Commande annulée (génère automatiquement un avoir)

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderNumber": "ORD-1234567890-001",
    "status": "completed",
    ...
  },
  "message": "Statut de la commande mis à jour avec succès"
}
```

**⚠️ Important** : Lorsqu'une commande est annulée (`canceled`), un avoir (credit note) est automatiquement généré si une facture existe.

---

## 8. Scénario de test complet

### Étape 1 : Authentification
1. Créer un compte : `POST /auth/register`
2. Confirmer l'email : `POST /auth/confirm-email`
3. Se connecter : `POST /auth/login`
4. Sauvegarder le token dans `{{access_token}}`

### Étape 2 : Préparer le panier
1. Lister les produits : `GET /products`
2. Ajouter un produit au panier : `POST /cart/add`
3. Vérifier le panier : `GET /cart`
4. Valider le stock : `GET /cart/validate`

### Étape 3 : Paiement
1. Créer un PaymentIntent : `POST /payments/create-intent`
2. **Simuler le paiement** : Utiliser Stripe Test Mode avec une carte de test
   - Carte de test : `4242 4242 4242 4242`
   - Date d'expiration : n'importe quelle date future
   - CVC : n'importe quel 3 chiffres
3. Le webhook Stripe créera automatiquement la commande et la facture

### Étape 4 : Vérifier la commande
1. Récupérer mes commandes : `GET /orders`
2. Récupérer une commande : `GET /orders/:id`
3. Vérifier l'historique des statuts dans la réponse

### Étape 5 : Télécharger la facture
1. Récupérer le PDF : `GET /orders/invoices/:id/pdf`
2. Sauvegarder le fichier PDF

### Étape 6 : Administration (si admin)
1. Récupérer toutes les commandes : `GET /orders/admin/orders`
2. Mettre à jour le statut : `POST /orders/admin/orders/:id/status`
3. Tester l'annulation (génère un avoir) : `POST /orders/admin/orders/:id/status` avec `status: "canceled"`

---

## 9. Codes de statut HTTP

- `200` : Succès
- `201` : Créé avec succès
- `400` : Erreur de validation
- `401` : Non authentifié
- `403` : Accès refusé (droits insuffisants)
- `404` : Ressource introuvable
- `500` : Erreur serveur

---

## 10. Gestion des erreurs

Toutes les erreurs suivent ce format :

```json
{
  "success": false,
  "error": {
    "type": "ErrorType",
    "message": "Message d'erreur détaillé"
  }
}
```

**Types d'erreurs courants** :
- `ValidationError` : Erreur de validation des données
- `AuthenticationError` : Erreur d'authentification
- `AuthorizationError` : Erreur d'autorisation
- `NotFoundError` : Ressource introuvable
- `RateLimitError` : Trop de requêtes

---

## 11. Notes importantes

1. **Tokens JWT** : Les access tokens expirent après 15 minutes. Utilisez le refresh token pour obtenir un nouveau token.

2. **Panier invité** : Pour tester sans compte, utilisez le header `X-Guest-Token` avec un token généré.

3. **Webhook Stripe** : Pour tester en local, utilisez Stripe CLI :
   ```bash
   stripe listen --forward-to localhost:5000/api/payments/webhook
   ```

4. **PDF Factures** : Les PDFs sont générés automatiquement et stockés dans le dossier `invoices/` du projet.

5. **Avoirs** : Les avoirs sont générés automatiquement lors de l'annulation d'une commande avec facture.

---

## 12. Collection Postman

Pour faciliter les tests, créez une collection Postman avec :
- **Variables d'environnement** : base_url, access_token, etc.
- **Scripts Pre-request** : Pour automatiser la récupération de tokens
- **Tests automatiques** : Pour valider les réponses

Exemple de script Pre-request pour auto-login :
```javascript
if (!pm.environment.get("access_token")) {
    pm.sendRequest({
        url: pm.environment.get("base_url") + "/auth/login",
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        body: {
            mode: 'raw',
            raw: JSON.stringify({
                email: "test@example.com",
                password: "MotDePasse123!"
            })
        }
    }, function (err, res) {
        if (res.json().success) {
            pm.environment.set("access_token", res.json().data.accessToken);
        }
    });
}
```

---

**Bon test ! 🚀**

