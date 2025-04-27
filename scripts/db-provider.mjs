// Prisma sağlayıcısını değiştirir: node scripts/db-provider.mjs <sqlite|postgresql>
// Şema her iki sağlayıcıyla uyumlu yazıldı (enum ve skaler liste yok; diziler JSON metni olarak saklanır).
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const target = process.argv[2];
if (!["sqlite", "postgresql"].includes(target)) {
  console.error("Kullanım: node scripts/db-provider.mjs <sqlite|postgresql>");
  process.exit(1);
}

const schemaPath = "prisma/schema.prisma";
const schema = readFileSync(schemaPath, "utf8");
const next = schema.replace(
  /(datasource db \{[^}]*provider\s*=\s*)"(sqlite|postgresql)"/,
  `$1"${target}"`,
);
writeFileSync(schemaPath, next, "utf8");
console.log(`✓ prisma/schema.prisma sağlayıcısı: ${target}`);

const defaults = {
  sqlite: 'DATABASE_URL="file:./dev.db"',
  postgresql: 'DATABASE_URL="postgresql://kiler:kiler@localhost:5432/kiler?schema=public"',
};

if (existsSync(".env")) {
  const env = readFileSync(".env", "utf8");
  const current = env.match(/^DATABASE_URL=.*$/m)?.[0] ?? "";
  const matches = target === "sqlite" ? current.includes("file:") : current.includes("postgres");
  if (!matches) {
    writeFileSync(".env", env.replace(/^DATABASE_URL=.*$/m, defaults[target]), "utf8");
    console.log(`✓ .env içindeki DATABASE_URL güncellendi → ${defaults[target]}`);
  }
}

console.log("Sonraki adım: npm run setup  (şemayı uygular ve demo verileri yükler)");
