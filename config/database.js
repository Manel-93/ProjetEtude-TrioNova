import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MySQL connexion
let mysqlPool = null;

export const getMySQLConnection = async () => {
  if (!mysqlPool) {
    mysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE || 'trio_nova_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return mysqlPool;
};

// MongoDB connexion avec Mongoose
let isMongoConnected = false;

export const connectMongoDB = async () => {
  if (isMongoConnected) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trio_nova_db';
  
  // Options de connexion
  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    retryWrites: true,
    w: 'majority'
  };

  try {
    await mongoose.connect(mongoUri, options);
    isMongoConnected = true;
    
    // Gestion des evenements de connexion
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isMongoConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
      isMongoConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
      isMongoConnected = true;
    });

    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    isMongoConnected = false;
    throw error;
  }
};

export const getMongoConnection = async () => {
  return await connectMongoDB();
};

// Initialisation des bases de donnees
export const initializeDatabases = async () => {
  try {
    // MySQL - Creation de la table users
    const mysqlPool = await getMySQLConnection();
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role ENUM('USER', 'ADMIN') DEFAULT 'USER',
        is_email_confirmed BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_email_confirmed (is_email_confirmed),
        INDEX idx_role (role),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Migration : Ajouter les colonnes si elles n'existent pas
    try {
      const [columns] = await mysqlPool.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
      `, [process.env.MYSQL_DATABASE || 'trio_nova_db']);
      
      const existingColumns = columns.map(col => col.COLUMN_NAME);
      
      if (!existingColumns.includes('phone')) {
        await mysqlPool.execute(`ALTER TABLE users ADD COLUMN phone VARCHAR(20)`);
      }
      if (!existingColumns.includes('role')) {
        await mysqlPool.execute(`ALTER TABLE users ADD COLUMN role ENUM('USER', 'ADMIN') DEFAULT 'USER'`);
      }
      if (!existingColumns.includes('is_active')) {
        await mysqlPool.execute(`ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE`);
      }
    } catch (error) {
      console.warn('Migration warning:', error.message);
    }

    // Création de la table addresses
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('billing', 'shipping') NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        company VARCHAR(100),
        address_line1 VARCHAR(200) NOT NULL,
        address_line2 VARCHAR(200),
        city VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20) NOT NULL,
        country VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_user_type (user_id, type),
        INDEX idx_user_type_default (user_id, type, is_default)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Création de la table payment_methods
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        stripe_customer_id VARCHAR(255) NOT NULL,
        stripe_payment_method_id VARCHAR(255) NOT NULL,
        type ENUM('card', 'bank_account') DEFAULT 'card',
        is_default BOOLEAN DEFAULT FALSE,
        last4 VARCHAR(4),
        brand VARCHAR(50),
        expiry_month INT,
        expiry_year INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_stripe_customer_id (stripe_customer_id),
        INDEX idx_user_default (user_id, is_default)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Création de la table categories
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        display_order INT DEFAULT 0,
        status ENUM('active', 'inactive') DEFAULT 'active',
        slug VARCHAR(200) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_slug (slug),
        INDEX idx_status (status),
        INDEX idx_display_order (display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Création de la table products
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        technical_specs JSON,
        price_ht DECIMAL(10, 2) NOT NULL,
        tva DECIMAL(5, 2) DEFAULT 20.00,
        price_ttc DECIMAL(10, 2) NOT NULL,
        stock INT DEFAULT 0,
        priority INT DEFAULT 0,
        status ENUM('active', 'inactive', 'draft') DEFAULT 'active',
        slug VARCHAR(200) UNIQUE NOT NULL,
        category_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX idx_slug (slug),
        INDEX idx_status (status),
        INDEX idx_category_id (category_id),
        INDEX idx_priority (priority),
        INDEX idx_stock (stock),
        INDEX idx_status_priority_stock (status, priority DESC, stock)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ MySQL database initialized');
  } catch (error) {
    console.error('❌ MySQL initialization error:', error.message);
    throw error;
  }

  try {
    // MongoDB - Connexion
    const mongoConnection = await connectMongoDB();
    const dbName = mongoConnection.db.databaseName;
  
    await import('../models/Token.js');
    await import('../models/LoginHistory.js');
    await import('../models/ProductImage.js');
    
    console.log(`✅ MongoDB connected (database: ${dbName})`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    if (error.message.includes('whitelist') || error.message.includes('IP')) {
      console.error('\n⚠️  SOLUTION: Ajoutez votre IP actuelle à la whitelist MongoDB Atlas:');
      console.error('   1. Connectez-vous à https://cloud.mongodb.com/');
      console.error('   2. Allez dans "Network Access"');
      console.error('   3. Cliquez sur "Add IP Address"');
      console.error('   4. Ajoutez votre IP actuelle ou utilisez "0.0.0.0/0" pour autoriser toutes les IPs (développement uniquement)');
      console.error('   5. Attendez quelques minutes que les changements soient appliqués\n');
    }
    
    // En développement, on peut continuer sans MongoDB (mais certaines fonctionnalités ne fonctionneront pas)
    if (process.env.NODE_ENV === 'development' && process.env.ALLOW_NO_MONGODB === 'true') {
      console.warn('⚠️  Mode développement: Le serveur continue sans MongoDB (fonctionnalités limitées)');
      return;
    }
    
    throw error;
  }
};

