"use client";

import * as React from "react";
import * as RD from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = RD.Root;
export const DialogTrigger = RD.Trigger;
export const DialogClose = RD.Close;

const overlay = "fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px]";

/** Ortalanmış diyalog (masaüstü) — mobilde alttan açılan panel gibi davranır. */
export function DialogContent({
  title,
  description,
  className,
  children,
  hideTitle,
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
  hideTitle?: boolean;
}) {
  return (
    <RD.Portal>
      <RD.Overlay className={overlay} />
      <RD.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-paper p-5 shadow-lift focus:outline-none sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[min(560px,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:p-7",
          className,
        )}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line sm:hidden" aria-hidden />
        <div className={cn("mb-4 pr-10", hideTitle && "sr-only")}>
          <RD.Title className="font-serif text-xl font-semibold">{title}</RD.Title>
          {description ? <RD.Description className="mt-1 text-sm text-muted">{description}</RD.Description> : <RD.Description className="sr-only">{title}</RD.Description>}
        </div>
        {children}
        <RD.Close className="absolute top-4 right-4 grid size-10 place-items-center rounded-full text-muted transition hover:bg-cream-200 hover:text-ink" aria-label="Kapat">
          <X className="size-5" />
        </RD.Close>
      </RD.Content>
    </RD.Portal>
  );
}

/** Yandan (masaüstü) / alttan (mobil) açılan panel — filtreler, menüler için. */
export function SheetContent({
  title,
  side = "right",
  className,
  children,
}: {
  title: string;
  side?: "right" | "left" | "bottom";
  className?: string;
  children: React.ReactNode;
}) {
  const position = {
    right: "inset-y-0 right-0 h-dvh w-[min(420px,92vw)] rounded-l-3xl",
    left: "inset-y-0 left-0 h-dvh w-[min(360px,88vw)] rounded-r-3xl",
    bottom: "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl",
  }[side];
  return (
    <RD.Portal>
      <RD.Overlay className={overlay} />
      <RD.Content className={cn("fixed z-50 flex flex-col bg-paper shadow-lift focus:outline-none", position, className)}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <RD.Title className="font-serif text-lg font-semibold">{title}</RD.Title>
          <RD.Description className="sr-only">{title}</RD.Description>
          <RD.Close className="grid size-10 place-items-center rounded-full text-muted transition hover:bg-cream-200 hover:text-ink" aria-label="Kapat">
            <X className="size-5" />
          </RD.Close>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </RD.Content>
    </RD.Portal>
  );
}
