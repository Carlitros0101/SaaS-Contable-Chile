"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="logoutButton"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        await authClient.signOut();
        router.replace("/login");
        router.refresh();
      })}
      type="button"
    >
      {isPending ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}
