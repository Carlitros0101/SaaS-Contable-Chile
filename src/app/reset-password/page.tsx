import AuthForm from "@/app/auth-form";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return <Suspense fallback={null}><AuthForm mode="reset" /></Suspense>;
}
