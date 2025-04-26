import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "prisma/dev.db*"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Tarif görselleri harici ve hata durumunda tipografik kapağa düşmesi gerekiyor;
      // bu yüzden kontrollü <img> kullanıyoruz.
      "@next/next/no-img-element": "off",
      // Türkçe metinlerde kesme işareti (Kiler'de, AI'ya) çok yaygın; JSX içinde kaçırmak okunabilirliği bozar.
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
];

export default config;
