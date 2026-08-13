# Plan MVP Kicker

Aplicación web responsive (mobile-first) para publicar y ejecutar misiones comerciales en establecimientos. Alcance amplio: propongo construirla por fases y validar contigo antes de avanzar cada bloque grande.

## Decisiones técnicas

- **Stack**: TanStack Start (React 19 + TS + Vite) ya presente, Tailwind v4, shadcn/ui.
- **Backend**: Lovable Cloud (Postgres + Auth + Storage + Edge Functions) en lugar de Firebase. Motivo: es el backend nativo integrado, sin cuentas externas, con RLS por rol y Storage para evidencias. La capa de servicios (`AuthService`, `MissionService`, etc.) queda igual: los componentes nunca tocan la BD directamente, así se mantiene la puerta abierta para reemplazar por REST de Odoo.
- **Roles**: `participant`, `venue_admin`, `auditor`, `platform_admin` en tabla `user_roles` + función `has_role` (nunca en profiles).
- **Geo**: API del navegador (`navigator.geolocation`). Mapas se dejan como TODO.
- **PWA/instalable**: manifest + iconos (sin service worker offline; no lo pediste explícitamente).

## Fases

### Fase 1 — Fundaciones (esta entrega)

1. Design system Kicker en `src/styles.css` (paleta energía/tech, tipografía, tokens).
2. Modelos TypeScript de todas las entidades (`src/types/`).
3. Capa de servicios con interfaces + implementación mock en memoria (`src/services/*`). Preparada para swap a Cloud/Odoo.
4. Datos seed (5 participantes, 5 establecimientos, 3 marcas, 3 campañas con misiones y formularios dinámicos).
5. Rutas base + guardas por rol + layout móvil (bottom nav) y layout admin (sidebar).
6. Autenticación mock (login/registro/logout) con selector de rol para demo.
7. Pantallas participante: Inicio, Misiones (lista + filtros), Detalle, Ejecución (formulario dinámico con foto + geo), Actividad, Recompensas, Perfil.
8. Panel admin: Dashboard con KPIs, Campañas (lista + wizard básico), Misiones, Ejecuciones/Auditoría (aprobar/rechazar/corrección), Participantes, Establecimientos, Recompensas.
9. Reglas de negocio en servicios (vigencia, cupos, elegibilidad por ciudad/perfil/venue, acreditación de puntos, radio geo).
10. Logo temporal "Kicker" (wordmark SVG).

Al final de Fase 1 tendrás una app **funcional end-to-end con datos en memoria**: puedes registrarte, vincularte, aceptar/ejecutar/enviar una misión, auditarla desde otro rol, y ver los puntos acreditados.

### Fase 2 — Backend real (Lovable Cloud)

- Habilitar Cloud, migraciones SQL de todas las tablas + GRANTs + RLS + `has_role`.
- Storage bucket para evidencias, con validación de tamaño y hash.
- Implementaciones "cloud" de cada servicio, activadas por flag (`VITE_DATA_SOURCE=cloud|mock`).
- Auth real por email/password (Google/celular quedan preparados, no activados).
- Seed SQL con los mismos datos demo.

### Fase 3 — Pulido

- Reportes con exportación CSV.
- Auditoría con detección de duplicados por hash.
- PWA instalable (manifest + iconos).
- Notificaciones toast, skeletons, estados vacíos revisados.
- QA de rutas rotas, permisos, mobile.

## Fuera de alcance (confirmado)

Pagos, OCR/IA, marketplace, chat, referidos, Odoo real, WhatsApp, facturación, cripto.

## Qué necesito de ti antes de empezar

1. **¿Arrancamos por Fase 1 (mock funcional) y luego migramos a Cloud, o prefieres que habilite Lovable Cloud desde el inicio y trabaje directo contra la BD real?** Mock primero es más rápido de ver funcionando; Cloud desde inicio evita re-trabajo pero añade fricción de auth real para probar los 4 roles.
2. **Paleta**: ¿tienes colores/identidad definidos para Kicker, o defino yo una propuesta (sugiero: violeta eléctrico + lima energía sobre fondos claros y modo oscuro)?
3. **Alcance de esta entrega**: dado el tamaño, propongo entregar Fase 1 completa en esta iteración. ¿OK, o prefieres que primero entregue solo el flujo participante y en la siguiente el panel admin?
