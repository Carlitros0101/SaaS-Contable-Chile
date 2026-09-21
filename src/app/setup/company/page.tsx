"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatRut, isValidRut, normalizeRut } from "@/domain/chile/rut";
import styles from "./company-setup.module.css";

type CompanyDraft = {
  rut: string;
  legalName: string;
  tradeName: string;
  fiscalYear: string;
  planTemplate: "standard" | "custom";
  taxRegime: string;
  economicActivity: string;
};

const initialDraft: CompanyDraft = {
  rut: "",
  legalName: "",
  tradeName: "",
  fiscalYear: String(new Date().getFullYear()),
  planTemplate: "standard",
  taxRegime: "",
  economicActivity: "",
};

const stepNames = ["Empresa", "Contabilidad", "Tributación"];

export default function CompanySetupPage() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CompanyDraft>(initialDraft);
  const [reviewReady, setReviewReady] = useState(false);

  const rutValid = useMemo(() => isValidRut(draft.rut), [draft.rut]);
  const fiscalYear = Number(draft.fiscalYear);
  const fiscalYearValid = Number.isInteger(fiscalYear) && fiscalYear >= 2000 && fiscalYear <= 2100;

  const canContinue =
    step === 0
      ? rutValid && draft.legalName.trim().length >= 2
      : step === 1
        ? fiscalYearValid
        : true;

  function update<K extends keyof CompanyDraft>(field: K, value: CompanyDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setReviewReady(false);
  }

  function handleRutChange(value: string) {
    const normalized = normalizeRut(value).slice(0, 9);
    update("rut", normalized.length >= 2 ? formatRut(normalized) : normalized);
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Configuración inicial</p>
          <h1>Crear empresa</h1>
          <p className={styles.subtitle}>
            Este flujo prepara la configuración. La persistencia en PostgreSQL se habilitará
            junto con autenticación y contexto multiempresa.
          </p>
        </div>
        <Link className={styles.backLink} href="/">Volver al resumen</Link>
      </header>

      <section className={styles.stepper} aria-label="Progreso de configuración">
        {stepNames.map((name, index) => (
          <button
            className={index === step ? styles.activeStep : styles.step}
            disabled={index > step}
            key={name}
            onClick={() => {
              if (index <= step) {
                setStep(index);
                setReviewReady(false);
              }
            }}
            type="button"
          >
            <span>{index + 1}</span>
            {name}
          </button>
        ))}
      </section>

      <section className={styles.card}>
        {step === 0 && (
          <>
            <div className={styles.sectionTitle}>
              <p className={styles.eyebrow}>Paso 1 de 3</p>
              <h2>Identificación de la empresa</h2>
            </div>

            <div className={styles.formGrid}>
              <label>
                RUT
                <input
                  aria-invalid={draft.rut.length > 0 && !rutValid}
                  onChange={(event) => handleRutChange(event.target.value)}
                  placeholder="76.123.456-0"
                  value={draft.rut}
                />
                {draft.rut.length > 0 && (
                  <small className={rutValid ? styles.valid : styles.invalid}>
                    {rutValid ? "Formato y dígito verificador válidos." : "Revisa el RUT ingresado."}
                  </small>
                )}
              </label>

              <label>
                Razón social
                <input
                  onChange={(event) => update("legalName", event.target.value)}
                  placeholder="Empresa SpA"
                  value={draft.legalName}
                />
              </label>

              <label className={styles.full}>
                Nombre de fantasía
                <input
                  onChange={(event) => update("tradeName", event.target.value)}
                  placeholder="Opcional"
                  value={draft.tradeName}
                />
              </label>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className={styles.sectionTitle}>
              <p className={styles.eyebrow}>Paso 2 de 3</p>
              <h2>Configuración contable</h2>
            </div>

            <div className={styles.formGrid}>
              <label>
                Ejercicio inicial
                <input
                  inputMode="numeric"
                  onChange={(event) => update("fiscalYear", event.target.value)}
                  value={draft.fiscalYear}
                />
                {!fiscalYearValid && <small className={styles.invalid}>Ingresa un año válido.</small>}
              </label>

              <label>
                Moneda base
                <input disabled value="CLP — Peso chileno" />
              </label>

              <fieldset className={styles.full}>
                <legend>Plan de cuentas</legend>
                <label className={styles.choice}>
                  <input
                    checked={draft.planTemplate === "standard"}
                    name="planTemplate"
                    onChange={() => update("planTemplate", "standard")}
                    type="radio"
                  />
                  <span>
                    <strong>Estándar</strong>
                    <small>Partir desde una estructura base y personalizarla después.</small>
                  </span>
                </label>
                <label className={styles.choice}>
                  <input
                    checked={draft.planTemplate === "custom"}
                    name="planTemplate"
                    onChange={() => update("planTemplate", "custom")}
                    type="radio"
                  />
                  <span>
                    <strong>Personalizado</strong>
                    <small>Preparar una carga o construcción propia del plan de cuentas.</small>
                  </span>
                </label>
              </fieldset>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className={styles.sectionTitle}>
              <p className={styles.eyebrow}>Paso 3 de 3</p>
              <h2>Datos tributarios</h2>
              <p>
                En esta etapa no se infiere el régimen tributario. La empresa debe configurarlo
                con información validada.
              </p>
            </div>

            <div className={styles.formGrid}>
              <label>
                Régimen tributario
                <input
                  onChange={(event) => update("taxRegime", event.target.value)}
                  placeholder="Por definir / ingresar"
                  value={draft.taxRegime}
                />
              </label>
              <label>
                Actividad económica principal
                <input
                  onChange={(event) => update("economicActivity", event.target.value)}
                  placeholder="Descripción o código"
                  value={draft.economicActivity}
                />
              </label>
            </div>

            {reviewReady && (
              <div className={styles.review}>
                <strong>Configuración preparada para revisión</strong>
                <dl>
                  <div><dt>Empresa</dt><dd>{draft.legalName}</dd></div>
                  <div><dt>RUT</dt><dd>{draft.rut}</dd></div>
                  <div><dt>Ejercicio</dt><dd>{draft.fiscalYear}</dd></div>
                  <div><dt>Plan de cuentas</dt><dd>{draft.planTemplate === "standard" ? "Estándar" : "Personalizado"}</dd></div>
                  <div><dt>Régimen</dt><dd>{draft.taxRegime || "Pendiente"}</dd></div>
                </dl>
              </div>
            )}
          </>
        )}

        <footer className={styles.actions}>
          <button
            className={styles.secondary}
            disabled={step === 0}
            onClick={() => {
              setStep((current) => Math.max(0, current - 1));
              setReviewReady(false);
            }}
            type="button"
          >
            Anterior
          </button>

          {step < 2 ? (
            <button
              className={styles.primary}
              disabled={!canContinue}
              onClick={() => setStep((current) => Math.min(2, current + 1))}
              type="button"
            >
              Continuar
            </button>
          ) : (
            <button className={styles.primary} onClick={() => setReviewReady(true)} type="button">
              Revisar configuración
            </button>
          )}
        </footer>
      </section>
    </main>
  );
}
