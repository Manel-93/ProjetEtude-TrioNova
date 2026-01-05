import { getMySQLConnection } from '../config/database.js';

export class CategoryRepository {
  async findAll(filters = {}) {
    const pool = await getMySQLConnection();
    let query = 'SELECT * FROM categories WHERE 1=1';
    const params = [];
    
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    query += ' ORDER BY display_order ASC, created_at ASC';
    
    const [rows] = await pool.execute(query, params);
    return rows.map(row => this.mapRowToObject(row));
  }

  async findBySlug(slug) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM categories WHERE slug = ? AND status = ?',
      [slug, 'active']
    );
    return rows[0] ? this.mapRowToObject(rows[0]) : null;
  }

  async findById(id) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0] ? this.mapRowToObject(rows[0]) : null;
  }

  async create(categoryData) {
    const pool = await getMySQLConnection();
    const [result] = await pool.execute(`
      INSERT INTO categories (name, description, display_order, status, slug)
      VALUES (?, ?, ?, ?, ?)
    `, [
      categoryData.name,
      categoryData.description || null,
      categoryData.displayOrder || 0,
      categoryData.status || 'active',
      categoryData.slug
    ]);
    return this.findById(result.insertId);
  }

  async update(id, categoryData) {
    const pool = await getMySQLConnection();
    const updates = [];
    const params = [];
    
    if (categoryData.name !== undefined) {
      updates.push('name = ?');
      params.push(categoryData.name);
    }
    if (categoryData.description !== undefined) {
      updates.push('description = ?');
      params.push(categoryData.description);
    }
    if (categoryData.displayOrder !== undefined) {
      updates.push('display_order = ?');
      params.push(categoryData.displayOrder);
    }
    if (categoryData.status !== undefined) {
      updates.push('status = ?');
      params.push(categoryData.status);
    }
    if (categoryData.slug !== undefined) {
      updates.push('slug = ?');
      params.push(categoryData.slug);
    }
    
    if (updates.length === 0) {
      return this.findById(id);
    }
    
    params.push(id);
    await pool.execute(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    return this.findById(id);
  }

  async delete(id) {
    const pool = await getMySQLConnection();
    await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
    return true;
  }

  mapRowToObject(row) {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      displayOrder: row.display_order,
      status: row.status,
      slug: row.slug,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

