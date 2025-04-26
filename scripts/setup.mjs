// Tek komutla kurulum: .env oluşturur (yoksa), Prisma client üretir, şemayı uygular ve seed çalıştırır.
// Platformdan bağımsızdır (Windows PowerShell 5.1 dahil).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { execSync } from "node:child_process";

const run = (cmd) => {
  console.log(`\n› ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

if (!existsSync(".env")) {
  let env = readFileSync(".env.example", "utf8");
  env = env.replace(/AUTH_SECRET=""/, `AUTH_SECRET="${randomBytes(32).toString("base64")}"`);
  writeFileSync(".env", env, "utf8");
  console.log("✓ .env dosyası .env.example üzerinden oluşturuldu (AUTH_SECRET üretildi).");
} else {
  const env = readFileSync(".env", "utf8");
  if (/AUTH_SECRET=""/.test(env)) {
    writeFileSync(".env", env.replace(/AUTH_SECRET=""/, `AUTH_SECRET="${randomBytes(32).toString("base64")}"`), "utf8");
    console.log("✓ Boş AUTH_SECRET dolduruldu.");
  }
}

run("npx prisma generate");
// Yıkıcı olmayan şema senkronizasyonu; seed script'i demo verilerini kendisi temizleyip yeniden yükler.
run("npx prisma db push --skip-generate");
run("npx tsx prisma/seed/index.ts");

console.log("\n✓ Kurulum tamamlandı. Başlatmak için: npm run dev\n");
