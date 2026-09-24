import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { JournalDraftForm } from "../workspace-forms";
import styles from "../workspace.module.css";

export default async function JournalsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const session = await requireCurrentSession();
  const { companyId } = await params;
  const membership = await prisma.companyMembership.findFirst({
    where: { companyId, userId: session.user.id, isActive: true, company: { isActive: true } },
    include: { company: { select: { id: true, rut: true, legalName: true } } },
  });
  if (!membership) notFound();

  const [periods, accounts, entries] = await Promise.all([
    prisma.accountingPeriod.findMany({
      where: { companyId, status: "OPEN", fiscalYear: { status: "OPEN" } },
      include: { fiscalYear: { select: { id: true, year: true } } },
      orderBy: [{ fiscalYear: { year: "desc" } }, { number: "asc" }],
    }),
    prisma.account.findMany({
      where: { companyId, isActive: true, children: { none: {} } },
      select: { id: true, code: true, name: true, type: true },
      orderBy: { code: "asc" },
    }),
    prisma.journalEntry.findMany({
      where: { companyId },
      include: {
        period: { select: { number: true } },
        fiscalYear: { select: { year: true } },
        lines: { include: { account: { select: { code: true, name: true } } }, orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const canCreate = ["ADMIN", "ACCOUNTANT", "OPERATOR"].includes(membership.role);
  const periodOptions = periods.map((period) => ({
    id: period.id,
    fiscalYearId: period.fiscalYearId,
    year: period.fiscalYear.year,
    number: period.number,
    startDate: period.startDate.toISOString().slice(0, 10),
    endDate: period.endDate.toISOString().slice(0, 10),
  }));

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>{membership.company.rut} · {membership.company.legalName}</p><h1>Libro diario</h1>
          <p className={styles.subtitle}>Asientos balanceados guardados como borradores para revisión.</p></div>
        <Link className={styles.backLink} href={`/companies/${companyId}`}>Volver al espacio contable</Link>
      </header>
      <section className={styles.notice}><div><strong>{entries.length} asientos recientes</strong><p>Esta etapa guarda borradores; aún no numera ni contabiliza asientos en el mayor.</p></div><span>Solo empresa autorizada</span></section>
      {canCreate && <section className={`panel ${styles.panel}`}><h2>Nuevo borrador</h2>
        {accounts.length < 2 ? <p className={styles.empty}>Necesitas al menos dos cuentas de detalle activas. <Link href={`/companies/${companyId}/accounts`}>Configurar plan de cuentas</Link></p> : periods.length === 0 ? <p className={styles.empty}>No hay períodos abiertos para registrar. Revisa el ejercicio de la empresa.</p> :
          <JournalDraftForm companyId={companyId} accounts={accounts} periods={periodOptions} />}
      </section>}
      <section className={`panel ${styles.panel}`}>
        <div className={styles.sectionHeading}><div><h2>Asientos guardados</h2><p>Se muestran hasta los últimos 50 borradores y registros.</p></div></div>
        {entries.length === 0 ? <p className={styles.empty}>Todavía no hay asientos guardados.</p> : (
          <div className={styles.tableWrap}><table className={styles.table}>
            <thead><tr><th>Fecha</th><th>Concepto</th><th>Ejercicio / período</th><th>Debe</th><th>Haber</th><th>Estado</th></tr></thead>
            <tbody>{entries.map((entry) => {
              const debit = entry.lines.reduce((sum, line) => sum.plus(line.debit), new Prisma.Decimal(0));
              const credit = entry.lines.reduce((sum, line) => sum.plus(line.credit), new Prisma.Decimal(0));
              return <tr key={entry.id}>
                <td>{entry.entryDate.toLocaleDateString("es-CL", { timeZone: "UTC" })}</td>
                <td><strong>{entry.description}</strong><small className={styles.lineSummary}>{entry.lines.map((line) => `${line.account.code} ${line.account.name}`).join(" · ")}</small></td>
                <td>{entry.fiscalYear.year} / {String(entry.period.number).padStart(2, "0")}</td>
                <td>{debit.toString()}</td><td>{credit.toString()}</td><td><span className={styles.badge}>{entry.status === "DRAFT" ? "Borrador" : entry.status}</span></td>
              </tr>;
            })}</tbody>
          </table></div>
        )}
      </section>
    </main>
  );
}
