#!/usr/bin/env node
/**
 * Membuat hash password scrypt untuk FleetOps 360.
 *
 * Pemakaian:
 *   npm run hash-password -- "password-rahasia"
 *   node scripts/hash-password.mjs "password-rahasia"
 *
 * Tanpa argumen, skrip akan meminta password secara interaktif.
 * Hasil ditempel ke ADMIN_PASSWORD_HASH / DRIVER_PASSWORD_HASH.
 */
import { randomBytes, scryptSync } from 'node:crypto'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const key = scryptSync(password, salt, 64).toString('hex')
  // Pemisah ':' agar aman di file .env (Next.js meng-expand '$nama').
  return `scrypt:${salt}:${key}`
}

const fromArgs = process.argv.slice(2).join(' ').trim()
let password = fromArgs

if (!password) {
  if (!stdin.isTTY) {
    console.error('Password tidak diberikan. Jalankan: npm run hash-password -- "password"')
    process.exit(1)
  }
  const prompt = createInterface({ input: stdin, output: stdout })
  password = (await prompt.question('Password: ')).trim()
  prompt.close()
}

if (!password) {
  console.error('Password tidak boleh kosong.')
  process.exit(1)
}

if (password.length < 8) {
  console.warn('Peringatan: password kurang dari 8 karakter. Gunakan password yang lebih kuat untuk produksi.')
}

console.log('\nTempelkan nilai berikut ke variabel lingkungan:\n')
console.log(hashPassword(password))
console.log('')
