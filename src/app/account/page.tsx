import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CheckCheck, Heart, MessageCircle, Refrigerator, ShoppingBasket } from "lucide-react";
import { ProfileForm } from "@/components/account/account-forms";
import { Card } from "@/components/ui/misc";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Profilim", robots: { index: false } };

export default async function AccountPage() {
  const user = await requireUser();
  const [favorites, cooked, reviews, pantry, plans, listItems, full] = await Promise.all([
    db.favorite.count({ where: { userId: user.id } }),
    db.cookedLog.count({ where: { userId: user.id } }),
    db.review.count({ where: { userId: user.id } }),
    db.pantryItem.count({ where: { userId: user.id } }),
    db.mealPlan.count({ where: { userId: user.id } }),
    db.shoppingListItem.count({ where: { checked: false, list: { userId: user.id, isActive: true } } }),
    db.user.findUnique({ where: { id: user.id }, select: { createdAt: true } }),
  ]);
  const stats = [
    { label: "Favori", value: favorites, href: "/account/favorites", icon: Heart },
    { label: "Yaptığım", value: cooked, href: "/account/cooked", icon: CheckCheck },
    { label: "Dolaptaki malzeme", value: pantry, href: "/account/pantry", icon: Refrigerator },
    { label: "Yemek planı", value: plans, href: "/account/plans", icon: CalendarDays },
    { label: "Listedeki ürün", value: listItems, href: "/shopping-list", icon: ShoppingBasket },
    { label: "Yorum", value: reviews, href: "/account/reviews", icon: MessageCircle },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, href, icon: Icon }) => (
          <Link key={label} href={href} className="rounded-[var(--radius-card)] border border-line/70 bg-paper p-4 transition hover:shadow-soft">
            <Icon className="size-5 text-olive" />
            <p className="mt-2 font-serif text-3xl font-semibold">{value}</p>
            <p className="text-sm text-muted">{label}</p>
          </Link>
        ))}
      </div>
      <Card className="p-5">
        <h2 className="mb-4 text-xl font-semibold">Profil bilgileri</h2>
        <ProfileForm name={user.name ?? ""} email={user.email} />
        {full && <p className="mt-4 text-xs text-muted">Üyelik tarihi: {formatDate(full.createdAt)}</p>}
      </Card>
    </div>
  );
}
