"use client";

import { Toaster } from "sonner";
import { UserProvider, type ClientUser } from "./user-provider";
import { PantryProvider } from "./pantry-provider";
import { ShoppingProvider } from "./shopping-provider";
import { FavoritesProvider } from "./favorites-provider";
import { TimerProvider } from "./timer-provider";
import { AssistantProvider } from "./assistant-provider";

export function AppProviders({ user, favoriteIds, children }: { user: ClientUser | null; favoriteIds: string[]; children: React.ReactNode }) {
  return (
    <UserProvider initialUser={user}>
      <PantryProvider>
        <ShoppingProvider>
          <FavoritesProvider initialIds={favoriteIds}>
            <TimerProvider>
              <AssistantProvider>{children}</AssistantProvider>
            </TimerProvider>
          </FavoritesProvider>
        </ShoppingProvider>
      </PantryProvider>
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{ classNames: { toast: "!rounded-2xl !font-sans !text-[15px]", actionButton: "!bg-olive !text-paper !rounded-full" } }}
      />
    </UserProvider>
  );
}
