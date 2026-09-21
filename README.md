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

- Next.js 16
- React 19
- TypeScript
- PostgreSQL
- Prisma ORM 7
- Netlify como objetivo inicial de despliegue

## Desarrollo local

1. Copiar `.env.example` a `.env`.
2. Configurar `DATABASE_URL`.
3. Instalar dependencias:

```bash
npm install
```

4. Validar:

```bash
npm run lint
npm run typecheck
npm run db:validate
npm run build
```

5. Ejecutar:

```bash
npm run dev
```

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [Alcance funcional](docs/PRODUCT_SCOPE.md)

## Rama de trabajo inicial

`feat/foundation-v0`
