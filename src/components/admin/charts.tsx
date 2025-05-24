"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

// Tek serili grafikler: başlık seriyi adlandırır (legend gerekmez). Değerler metin renginde,
// seri rengi yalnızca işarette. Izgara ve eksenler geri planda.

const INK_MUTED = "#8A8275";
const GRID = "#E8DFD0";
const SERIES = "#3F5B3A";

export function ActiveUsersChart({ week, month }: { week: { label: string; users: number }[]; month: { label: string; users: number }[] }) {
  const [range, setRange] = useState<7 | 30>(30);
  const data = range === 7 ? week : month;
  const total = Math.max(...data.map((d) => d.users), 0);
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-sans text-base font-bold">Günlük aktif kullanıcı</h2>
          <p className="text-xs text-muted">En yoğun gün: {total} kullanıcı</p>
        </div>
        <div className="inline-flex rounded-full bg-cream-200 p-1 text-xs font-semibold" role="group" aria-label="Zaman aralığı">
          {([7, 30] as const).map((r) => (
            <button key={r} onClick={() => setRange(r)} aria-pressed={range === r} className={cn("h-8 rounded-full px-3", range === r ? "bg-paper shadow-soft" : "text-muted")}>
              Son {r} gün
            </button>
          ))}
        </div>
      </div>
      <div className="h-60" role="img" aria-label={`Son ${range} günde günlük aktif kullanıcı sayıları`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="au" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES} stopOpacity={0.22} />
                <stop offset="100%" stopColor={SERIES} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} strokeDasharray="3 4" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: INK_MUTED, fontSize: 11 }} tickLine={false} axisLine={false} interval={range === 7 ? 0 : 4} />
            <YAxis allowDecimals={false} tick={{ fill: INK_MUTED, fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ stroke: INK_MUTED, strokeDasharray: "3 3" }}
              contentStyle={{ borderRadius: 12, border: `1px solid ${GRID}`, fontSize: 13 }}
              formatter={(v: number) => [`${v} kullanıcı`, "Aktif"]}
            />
            <Area type="monotone" dataKey="users" stroke={SERIES} strokeWidth={2} fill="url(#au)" dot={false} activeDot={{ r: 5, stroke: "#FFFDF9", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Yatay çubuk listesi — değer ve etiket her zaman metin olarak görünür (tablo gibi okunur). */
export function BarList({ title, items, unit }: { title: string; items: { label: string; value: number }[]; unit: string }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div>
      <h2 className="mb-4 font-sans text-base font-bold">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted">Henüz veri yok.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((i) => (
            <li key={i.label} className="group" title={`${i.label}: ${i.value} ${unit}`}>
              <div className="mb-1 flex justify-between gap-3 text-sm">
                <span className="truncate text-ink-soft">{i.label}</span>
                <span className="font-semibold tabular-nums">
                  {i.value} <span className="text-xs font-normal text-muted">{unit}</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-cream-200">
                <div className="h-full rounded-r-[4px] rounded-l-full bg-olive transition-all group-hover:bg-olive-600" style={{ width: `${(i.value / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
