const metrics = [
  { label: "Caja y bancos", value: "$0", detail: "Sin movimientos todavía" },
  { label: "Ventas del mes", value: "$0", detail: "0 documentos" },
  { label: "Cuentas por cobrar", value: "$0", detail: "0 vencidas" },
  { label: "IVA estimado", value: "$0", detail: "Pendiente de información" },
];

const pending = [
  "Configurar empresa",
  "Definir plan de cuentas",
  "Crear ejercicio contable",
  "Cargar saldos iniciales",
];

export default function Home() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div>
          <span className="eyebrow">Chile-first</span>
          <h1>SaaS Contable</h1>
        </div>
        <nav aria-label="Navegación principal">
          <a className="active" href="#">Resumen</a>
          <a href="#">Compras y gastos</a>
          <a href="#">Ventas</a>
          <a href="#">Bancos</a>
          <a href="#">Contabilidad</a>
          <a href="#">Impuestos</a>
          <a href="#">Cierre mensual</a>
        </nav>
        <p className="sidebarNote">Foundation v0.1</p>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Empresa de demostración</p>
            <h2>Resumen financiero</h2>
          </div>
          <button type="button">Importar movimientos</button>
        </header>

        <section className="notice">
          <div>
            <strong>Configuración inicial pendiente</strong>
            <p>Completa los datos base antes de comenzar a contabilizar.</p>
          </div>
          <span>0%</span>
        </section>

        <section className="metrics" aria-label="Indicadores principales">
          {metrics.map((metric) => (
            <article className="metric" key={metric.label}>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
              <small>{metric.detail}</small>
            </article>
          ))}
        </section>

        <section className="grid">
          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Puesta en marcha</p>
                <h3>Próximos pasos</h3>
              </div>
              <span>{pending.length} pendientes</span>
            </div>
            <ol className="taskList">
              {pending.map((item, index) => (
                <li key={item}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {item}
                </li>
              ))}
            </ol>
          </article>

          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Control contable</p>
                <h3>Estado del período</h3>
              </div>
              <span className="status">Abierto</span>
            </div>
            <dl className="statusList">
              <div><dt>Documentos pendientes</dt><dd>0</dd></div>
              <div><dt>Conciliaciones pendientes</dt><dd>0</dd></div>
              <div><dt>Observaciones abiertas</dt><dd>0</dd></div>
              <div><dt>Errores bloqueantes</dt><dd>0</dd></div>
            </dl>
          </article>
        </section>
      </section>
    </main>
  );
}
