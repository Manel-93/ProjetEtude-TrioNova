import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MySQL Connection Pool
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

// MongoDB Connection avec Mongoose
let isMongoConnected = false;

export const connectMongoDB = async () => {
  if (isMongoConnected) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trio_nova_db';
  
  // Options de connexion pour MongoDB Atlas
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
    
    // Gestion des événements de connexion
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

// Initialize databases
export const initializeDatabases = async () => {
  try {
    // MySQL - Create users table
    const mysqlPool = await getMySQLConnection();
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        is_email_confirmed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_email_confirmed (is_email_confirmed)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ MySQL database initialized');
  } catch (error) {
    console.error('❌ MySQL initialization error:', error.message);
    throw error;
  }

  try {
    // MongoDB - Connexion avec Mongoose
    const mongoConnection = await connectMongoDB();
    const dbName = mongoConnection.db.databaseName;
    
    // Charger les modèles Mongoose
    await import('../models/Token.js');
    
    console.log(`✅ MongoDB connected (database: ${dbName})`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
};

