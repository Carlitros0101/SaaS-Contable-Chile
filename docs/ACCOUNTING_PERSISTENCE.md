# Persistencia del plan de cuentas y libro diario

## Disponible en esta versión

- Cada empresa tiene su propio plan de cuentas, aislado por `companyId`.
- El plan de inicio estándar es una plantilla referencial editable mediante altas y activación/desactivación; no representa un catálogo oficial ni sustituye la evaluación de la entidad.
- Las cuentas guardan código, nombre, clasificación, naturaleza y cuenta agrupadora. La naturaleza se selecciona de forma explícita para admitir, por ejemplo, cuentas correctoras.
- Las cuentas agrupadoras no se ofrecen para registrar movimientos mientras tengan cuentas hijas. Las cuentas desactivadas se excluyen de nuevos asientos y se mantienen en el historial.
- Un usuario con membresía activa `ADMIN`, `ACCOUNTANT` u `OPERATOR` puede guardar un borrador de asiento. La administración del plan corresponde a `ADMIN` o `ACCOUNTANT`.
- El servidor exige al menos dos líneas, una sola columna positiva por línea, cuentas de detalle activas de esa empresa, fecha dentro de un período abierto y sumas de Debe y Haber exactamente iguales.
- Los importes se convierten a unidades decimales enteras en el dominio y se almacenan como `Decimal(19,4)`; la validación no usa aritmética binaria de punto flotante.
- Las altas de cuentas, cambios de estado e incorporación de borradores generan eventos en la bitácora.

## Límites explícitos

Esta entrega guarda borradores. No asigna folio contable, no permite contabilizar, aprobar, modificar o eliminar asientos, no genera mayor ni balance, y no reemplaza validaciones tributarias. Esos controles deben definirse antes de habilitar la contabilización definitiva.

## Acceso

Las rutas verifican en servidor la membresía activa; cada consulta y escritura incluye el `companyId` autorizado. Las acciones no confían en identificadores de cuenta, período o usuario enviados por el navegador: vuelven a resolverlos en la base y comprueban empresa, estado y período.
