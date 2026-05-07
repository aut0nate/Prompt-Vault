import bcrypt from "bcrypt";

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run password:hash -- "your-strong-password"');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
const escapedHash = hash.replaceAll("$", "\\$");

console.log(`ADMIN_PASSWORD_HASH="${escapedHash}"`);
