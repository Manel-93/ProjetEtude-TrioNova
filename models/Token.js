import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: Number,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['email_confirm', 'refresh', 'password_reset'],
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index pour suppression automatique
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // On gère createdAt manuellement
});

// Index composé pour les requêtes fréquentes
tokenSchema.index({ token: 1, type: 1 });
tokenSchema.index({ userId: 1, type: 1 });
tokenSchema.index({ expiresAt: 1 });

const Token = mongoose.model('Token', tokenSchema);

export default Token;

