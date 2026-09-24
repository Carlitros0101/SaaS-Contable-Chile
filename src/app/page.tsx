import Link from "next/link";
import { requireCurrentSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import LogoutButton from "./logout-button";

export default async function Home() {
  const session = await requireCurrentSession();
  const memberships = await prisma.companyMembership.findMany({
    where: {
      userId: session.user.id,
      isActive: true,
      company: { isActive: true },
    },
    include: {
      company: {
        include: {
          fiscalYears: { orderBy: { year: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="shell">
      <aside className="sidebar">
        <div>
          <span className="eyebrow">Chile-first</span>
          <h1>SaaS Contable</h1>
        </div>
        <nav aria-label="Navegación principal">
          <a className="active" href="#empresas">Mis empresas</a>
          <span aria-disabled="true">Compras y gastos</span>
          <span aria-disabled="true">Ventas</span>
          <span aria-disabled="true">Bancos</span>
          <span aria-disabled="true">Contabilidad</span>
          <span aria-disabled="true">Impuestos</span>
          <span aria-disabled="true">Cierre mensual</span>
        </nav>
        <p className="sidebarNote">Foundation v0.2</p>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Sesión iniciada como {session.user.email}</p>
            <h2>Mis empresas</h2>
          </div>
          <div className="topbarActions">
            <Link className="primaryAction" href="/setup/company">Crear empresa</Link>
            <LogoutButton />
          </div>
        </header>

        <section className="notice">
          {memberships.length === 0 ? (
            <div>
              <strong>Tu espacio está listo</strong>
              <p>Crea una empresa para iniciar su configuración contable.</p>
            </div>
          ) : (
            <div>
              <strong>{memberships.length === 1 ? "Empresa registrada" : `${memberships.length} empresas registradas`}</strong>
              <p>Solo se muestran empresas asociadas a tu usuario.</p>
            </div>
          )}
          <span>{memberships.length}</span>
        </section>

        <section id="empresas" className="companyList" aria-label="Empresas asociadas a tu cuenta">
          {memberships.length === 0 ? (
            <article className="panel emptyState">
              <h3>Aún no tienes empresas</h3>
              <p>El registro creará la empresa, el ejercicio contable y sus 12 períodos mensuales.</p>
              <Link className="primaryAction" href="/setup/company">Comenzar configuración</Link>
            </article>
          ) : memberships.map(({ company, role }) => (
            <article className="panel companyCard" key={company.id}>
              <div>
                <p className="eyebrow">{role === "ADMIN" ? "Administradora" : "Miembro"}</p>
                <h3>{company.legalName}</h3>
                <p>RUT {company.rut} · Moneda base {company.baseCurrency}</p>
              </div>
              <div className="companyMeta">
                <span>Ejercicio inicial</span>
                <strong>{company.fiscalYears[0]?.year ?? "Sin ejercicio"}</strong>
                <Link className="primaryAction" href={`/companies/${company.id}`}>Abrir contabilidad</Link>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
