# SaaS Contable Chile

SaaS contable y financiero orientado inicialmente a microempresas y Pymes chilenas.

## Estado

Proyecto en fase **foundation v0.3**.

Incluye registro e inicio de sesión con verificación de correo, sesiones persistidas y alta transaccional de empresas. Cada empresa puede mantener su propio plan de cuentas y guardar asientos balanceados como borradores.

El plan base incluido es referencial y no normativo. Los borradores todavía no reciben numeración ni se contabilizan en el mayor.

## Principios

- Motor contable real de doble partida.
- Interfaz simple para usuarios no contables.
- Arquitectura multiempresa, multiusuario y multiejercicio.
- Trazabilidad completa de operaciones sensibles.
- Chile-first.
- IA como apoyo y clasificación, no como sustituto del control contable.

## Stack inicial

- Node.js 24 LTS
- npm 11
- Next.js 16
- React 19
- TypeScript
- PostgreSQL
- Prisma ORM 7
- Better Auth para identidad y sesiones
- Netlify como objetivo inicial de despliegue

## Desarrollo local

1. Instalar Node.js 24 LTS. El repositorio incluye `.nvmrc`.
2. Verificar el toolchain:

```bash
node --version
npm --version
```

3. Copiar `.env.example` a `.env`.
4. Configurar `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` y las variables SMTP indicadas en `.env.example`. Genera el secreto con `openssl rand -base64 32`.
5. Instalar dependencias:

```bash
npm install
```

6. Crear o actualizar la base local:

```bash
npm run db:migrate:deploy
```

En una base vacía, la migración inicial crea el esquema contable, los datos de autenticación y las tablas de seguridad.
Para crear una migración después de modificar el esquema, usa `npm run db:migrate:dev -- --name nombre_del_cambio`.

7. Validar:

```bash
npm run lint
npm run typecheck
npm test
npm run db:validate
npm run build
```

8. Ejecutar:

```bash
npm run dev
```

En producción configura estas variables en Netlify: `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD` y `EMAIL_FROM`. Aplica migraciones con `npm run db:migrate:deploy` desde un entorno controlado antes de desplegar una versión que las requiera.

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [Alcance funcional](docs/PRODUCT_SCOPE.md)
- [Plan de cuentas y asientos](docs/ACCOUNTING_PERSISTENCE.md)
