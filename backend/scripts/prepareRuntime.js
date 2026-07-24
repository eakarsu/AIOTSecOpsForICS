const crypto = require('node:crypto');
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.scrypt(password, salt, 64, (error, digest) => {
      if (error) return reject(error);
      resolve(`scrypt$${salt.toString('hex')}$${digest.toString('hex')}`);
    });
  });
}

async function main() {
  const migrationDirectory = path.join(__dirname, '..', 'migrations');
  for (const name of fs.readdirSync(migrationDirectory).filter((item) => item.endsWith('.sql')).sort()) {
    await pool.query(fs.readFileSync(path.join(migrationDirectory, name), 'utf8'));
  }
  const email = process.env.PROVISION_ADMIN_EMAIL;
  const password = process.env.PROVISION_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Runtime administrator credentials are required');
  await pool.query(
    `INSERT INTO users(email,password,name,role) VALUES($1,$2,$3,'admin')
     ON CONFLICT(email) DO UPDATE SET password=EXCLUDED.password,name=EXCLUDED.name,role=EXCLUDED.role,updated_at=NOW()`,
    [email.toLowerCase(), await hashPassword(password), process.env.PROVISION_ADMIN_NAME || 'Runtime Administrator'],
  );
  await pool.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
