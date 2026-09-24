import AuthForm from "@/app/auth-form";
import { Suspense } from "react";

export default function RegisterPage() {
  return <Suspense fallback={null}><AuthForm mode="register" /></Suspense>;
}
