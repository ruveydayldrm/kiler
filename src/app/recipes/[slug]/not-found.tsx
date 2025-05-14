import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/misc";

export default function RecipeNotFound() {
  return (
    <div className="container-page py-16">
      <EmptyState
        icon={<SearchX />}
        title="Bu tarif tencerede yok"
        description="Aradığın tarif kaldırılmış ya da hiç eklenmemiş olabilir. Arşivimizde benzer bir şey bulalım mı?"
        action={
          <Link href="/recipes" className="inline-flex h-11 items-center rounded-full bg-olive px-5 font-semibold text-paper">
            Tariflere göz at
          </Link>
        }
      />
    </div>
  );
}
