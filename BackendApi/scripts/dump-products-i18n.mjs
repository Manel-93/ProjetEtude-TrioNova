import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const [rows] = await pool.query(
  `SELECT name, slug, description, technical_specs FROM products WHERE status = 'active' ORDER BY name`
);

for (const r of rows) {
  const specs =
    typeof r.technical_specs === 'string'
      ? JSON.parse(r.technical_specs)
      : r.technical_specs;
  console.log(JSON.stringify({ name: r.name, slug: r.slug, description: r.description, specs }, null, 0));
}

await pool.end();
