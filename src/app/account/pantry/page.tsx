import type { Metadata } from "next";
import { PantryEditor } from "@/components/account/pantry-editor";

export const metadata: Metadata = { title: "Dolabım", robots: { index: false } };

export default function AccountPantryPage() {
  return <PantryEditor />;
}
