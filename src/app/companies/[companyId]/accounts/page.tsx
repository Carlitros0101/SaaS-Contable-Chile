import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { AccountForm, AccountStatusButton, StarterChartButton } from "../workspace-forms";
import styles from "../workspace.module.css";

const typeLabels = { ASSET: "Activo", LIABILITY: "Pasivo", EQUITY: "Patrimonio", REVENUE: "Ingreso", EXPENSE: "Gasto / costo" };

export default async function AccountsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const session = await requireCurrentSession();
  const { companyId } = await params;
  const membership = await prisma.companyMembership.findFirst({
    where: { companyId, userId: session.user.id, isActive: true, company: { isActive: true } },
    include: { company: true },
  });
  if (!membership) notFound();

  const canEdit = membership.role === "ADMIN" || membership.role === "ACCOUNTANT";
  const accounts = await prisma.account.findMany({
    where: { companyId },
    include: { parent: { select: { code: true, name: true } }, _count: { select: { children: true, journalLines: true } } },
    orderBy: { code: "asc" },
  });
  const activeAccounts = accounts.filter((account) => account.isActive);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>{membership.company.rut} · {membership.company.legalName}</p><h1>Plan de cuentas</h1>
          <p className={styles.subtitle}>Estructura por empresa. Las cuentas utilizadas se desactivan; no se eliminan.</p></div>
        <Link className={styles.backLink} href={`/companies/${companyId}`}>Volver al espacio contable</Link>
      </header>
      <section className={styles.notice}>
        <div><strong>{accounts.length} cuentas registradas</strong><p>La plantilla inicial es referencial, editable y debe adaptarse a la operación y criterios contables de la empresa.</p></div>
        <span>{activeAccounts.length} activas</span>
      </section>
      {accounts.length === 0 && membership.company.planTemplate === "STANDARD" && canEdit && (
        <section className={`panel ${styles.panel}`}><h2>Comienza desde una estructura base</h2>
          <p>Incluye cuentas comunes de activos, pasivos, patrimonio, ingresos, costos y gastos. No es un plan oficial ni reemplaza la revisión profesional.</p>
          <StarterChartButton companyId={companyId} /></section>
      )}
      <section className={styles.grid}>
        {canEdit && <section className={`panel ${styles.panel}`}><h2>Agregar cuenta</h2><AccountForm companyId={companyId} accounts={accounts.filter((account) => account.isActive).map(({ id, code, name, type }) => ({ id, code, name, type }))} /></section>}
        <section className={`panel ${styles.panel}`}>
          <div className={styles.sectionHeading}><div><h2>Cuentas de la empresa</h2><p>Los grupos no se pueden seleccionar en asientos mientras tengan cuentas hijas.</p></div></div>
          {accounts.length === 0 ? <p className={styles.empty}>Aún no hay cuentas registradas.</p> : (
            <div className={styles.tableWrap}><table className={styles.table}>
              <thead><tr><th>Código</th><th>Nombre</th><th>Clasificación</th><th>Naturaleza</th><th>Estado</th></tr></thead>
              <tbody>{accounts.map((account) => <tr key={account.id}>
                <td>{account.code}</td><td>{account.parent ? <span className={styles.indent}>↳ </span> : null}{account.name}{account._count.children > 0 && <small className={styles.badge}>Grupo</small>}</td>
                <td>{typeLabels[account.type]}</td><td>{account.nature === "DEBIT" ? "Deudora" : "Acreedora"}</td>
                <td><span>{!account.isActive ? "Inactiva" : account._count.children > 0 ? "Activa · agrupadora" : "Activa · detalle"}</span>
                  {canEdit && <AccountStatusButton companyId={companyId} accountId={account.id} isActive={account.isActive} />}</td>
              </tr>)}</tbody>
            </table></div>
          )}
        </section>
      </section>
    </main>
  );
}
