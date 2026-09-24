import Link from "next/link";
import { notFound } from "next/navigation";
import LogoutButton from "@/app/logout-button";
import { requireCurrentSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export default async function CompanyWorkspace({ params }: { params: Promise<{ companyId: string }> }) {
  const session = await requireCurrentSession();
  const { companyId } = await params;
  const membership = await prisma.companyMembership.findFirst({
    where: { companyId, userId: session.user.id, isActive: true, company: { isActive: true } },
    include: {
      company: {
        include: {
          _count: { select: { accounts: true, journalEntries: true } },
          fiscalYears: { where: { status: "OPEN" }, orderBy: { year: "desc" } },
        },
      },
    },
  });
  if (!membership) notFound();

  const { company, role } = membership;
  return (
    <main className="shell">
      <aside className="sidebar">
        <div><span className="eyebrow">Espacio contable</span><h1>SaaS Contable</h1></div>
        <nav aria-label="Navegación de empresa">
          <Link href="/">Mis empresas</Link>
          <Link className="active" href={`/companies/${company.id}`}>Resumen</Link>
          <Link href={`/companies/${company.id}/accounts`}>Plan de cuentas</Link>
          <Link href={`/companies/${company.id}/journals`}>Libro diario</Link>
        </nav>
        <p className="sidebarNote">{role === "ADMIN" ? "Administradora" : role === "ACCOUNTANT" ? "Contabilidad" : role}</p>
      </aside>
      <section className="content">
        <header className="topbar">
          <div><p className="eyebrow">{company.rut} · {company.baseCurrency}</p><h2>{company.legalName}</h2></div>
          <div className="topbarActions"><Link className="primaryAction" href="/">Mis empresas</Link><LogoutButton /></div>
        </header>
        <section className="notice">
          <div><strong>Contabilidad de {company.legalName}</strong><p>Los datos de este espacio solo se consultan con membresía activa.</p></div>
          <span>{role}</span>
        </section>
        <section className="accountingCards" aria-label="Módulos contables">
          <Link className="panel accountingCard" href={`/companies/${company.id}/accounts`}>
            <span className="eyebrow">Configuración</span><strong>Plan de cuentas</strong>
            <span>{company._count.accounts} cuentas · estructura editable</span>
          </Link>
          <Link className="panel accountingCard" href={`/companies/${company.id}/journals`}>
            <span className="eyebrow">Contabilidad</span><strong>Libro diario</strong>
            <span>{company._count.journalEntries} asientos guardados</span>
          </Link>
          <article className="panel accountingCard">
            <span className="eyebrow">Ejercicio abierto</span>
            <strong>{company.fiscalYears[0]?.year ?? "Sin ejercicio abierto"}</strong>
            <span>Los borradores requieren fecha dentro de un período abierto.</span>
          </article>
        </section>
      </section>
    </main>
  );
}
