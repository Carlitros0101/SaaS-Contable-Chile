# SaaS Contable Chile

SaaS contable y financiero orientado inicialmente a microempresas y Pymes chilenas.

## Estado

Proyecto en fase **foundation v0.1**.

La prioridad actual es construir un núcleo contable robusto antes de ampliar módulos.

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
- Netlify como objetivo inicial de despliegue

## Desarrollo local

1. Instalar Node.js 24 LTS. El repositorio incluye `.nvmrc`.
2. Verificar el toolchain:

```bash
node --version
npm --version
```

3. Copiar `.env.example` a `.env`.
4. Configurar `DATABASE_URL`.
5. Instalar dependencias:

```bash
npm install
```

6. Validar:

```bash
npm run lint
npm run typecheck
npm test
npm run db:validate
npm run build
```

7. Ejecutar:

```bash
npm run dev
```

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [Alcance funcional](docs/PRODUCT_SCOPE.md)
