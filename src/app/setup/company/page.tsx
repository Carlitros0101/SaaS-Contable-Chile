import { requireCurrentSession } from "@/lib/auth-session";
import CompanySetupForm from "./setup-form";

export default async function CompanySetupPage() {
  await requireCurrentSession();
  return <CompanySetupForm />;
}
