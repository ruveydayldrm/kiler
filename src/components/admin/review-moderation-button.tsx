"use client";

import { useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setReviewStatusAction } from "@/app/admin/actions";

export function ReviewModerationButton({ id, status }: { id: string; status: "PUBLISHED" | "HIDDEN" }) {
  const [pending, start] = useTransition();
  const hidden = status === "HIDDEN";
  return (
    <Button
      size="sm"
      variant={hidden ? "soft" : "danger"}
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await setReviewStatusAction(id, hidden ? "PUBLISHED" : "HIDDEN");
          if (res.message) toast.success(res.message);
        })
      }
    >
      {hidden ? <Eye /> : <EyeOff />} {hidden ? "Yayınla" : "Gizle"}
    </Button>
  );
}
