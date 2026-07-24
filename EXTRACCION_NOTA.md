# Nota sobre esta extracción

Este es el código fuente completo del proyecto Lovable **Impulzii: Drive Business Forward**
(`impulse-boost-app`), extraído del commit `09b8280fb680872a03b2bb0fed09abb810b290ce`.

## Cómo correrlo localmente

```sh
bun install   # o: npm install
bun dev       # o: npm run dev
```

## Dos archivos no incluidos (y por qué)

- **`bun.lock`**: es el lockfile de dependencias. No es código fuente y se
  regenera automáticamente al correr `bun install`. Se omitió por tamaño.
- **`public/favicon.ico`**: es un binario (ícono). La herramienta de extracción
  solo devuelve texto, así que no se pudo reconstruir fielmente. Puedes
  reemplazarlo por cualquier `.ico` propio; la app corre sin él.

## Stack

TanStack Start (React 19 + TypeScript + Vite), Tailwind CSS v4, shadcn/ui.
Datos en memoria (mock) con persistencia en `localStorage` — ver
`src/lib/impulzii/`. No requiere backend para la demo.
