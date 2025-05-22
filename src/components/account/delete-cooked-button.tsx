"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-storage";

export function DeleteCookedButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        try {
          await api(`/api/cooked?id=${id}`, { method: "DELETE" });
          toast("Kayıt silindi");
          router.refresh();
        } catch (e) {
          toast.error((e as Error).message);
        }
      }}
      className="grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-tomato-50 hover:text-tomato"
      aria-label="Kaydı sil"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
