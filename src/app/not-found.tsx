import Link from "next/link";
import { CookingPot } from "lucide-react";
import { EmptyState } from "@/components/ui/misc";

export default function NotFound() {
  return (
    <div className="container-page py-16">
      <EmptyState
        icon={<CookingPot />}
        title="Bu sayfa ocakta unutulmuş olmalı"
        description="Aradığın sayfa bulunamadı. Belki tarifler arasında yeni bir şey keşfedersin?"
        action={
          <>
            <Link href="/" className="inline-flex h-11 items-center rounded-full bg-olive px-5 font-semibold text-paper">
              Ana sayfa
            </Link>
            <Link href="/recipes" className="inline-flex h-11 items-center rounded-full border border-line bg-paper px-5 font-semibold">
              Tarifler
            </Link>
          </>
        }
      />
    </div>
  );
}
