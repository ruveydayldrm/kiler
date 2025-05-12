import { RecipeCardSkeleton } from "@/components/recipes/recipe-card";
import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="container-page py-8 lg:py-12" aria-busy="true" aria-label="Yükleniyor">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="mb-8 h-12 w-80 max-w-full" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <RecipeCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
