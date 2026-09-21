# Arquitectura inicial

## Objetivo

Construir un SaaS contable Chile-first, multiempresa, multiusuario y multiejercicio, con motor contable de doble partida y trazabilidad completa.

## Principios

1. La complejidad contable vive en el motor, no en la interfaz.
2. Ningún asiento contable puede persistirse si débitos y créditos no cuadran.
3. Los registros contables históricos no se eliminan físicamente: se anulan, reversan o desactivan según corresponda.
4. Toda operación sensible debe dejar bitácora.
5. La separación por empresa (tenant) es obligatoria en todas las entidades transaccionales.
6. IA y automatización sugieren; los controles definidos deciden cuándo una acción requiere aprobación humana.

## Stack inicial

- Next.js 16 + React 19 + TypeScript.
- PostgreSQL como base de datos.
- Prisma ORM estable.
- Netlify como objetivo inicial de despliegue web.
- GitHub como repositorio y flujo de revisión.

## Capas

```text
UI / App Router
      |
Casos de uso
      |
Dominio contable
      |
Persistencia PostgreSQL
      |
Auditoría / seguridad / documentos
```

## Dominios V1

- Identidad, empresas y permisos.
- Plan de cuentas.
- Terceros: clientes y proveedores.
- Documentos: compras, ventas y gastos.
- Motor contable y asientos.
- Bancos y conciliación.
- Cuentas por cobrar y pagar.
- IVA / RCV / preparación F29.
- Cierre mensual.
- Reportes contables y financieros.
- Gestión documental y OCR.
- Bitácora de auditoría.

## Fases posteriores

- V2: activos fijos, inventarios, tesorería y dimensiones.
- V3: remuneraciones.
- V4: automatización e IA avanzada.
- V5: integraciones externas, sujetas a demanda y viabilidad.
