"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, ExternalLink, Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteRecipeAction, toggleRecipeAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

const btn = "grid size-9 place-items-center rounded-full text-muted transition hover:bg-cream-200 hover:text-ink disabled:opacity-40";

export function RecipeRowActions({ id, slug, title, featured, published }: { id: string; slug: string; title: string; featured: boolean; published: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex justify-end gap-0.5">
      <button disabled={pending} className={cn(btn, featured && "text-saffron")} title={featured ? "Öne çıkanlardan kaldır" : "Öne çıkar"} aria-label="Öne çıkar" onClick={() => start(async () => void (await toggleRecipeAction(id, "featured", !featured)))}>
        <Star className={cn("size-4", featured && "fill-saffron")} />
      </button>
      <button disabled={pending} className={btn} title={published ? "Yayından kaldır" : "Yayınla"} aria-label="Yayın durumu" onClick={() => start(async () => void (await toggleRecipeAction(id, "published", !published)))}>
        {published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </button>
      <Link href={`/admin/recipes/${id}`} className={btn} aria-label="Düzenle" title="Düzenle">
        <Pencil className="size-4" />
      </Link>
      <Link href={`/recipes/${slug}`} target="_blank" className={btn} aria-label="Sitede gör" title="Sitede gör">
        <ExternalLink className="size-4" />
      </Link>
      <button
        disabled={pending}
        className={cn(btn, "hover:bg-tomato-50 hover:text-tomato")}
        aria-label="Sil"
        title="Sil"
        onClick={() => {
          if (!confirm(`"${title}" kalıcı olarak silinsin mi?`)) return;
          start(async () => {
            const res = await deleteRecipeAction(id);
            toast.success(res.message);
          });
        }}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
