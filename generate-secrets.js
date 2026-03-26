#!/usr/bin/env node
/**
 * Secret Generator — Run this to generate new cryptographically secure secrets.
 * Usage: node generate-secrets.js
 *
 * After running, copy the output into your .env file and:
 *   1. Change the MongoDB password in MongoDB Atlas
 *   2. Replace MONGODB_URI with the new credentials
 */

const crypto = require('crypto');

const generate = (bytes = 64) => crypto.randomBytes(bytes).toString('hex');

console.log('\n=== GENERATED SECRETS — copy into .env ===\n');
console.log(`JWT_SECRET=${generate()}`);
console.log(`JWT_REFRESH_SECRET=${generate()}`);
console.log(`SESSION_SECRET=${generate()}`);
console.log('\n⚠  Also change your MongoDB Atlas password manually.');
console.log('   Atlas → Database Access → Edit user → Update password\n');
