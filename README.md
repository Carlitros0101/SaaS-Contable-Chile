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

Requiere Node.js 24 LTS y Docker Desktop (o Docker Engine con Compose). El repositorio incluye `.nvmrc`.

1. Verificar el toolchain:

```bash
node --version
npm --version
```

2. Iniciar PostgreSQL y Mailpit para pruebas locales:

```bash
docker compose up -d
```

3. Copiar la configuración local e instalar dependencias:

```bash
cp .env.example .env
npm install
```

4. Crear o actualizar la base local:

```bash
npm run db:migrate:deploy
```

5. Ejecutar la aplicación:

```bash
npm run dev
```

Abre `http://localhost:3000`. Mailpit captura los correos de verificación y recuperación en `http://localhost:8025`; los mensajes de prueba no se envían a destinatarios externos. Prueba el flujo: crear usuario, verificar el correo en Mailpit, crear empresa, revisar el plan de cuentas y guardar un borrador balanceado.

Para ejecutar las comprobaciones automatizadas:

```bash
npm run lint
npm run typecheck
npm test
npm run db:validate
npm run build
```

Para detener los servicios conservando la base local:

```bash
docker compose down
```

`docker compose down -v` elimina también el volumen de PostgreSQL y borra esos datos de prueba.

En una base vacía, la migración inicial crea el esquema contable, los datos de autenticación y las tablas de seguridad.
Para crear una migración después de modificar el esquema, usa `npm run db:migrate:dev -- --name nombre_del_cambio`.

## Otros entornos

Para un entorno propio, reemplaza todas las claves de desarrollo. Configura `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` y SMTP real. Genera el secreto con `openssl rand -base64 32`. No uses `.env.example` en producción.

En producción configura estas variables en Netlify: `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD` y `EMAIL_FROM`. Aplica migraciones con `npm run db:migrate:deploy` desde un entorno controlado antes de desplegar una versión que las requiera.

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [Alcance funcional](docs/PRODUCT_SCOPE.md)
- [Plan de cuentas y asientos](docs/ACCOUNTING_PERSISTENCE.md)
