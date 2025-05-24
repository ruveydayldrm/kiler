import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Yükleniyor">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}
