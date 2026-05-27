import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../BackendApi/.env') });

const pool = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const [rows] = await pool.query(
  `SELECT name, technical_specs FROM products
   WHERE technical_specs IS NOT NULL AND JSON_LENGTH(technical_specs) > 0
   LIMIT 15`
);

const keys = new Set();
const values = new Set();
for (const r of rows) {
  const specs = typeof r.technical_specs === 'string' ? JSON.parse(r.technical_specs) : r.technical_specs;
  console.log('\n===', r.name, '===');
  console.log(JSON.stringify(specs, null, 2));
  for (const [k, v] of Object.entries(specs || {})) {
    keys.add(k);
    values.add(String(v));
  }
}
console.log('\n--- UNIQUE KEYS ---\n', [...keys].sort().join('\n'));
console.log('\n--- UNIQUE VALUES (sample) ---\n', [...values].slice(0, 40).join('\n'));
await pool.end();
