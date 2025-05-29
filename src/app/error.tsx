"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="container-page py-16">
      <EmptyState
        icon={<TriangleAlert />}
        title="Tencere taştı!"
        description="Beklenmedik bir hata oluştu. Tekrar denemek çoğu zaman işe yarar."
        action={<Button onClick={reset}>Tekrar dene</Button>}
      />
      {error.digest && <p className="mt-3 text-center text-xs text-muted">Hata kodu: {error.digest}</p>}
    </div>
  );
}
