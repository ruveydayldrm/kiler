"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Rating } from "@/components/ui/misc";
import { useUser } from "@/components/providers/user-provider";
import { api } from "@/lib/client-storage";
import { cn, formatDate, initials } from "@/lib/utils";

export interface ReviewDTO {
  id: string;
  rating: number;
  comment: string;
  photoUrl: string | null;
  createdAt: string;
  userName: string;
}

export function ReviewsSection({ recipeId, slug, reviews, ratingAvg, ratingCount }: { recipeId: string; slug: string; reviews: ReviewDTO[]; ratingAvg: number; ratingCount: number }) {
  const user = useUser();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!rating) errs.rating = "Lütfen bir puan seç.";
    if (comment.trim().length < 5) errs.comment = "Yorum en az 5 karakter olmalı.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await api("/api/reviews", { method: "POST", json: { recipeId, rating, comment, photoUrl } });
      toast.success("Yorumun için teşekkürler!");
      setComment("");
      setPhotoUrl("");
      setRating(0);
      router.refresh();
    } catch (err) {
      setErrors({ _form: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="reviews-title" className="no-print">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 id="reviews-title" className="text-2xl font-semibold">
          Yorumlar ve puanlar
        </h2>
        <Rating value={ratingAvg} count={ratingCount} size="md" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-[var(--radius-card)] border border-line/70 bg-paper p-5">
          {user ? (
            <form onSubmit={submit} noValidate className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-ink-soft">Puanın</p>
                <div className="flex gap-1" role="radiogroup" aria-label="Puan">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={`${n} yıldız`}
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(n)}
                      className="grid size-11 place-items-center rounded-full transition hover:bg-saffron-50"
                    >
                      <Star className={cn("size-7 transition", (hover || rating) >= n ? "fill-saffron text-saffron" : "text-line")} />
                    </button>
                  ))}
                </div>
                {errors.rating && <p className="mt-1 text-sm text-tomato-600">{errors.rating}</p>}
              </div>
              <Field label="Yorumun" htmlFor="review-comment" error={errors.comment}>
                <Textarea id="review-comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} placeholder="Nasıl oldu? Neyi değiştirdin?" aria-invalid={!!errors.comment} />
              </Field>
              <Field label="Fotoğraf bağlantısı (isteğe bağlı)" htmlFor="review-photo" error={errors.photoUrl}>
                <Input id="review-photo" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…" inputMode="url" />
              </Field>
              {errors._form && <p className="text-sm text-tomato-600">{errors._form}</p>}
              <Button type="submit" loading={saving} className="w-full">
                Yorumu gönder
              </Button>
            </form>
          ) : (
            <div className="py-6 text-center">
              <MessageCircle className="mx-auto mb-3 size-8 text-sage" />
              <p className="text-ink-soft">Yorum yapmak ve puan vermek için giriş yap.</p>
              <Link href={`/login?callbackUrl=/recipes/${slug}`} className="mt-4 inline-flex h-11 items-center rounded-full bg-olive px-5 font-semibold text-paper">
                Giriş yap
              </Link>
            </div>
          )}
        </div>

        <ul className="space-y-4">
          {reviews.length === 0 && <li className="rounded-2xl bg-cream-200/70 p-5 text-ink-soft">Henüz yorum yok. İlk yorumu sen yaz!</li>}
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line/60 bg-paper p-4">
              <div className="mb-2 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-sage-100 text-sm font-bold text-olive">{initials(r.userName)}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{r.userName}</p>
                  <p className="text-xs text-muted">{formatDate(r.createdAt)}</p>
                </div>
                <span className="flex" aria-label={`${r.rating} yıldız`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={cn("size-4", i < r.rating ? "fill-saffron text-saffron" : "text-line")} />
                  ))}
                </span>
              </div>
              <p className="text-[15px] leading-relaxed text-ink-soft">{r.comment}</p>
              {r.photoUrl && <img src={r.photoUrl} alt="Kullanıcı fotoğrafı" loading="lazy" className="mt-3 max-h-60 rounded-xl object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
