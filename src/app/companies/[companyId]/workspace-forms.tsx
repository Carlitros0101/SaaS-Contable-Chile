"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createAccount, createJournalDraft, installStarterChart, setAccountActive } from "@/app/actions/accounting";
import type { AccountNatureValue, AccountTypeValue } from "@/domain/accounting/account-input";
import styles from "./workspace.module.css";

type AccountOption = { id: string; code: string; name: string; type: AccountTypeValue };
type PeriodOption = { id: string; fiscalYearId: string; year: number; number: number; startDate: string; endDate: string };

const typeNames: Record<AccountTypeValue, string> = {
  ASSET: "Activo", LIABILITY: "Pasivo", EQUITY: "Patrimonio", REVENUE: "Ingreso", EXPENSE: "Gasto / costo",
};

export function StarterChartButton({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return <div className={styles.actionBlock}>
    <button className={styles.primaryButton} disabled={pending} onClick={() => startTransition(async () => {
      const result = await installStarterChart(companyId);
      setMessage(result.message);
      if (result.ok) router.refresh();
    })} type="button">{pending ? "Cargando…" : "Cargar plantilla referencial"}</button>
    {message && <p aria-live="polite" className={styles.formMessage}>{message}</p>}
  </div>;
}

export function AccountStatusButton({ companyId, accountId, isActive }: { companyId: string; accountId: string; isActive: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  return <span className={styles.statusAction}>
    <button disabled={pending} onClick={() => startTransition(async () => {
      const result = await setAccountActive(companyId, accountId, !isActive);
      setMessage(result.message);
      if (result.ok) router.refresh();
    })} type="button">{pending ? "…" : isActive ? "Desactivar" : "Activar"}</button>
    {message && <small aria-live="polite">{message}</small>}
  </span>;
}

export function AccountForm({ companyId, accounts }: { companyId: string; accounts: AccountOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [type, setType] = useState<AccountTypeValue>("ASSET");
  const [nature, setNature] = useState<AccountNatureValue>("DEBIT");
  const parents = accounts.filter((account) => account.type === type);

  function submit(formData: FormData) {
    setMessage("");
    startTransition(async () => {
      const result = await createAccount(companyId, {
        code: formData.get("code"), name: formData.get("name"), type, nature,
        parentId: formData.get("parentId"),
      });
      setMessage(result.message);
      if (result.ok) {
        (document.getElementById("account-form") as HTMLFormElement | null)?.reset();
        router.refresh();
      }
    });
  }

  return <form action={submit} className={styles.form} id="account-form">
    <label>Código<input autoComplete="off" maxLength={20} name="code" placeholder="1105" required /></label>
    <label>Nombre<input maxLength={120} name="name" placeholder="Cuenta bancaria" required /></label>
    <div className={styles.formRow}>
      <label>Clasificación<select name="type" onChange={(event) => setType(event.target.value as AccountTypeValue)} value={type}>
        {Object.entries(typeNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <label>Naturaleza<select name="nature" onChange={(event) => setNature(event.target.value as AccountNatureValue)} value={nature}>
        <option value="DEBIT">Deudora</option><option value="CREDIT">Acreedora</option>
      </select></label>
    </div>
    <label>Cuenta agrupadora<select name="parentId" defaultValue="">
      <option value="">Sin agrupadora (nivel superior)</option>
      {parents.map((account) => <option key={account.id} value={account.id}>{account.code} · {account.name}</option>)}
    </select></label>
    <button className={styles.primaryButton} disabled={pending} type="submit">{pending ? "Guardando…" : "Agregar cuenta"}</button>
    {message && <p aria-live="polite" className={styles.formMessage}>{message}</p>}
  </form>;
}

export function JournalDraftForm({ companyId, accounts, periods }: { companyId: string; accounts: AccountOption[]; periods: PeriodOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [lines, setLines] = useState([{ accountId: "", debit: "0", credit: "0", description: "" }, { accountId: "", debit: "0", credit: "0", description: "" }]);
  const today = new Date().toISOString().slice(0, 10);
  const initialPeriod = periods.find((period) => period.startDate <= today && period.endDate >= today) ?? periods[0];
  const [periodId, setPeriodId] = useState(initialPeriod?.id ?? "");
  const [entryDate, setEntryDate] = useState(today);
  const selectedPeriod = periods.find((period) => period.id === periodId);

  function updateLine(index: number, field: keyof (typeof lines)[number], value: string) {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, [field]: value } : line));
  }

  function submit(formData: FormData) {
    setMessage("");
    startTransition(async () => {
      const result = await createJournalDraft(companyId, {
        entryDate,
        description: formData.get("description"),
        fiscalYearId: selectedPeriod?.fiscalYearId,
        periodId,
        lines,
      });
      setMessage(result.message);
      if (result.ok) {
        setLines([{ accountId: "", debit: "0", credit: "0", description: "" }, { accountId: "", debit: "0", credit: "0", description: "" }]);
        (document.getElementById("journal-draft-form") as HTMLFormElement | null)?.reset();
        router.refresh();
      }
    });
  }

  return <form action={submit} className={styles.form} id="journal-draft-form">
    <div className={styles.formRow}>
      <label>Período abierto<select onChange={(event) => {
        const next = periods.find((period) => period.id === event.target.value);
        setPeriodId(event.target.value);
        if (next && (entryDate < next.startDate || entryDate > next.endDate)) setEntryDate(next.startDate);
      }} value={periodId}>
        {periods.map((period) => <option key={period.id} value={period.id}>{period.year} · período {String(period.number).padStart(2, "0")}</option>)}
      </select></label>
      <label>Fecha contable<input max={selectedPeriod?.endDate} min={selectedPeriod?.startDate} onChange={(event) => setEntryDate(event.target.value)} type="date" value={entryDate} /></label>
    </div>
    <label>Concepto<input maxLength={240} name="description" placeholder="Descripción del hecho económico" required /></label>
    <div className={styles.linesHeading}><strong>Líneas</strong><button disabled={lines.length >= 50} onClick={() => setLines((current) => [...current, { accountId: "", debit: "0", credit: "0", description: "" }])} type="button">Agregar línea</button></div>
    <div className={styles.journalLines}>
      {lines.map((line, index) => <fieldset className={styles.journalLine} key={index}>
        <legend>Línea {index + 1}</legend>
        <label>Cuenta<select onChange={(event) => updateLine(index, "accountId", event.target.value)} value={line.accountId}>
          <option value="">Seleccionar cuenta</option>
          {accounts.map((account) => <option key={account.id} value={account.id}>{account.code} · {account.name}</option>)}
        </select></label>
        <div className={styles.formRow}>
          <label>Debe<input inputMode="decimal" onChange={(event) => updateLine(index, "debit", event.target.value)} placeholder="0.00" value={line.debit} /></label>
          <label>Haber<input inputMode="decimal" onChange={(event) => updateLine(index, "credit", event.target.value)} placeholder="0.00" value={line.credit} /></label>
        </div>
        <label>Glosa de línea<input maxLength={160} onChange={(event) => updateLine(index, "description", event.target.value)} placeholder="Opcional" value={line.description} /></label>
        {lines.length > 2 && <button className={styles.removeLine} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))} type="button">Quitar línea</button>}
      </fieldset>)}
    </div>
    <p className={styles.helper}>Importes positivos con hasta 4 decimales. Debe y Haber deben cuadrar exactamente.</p>
    <button className={styles.primaryButton} disabled={pending} type="submit">{pending ? "Guardando…" : "Guardar borrador"}</button>
    {message && <p aria-live="polite" className={styles.formMessage}>{message}</p>}
  </form>;
}
