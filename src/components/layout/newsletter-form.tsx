"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-storage";
import { cn } from "@/lib/utils";

export function NewsletterForm({ dark }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Geçerli bir e-posta girin");
    setLoading(true);
    try {
      await api("/api/newsletter", { method: "POST", json: { email } });
      setDone(true);
      toast.success("Abone oldun! İlk menü bu pazar e-postanda. 💌");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return <p className={cn("rounded-2xl px-5 py-4 font-medium", dark ? "bg-paper/10 text-paper" : "bg-olive-50 text-olive")}>Teşekkürler! Haftanın menüsü her pazar {email} adresinde. 🌿</p>;
  }

  return (
    <form onSubmit={submit} noValidate className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Mail className={cn("pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2", dark ? "text-paper/60" : "text-muted")} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e-posta adresin"
            aria-label="E-posta adresi"
            aria-invalid={!!error}
            className={cn(
              "h-12 w-full rounded-full pr-4 pl-12 text-[15px] focus:ring-4 focus:outline-none",
              dark ? "border border-paper/20 bg-paper/10 text-paper placeholder:text-paper/50 focus:ring-paper/15" : "border border-line bg-paper focus:border-olive focus:ring-olive/10",
            )}
          />
        </div>
        <Button type="submit" variant="accent" className="h-12" loading={loading}>
          Abone Ol
        </Button>
      </div>
      {error && <p className={cn("mt-2 text-sm font-medium", dark ? "text-saffron" : "text-tomato-600")}>{error}</p>}
    </form>
  );
}
