import { getMySQLConnection } from '../config/database.js';

export class CarouselRepository {
  async findAllActive() {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM carousel_slides WHERE active = TRUE ORDER BY display_order ASC, id ASC'
    );
    return rows.map((row) => this.mapRowToObject(row));
  }

  async findAll() {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute(
      'SELECT * FROM carousel_slides ORDER BY display_order ASC, id ASC'
    );
    return rows.map((row) => this.mapRowToObject(row));
  }

  async findById(id) {
    const pool = await getMySQLConnection();
    const [rows] = await pool.execute('SELECT * FROM carousel_slides WHERE id = ?', [id]);
    return rows[0] ? this.mapRowToObject(rows[0]) : null;
  }

  async create(data) {
    const pool = await getMySQLConnection();
    const [result] = await pool.execute(
      `INSERT INTO carousel_slides (title, subtitle, image_url, link_url, active, display_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.title || null,
        data.subtitle || null,
        data.imageUrl,
        data.linkUrl || null,
        data.active ?? true,
        data.displayOrder ?? 0
      ]
    );
    return this.findById(result.insertId);
  }

  async update(id, data) {
    const pool = await getMySQLConnection();
    const updates = [];
    const params = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      params.push(data.title);
    }
    if (data.subtitle !== undefined) {
      updates.push('subtitle = ?');
      params.push(data.subtitle);
    }
    if (data.imageUrl !== undefined) {
      updates.push('image_url = ?');
      params.push(data.imageUrl);
    }
    if (data.linkUrl !== undefined) {
      updates.push('link_url = ?');
      params.push(data.linkUrl);
    }
    if (data.active !== undefined) {
      updates.push('active = ?');
      params.push(data.active);
    }
    if (data.displayOrder !== undefined) {
      updates.push('display_order = ?');
      params.push(data.displayOrder);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    params.push(id);
    await pool.execute(`UPDATE carousel_slides SET ${updates.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  async delete(id) {
    const pool = await getMySQLConnection();
    await pool.execute('DELETE FROM carousel_slides WHERE id = ?', [id]);
    return true;
  }

  async reorder(items) {
    const pool = await getMySQLConnection();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();
      for (const item of items) {
        await conn.execute(
          'UPDATE carousel_slides SET display_order = ? WHERE id = ?',
          [item.displayOrder, item.id]
        );
      }
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  mapRowToObject(row) {
    return {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      imageUrl: row.image_url,
      linkUrl: row.link_url,
      active: Boolean(row.active),
      displayOrder: row.display_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
