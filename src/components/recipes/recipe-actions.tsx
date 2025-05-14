"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, CheckCheck, Heart, Printer, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AddToPlanDialog } from "@/components/planner/add-to-plan-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { useFavorites } from "@/components/providers/favorites-provider";
import { useAssistant } from "@/components/providers/assistant-provider";
import { useUser } from "@/components/providers/user-provider";
import { api } from "@/lib/client-storage";
import { cn } from "@/lib/utils";

const actionBtn = "inline-flex h-11 items-center gap-2 rounded-full border border-line bg-paper px-4 text-sm font-semibold text-ink-soft transition hover:border-olive/50 hover:text-olive [&_svg]:size-[18px]";

export function RecipeActions({ recipe, householdSize }: { recipe: { id: string; title: string; slug: string }; householdSize: number }) {
  const fav = useFavorites();
  const user = useUser();
  const router = useRouter();
  const [planOpen, setPlanOpen] = useState(false);
  const [cookedOpen, setCookedOpen] = useState(false);
  const active = fav.isFavorite(recipe.id);

  const share = async () => {
    const url = window.location.href;
    const data = { title: `${recipe.title} Tarifi | Kiler`, text: `${recipe.title} tarifine bak!`, url };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Bağlantı kopyalandı.");
      }
    } catch {
      /* kullanıcı iptal etti */
    }
  };

  return (
    <div className="no-print flex flex-wrap gap-2">
      <button onClick={() => fav.toggle(recipe.id, recipe.title)} className={cn(actionBtn, active && "border-tomato/40 bg-tomato-50 text-tomato-600")} aria-pressed={active}>
        <Heart className={cn(active && "fill-tomato text-tomato")} /> {active ? "Favorilerde" : "Favorilere ekle"}
      </button>
      <button onClick={() => setPlanOpen(true)} className={actionBtn}>
        <CalendarPlus /> Plana ekle
      </button>
      <button onClick={() => (user ? setCookedOpen(true) : router.push(`/login?callbackUrl=/recipes/${recipe.slug}`))} className={actionBtn}>
        <CheckCheck /> Yaptım
      </button>
      <button onClick={share} className={actionBtn} aria-label="Paylaş">
        <Share2 /> <span className="hidden sm:inline">Paylaş</span>
      </button>
      <button onClick={() => window.print()} className={actionBtn} aria-label="Yazdır">
        <Printer /> <span className="hidden sm:inline">Yazdır</span>
      </button>
      <AddToPlanDialog recipe={recipe} open={planOpen} onOpenChange={setPlanOpen} defaultServings={householdSize} />
      <CookedDialog recipe={recipe} open={cookedOpen} onOpenChange={setCookedOpen} />
    </div>
  );
}

function CookedDialog({ recipe, open, onOpenChange }: { recipe: { id: string; title: string }; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [note, setNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    setError(undefined);
    try {
      await api("/api/cooked", { method: "POST", json: { recipeId: recipe.id, note: note || undefined, photoUrl } });
      toast.success("Afiyet olsun! “Yaptıklarım”a eklendi. 👩‍🍳");
      onOpenChange(false);
      setNote("");
      setPhotoUrl("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Bu tarifi yaptım 🎉" description="Notların sonraki seferde işine yarar; öneriler de buna göre kişiselleşir.">
        <div className="space-y-4">
          <Field label="Not (isteğe bağlı)" htmlFor="cooked-note">
            <Textarea id="cooked-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Ör. Biraz daha pul biber ekledim, çok iyi oldu." />
          </Field>
          <Field label="Fotoğraf bağlantısı (isteğe bağlı)" htmlFor="cooked-photo" error={error}>
            <Input id="cooked-photo" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…" inputMode="url" />
          </Field>
          <Button className="w-full" size="lg" onClick={save} loading={saving}>
            Kaydet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Tarif sayfasında: görüntülenme kaydı + AI asistanına tarif bağlamı + yüzen "Bu tarife sor" butonu */
export function RecipeAssistantBridge({ recipe }: { recipe: { id: string; title: string } }) {
  const { setRecipe, ask, open } = useAssistant();
  useEffect(() => {
    setRecipe(recipe);
    void fetch(`/api/recipes/${recipe.id}/view`, { method: "POST" }).catch(() => {});
    // Sayfa değişince ChatWidget bağlamı temizler
  }, [recipe.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (open) return null;
  return (
    <button
      onClick={() => ask()}
      className="no-print fixed right-4 bottom-[9.5rem] z-40 inline-flex h-12 items-center gap-2 rounded-full bg-saffron px-4 text-sm font-semibold text-ink shadow-lift transition hover:bg-saffron/90 lg:right-6 lg:bottom-24"
    >
      <Sparkles className="size-4" /> Bu tarife sor
    </button>
  );
}
