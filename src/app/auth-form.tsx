"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import styles from "./auth.module.css";

type AuthMode = "login" | "register" | "forgot" | "reset";

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const token = searchParams.get("token");

  const titles: Record<AuthMode, string> = {
    login: "Inicia sesión",
    register: "Crea tu cuenta",
    forgot: "Recupera tu acceso",
    reset: "Define una nueva contraseña",
  };

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    startTransition(async () => {
      if (mode === "login") {
        const result = await authClient.signIn.email({ email, password, callbackURL: "/" });
        if (result.error) {
          setError(result.error.code === "EMAIL_NOT_VERIFIED"
            ? "Verifica tu correo antes de iniciar sesión."
            : "No pudimos iniciar sesión con esos datos.");
          return;
        }
        router.replace("/");
        router.refresh();
        return;
      }

      if (mode === "register") {
        const result = await authClient.signUp.email({
          name: name.trim(),
          email: email.trim(),
          password,
          callbackURL: "/",
        });
        if (result.error) {
          setError(result.error.message ?? "No pudimos iniciar el registro.");
          return;
        }
        setMessage("Si la dirección puede registrarse, enviaremos un enlace para verificar el correo.");
        return;
      }

      if (mode === "forgot") {
        const result = await authClient.requestPasswordReset({
          email: email.trim(),
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (result.error) {
          setError("No pudimos procesar la solicitud. Revisa el correo e intenta nuevamente.");
          return;
        }
        setMessage("Si existe una cuenta para ese correo, enviaremos instrucciones para restablecer la contraseña.");
        return;
      }

      if (!token) {
        setError("El enlace de recuperación no es válido o ya venció.");
        return;
      }

      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) {
        setError("El enlace de recuperación no es válido o ya venció.");
        return;
      }
      setMessage("Contraseña actualizada. Ya puedes iniciar sesión.");
      router.replace("/login");
    });
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Link href="/" className={styles.brand}>SaaS Contable Chile</Link>
        <p className={styles.eyebrow}>Acceso seguro</p>
        <h1>{titles[mode]}</h1>

        <form className={styles.form} onSubmit={submit}>
          {mode === "register" && (
            <label>
              Nombre
              <input autoComplete="name" maxLength={120} onChange={(event) => setName(event.target.value)} required value={name} />
            </label>
          )}

          {mode !== "reset" && (
            <label>
              Correo electrónico
              <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
            </label>
          )}

          {(mode === "login" || mode === "register" || mode === "reset") && (
            <label>
              {mode === "reset" ? "Nueva contraseña" : "Contraseña"}
              <input
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={mode === "login" ? undefined : 12}
                maxLength={128}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
              {mode !== "login" && <small>Usa al menos 12 caracteres.</small>}
            </label>
          )}

          {message && <p className={styles.success} role="status">{message}</p>}
          {error && <p className={styles.error} role="alert">{error}</p>}

          <button disabled={isPending} type="submit">
            {isPending ? "Procesando…" : mode === "login" ? "Iniciar sesión" : mode === "register" ? "Crear cuenta" : mode === "forgot" ? "Enviar instrucciones" : "Guardar contraseña"}
          </button>
        </form>

        <nav className={styles.links} aria-label="Opciones de acceso">
          {mode === "login" && <><Link href="/register">Crear cuenta</Link><Link href="/forgot-password">Olvidé mi contraseña</Link></>}
          {mode === "register" && <Link href="/login">Ya tengo una cuenta</Link>}
          {(mode === "forgot" || mode === "reset") && <Link href="/login">Volver a iniciar sesión</Link>}
        </nav>
      </section>
    </main>
  );
}
