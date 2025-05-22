import { requireUser } from "@/lib/auth";
import { AccountNav } from "@/components/account/account-nav";
import { initials } from "@/lib/utils";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  // Middleware'e ek olarak sunucu tarafında ikinci kontrol
  const user = await requireUser();
  return (
    <div className="container-page py-8 lg:py-12">
      <div className="mb-8 flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-full bg-olive font-serif text-2xl font-semibold text-paper">{initials(user.name)}</span>
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-tomato uppercase">Hesabım</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Merhaba, {user.name?.split(" ")[0] ?? "şef"}!</h1>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
