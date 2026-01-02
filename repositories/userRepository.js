import { getMySQLConnection } from '../config/database.js';

export class UserRepository {
  async findByEmail(email) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  }

  async findById(id) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT id, email, first_name, last_name, is_email_confirmed, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  async create(userData) {
    const pool = await getMySQLConnection();
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, first_name, last_name, is_email_confirmed) VALUES (?, ?, ?, ?, ?)',
      [
        userData.email,
        userData.passwordHash,
        userData.firstName,
        userData.lastName,
        userData.isEmailConfirmed || false
      ]
    );
    return this.findById(result.insertId);
  }

  async updateEmailConfirmed(userId, isConfirmed) {
    const pool = await getMySQLConnection();
    await pool.execute(
      'UPDATE users SET is_email_confirmed = ? WHERE id = ?',
      [isConfirmed, userId]
    );
    return this.findById(userId);
  }

  async updatePassword(userId, passwordHash) {
    const pool = await getMySQLConnection();
    await pool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );
    return this.findById(userId);
  }
}

