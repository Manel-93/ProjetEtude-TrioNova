import { UserRepository } from '../repositories/userRepository.js';
import { LoginHistoryRepository } from '../repositories/loginHistoryRepository.js';
import { AddressRepository } from '../repositories/addressRepository.js';
import { PaymentMethodRepository } from '../repositories/paymentMethodRepository.js';

export class UserService {
  constructor() {
    this.userRepository = new UserRepository();
    this.loginHistoryRepository = new LoginHistoryRepository();
    this.addressRepository = new AddressRepository();
    this.paymentMethodRepository = new PaymentMethodRepository();
  }

  // Masquer les données sensibles
  sanitizeUser(user) {
    if (!user) return null;
    const { password_hash, ...sanitized } = user;
    return sanitized;
  }

  sanitizeUserList(users) {
    return users.map(user => this.sanitizeUser(user));
  }

  async getMyProfile(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Utilisateur introuvable');
    }
    if (!user.is_active) {
      throw new Error('Compte désactivé');
    }
    
    const addresses = await this.addressRepository.findByUserId(userId);
    const paymentMethods = await this.paymentMethodRepository.findByUserId(userId);
    
    return {
      ...this.sanitizeUser(user),
      addresses,
      paymentMethods
    };
  }

  async updateMyProfile(userId, updateData) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Utilisateur introuvable');
    }
    if (!user.is_active) {
      throw new Error('Compte désactivé');
    }
    
    const updatedUser = await this.userRepository.update(userId, updateData);
    return this.sanitizeUser(updatedUser);
  }

  async deleteMyAccount(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Utilisateur introuvable');
    }
    
    // Supprimer les données associées (MySQL)
    await this.addressRepository.deleteByUserId(userId);
    await this.paymentMethodRepository.deleteByUserId(userId);
    
    // Supprimer l'utilisateur
    await this.userRepository.delete(userId);
    
    return { message: 'Compte supprimé avec succès' };
  }

  async getLoginHistory(userId, pagination) {
    return await this.loginHistoryRepository.findByUserId(userId, pagination);
  }

  async logLogin(userId, ipAddress, userAgent, success = true, failureReason = null) {
    return await this.loginHistoryRepository.create({
      userId,
      ipAddress,
      userAgent,
      success,
      failureReason
    });
  }

  // Admin methods
  async getAllUsers(filters, pagination) {
    const result = await this.userRepository.findAll(filters, pagination);
    return {
      ...result,
      data: this.sanitizeUserList(result.data)
    };
  }

  async getUserById(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Utilisateur introuvable');
    }
    return this.sanitizeUser(user);
  }

  async updateUserStatus(userId, isActive) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Utilisateur introuvable');
    }
    
    const updatedUser = await this.userRepository.updateStatus(userId, isActive);
    return this.sanitizeUser(updatedUser);
  }

  async deleteUser(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Utilisateur introuvable');
    }
    
    // Supprimer les données associées
    await this.addressRepository.deleteByUserId(userId);
    await this.paymentMethodRepository.deleteByUserId(userId);
    
    await this.userRepository.delete(userId);
    return { message: 'Utilisateur supprimé avec succès' };
  }

  // Address management
  async getMyAddresses(userId, type = null) {
    return await this.addressRepository.findByUserId(userId, type);
  }

  async createAddress(userId, addressData) {
    const address = await this.addressRepository.create({
      ...addressData,
      userId
    });
    
    // Si c'est la première adresse de ce type, la définir comme default
    const addresses = await this.addressRepository.findByUserId(userId, addressData.type);
    if (addresses.length === 1) {
      await this.addressRepository.setDefault(userId, address.id, addressData.type);
      return await this.addressRepository.findById(address.id);
    }
    
    return address;
  }

  async updateAddress(userId, addressId, addressData) {
    const address = await this.addressRepository.findByUserIdAndId(userId, addressId);
    if (!address) {
      throw new Error('Adresse introuvable');
    }
    
    return await this.addressRepository.update(addressId, addressData);
  }

  async setDefaultAddress(userId, addressId) {
    const address = await this.addressRepository.findByUserIdAndId(userId, addressId);
    if (!address) {
      throw new Error('Adresse introuvable');
    }
    
    return await this.addressRepository.setDefault(userId, addressId, address.type);
  }

  async deleteAddress(userId, addressId) {
    const address = await this.addressRepository.findByUserIdAndId(userId, addressId);
    if (!address) {
      throw new Error('Adresse introuvable');
    }
    
    await this.addressRepository.delete(userId, addressId);
    return { message: 'Adresse supprimée avec succès' };
  }

  // Payment method management
  async getMyPaymentMethods(userId) {
    return await this.paymentMethodRepository.findByUserId(userId);
  }

  async createPaymentMethod(userId, paymentData) {
    // Vérifier que le token Stripe est valide (à implémenter avec Stripe SDK si nécessaire)
    const paymentMethod = await this.paymentMethodRepository.create({
      ...paymentData,
      userId
    });
    
    // Si c'est la première méthode de paiement, la définir comme default
    const methods = await this.paymentMethodRepository.findByUserId(userId);
    if (methods.length === 1) {
      await this.paymentMethodRepository.setDefault(userId, paymentMethod.id);
      return await this.paymentMethodRepository.findById(paymentMethod.id);
    }
    
    return paymentMethod;
  }

  async setDefaultPaymentMethod(userId, paymentMethodId) {
    const method = await this.paymentMethodRepository.findByUserIdAndId(userId, paymentMethodId);
    if (!method) {
      throw new Error('Méthode de paiement introuvable');
    }
    
    return await this.paymentMethodRepository.setDefault(userId, paymentMethodId);
  }

  async deletePaymentMethod(userId, paymentMethodId) {
    const method = await this.paymentMethodRepository.findByUserIdAndId(userId, paymentMethodId);
    if (!method) {
      throw new Error('Méthode de paiement introuvable');
    }
    
    await this.paymentMethodRepository.delete(userId, paymentMethodId);
    return { message: 'Méthode de paiement supprimée avec succès' };
  }
}

