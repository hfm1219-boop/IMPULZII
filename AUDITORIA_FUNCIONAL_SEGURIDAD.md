# Auditoría funcional y de seguridad — Kicker demo

Fecha: 13 de agosto de 2026

## Alcance revisado

- Portal público, registro, inicio/cierre de sesión y cuentas demo.
- Portal participante: inicio, misiones, detalle, ejecución, actividad, billetera, recompensas y perfil.
- Panel administrativo: campañas, misiones, auditoría, participantes, establecimientos, recompensas y tokens.
- Modelos y servicios de usuarios, establecimientos, membresías, campañas, misiones, ejecuciones, billetera, recompensas, redenciones y auditoría.
- Rutas, botones, formularios, estados, permisos por rol, persistencia local, dependencias y cabeceras HTTP.

## Flujos comprobados

| Flujo                                                                            | Resultado                                 |
| -------------------------------------------------------------------------------- | ----------------------------------------- |
| Portada → ingreso/registro                                                       | Correcto                                  |
| Logo → portada pública                                                           | Correcto                                  |
| Registro duplicado por correo/documento                                          | Bloqueado                                 |
| Usuario inactivo → sesión                                                        | Bloqueado                                 |
| Vinculación a establecimiento activo                                             | Correcto                                  |
| Vinculación a usuario/establecimiento inactivo                                   | Bloqueada                                 |
| Elegibilidad por campaña, misión, ciudad, perfil, establecimiento y verificación | Validada                                  |
| Frecuencia y cupos por participante/total                                        | Validados                                 |
| Aceptar → iniciar → autoguardar → enviar                                         | Correcto                                  |
| Retomar borrador o corrección                                                    | Correcto                                  |
| Editar o reenviar ejecución cerrada                                              | Bloqueado                                 |
| Campos obligatorios, rangos y opciones                                           | Validados                                 |
| Foto y geolocalización                                                           | Validadas                                 |
| Auditor no autorizado                                                            | Bloqueado                                 |
| Aprobación repetida / doble crédito                                              | Bloqueada                                 |
| Presupuesto de campaña                                                           | Validado                                  |
| Saldo disponible vs. pendiente                                                   | Corregido                                 |
| Reserva de recompensa e inventario                                               | Atómica en la demo                        |
| Token de otro comercio                                                           | Bloqueado                                 |
| Token vencido                                                                    | Cancelado; saldo e inventario restaurados |
| Token reutilizado                                                                | Bloqueado                                 |
| Navegación administrativa móvil                                                  | Corregida                                 |
| Ruta `/admin/rewards`                                                            | Implementada                              |

## Correcciones de seguridad aplicadas

- Autorización por rol tanto en rutas como en operaciones sensibles.
- Separación de acceso: restaurante a tokens, auditor a ejecuciones, plataforma al panel completo.
- Validación de comercio asociado al token, vigencia y uso único.
- Generación de tokens con `crypto.getRandomValues`.
- Idempotencia de créditos por ejecución y bloqueo de revisiones repetidas.
- Reversión de reservas vencidas y restitución exacta de inventario.
- Exclusión de créditos pendientes del saldo utilizable.
- Validación de archivos por tipo y límite de 2 MB.
- Persistencia con rollback si `localStorage` no puede guardar el cambio.
- Cabeceras `nosniff`, anti-iframe, política de referente, permisos y aislamiento de ventana.
- Dependencias actualizadas: `npm audit` reporta 0 vulnerabilidades.

## Frontera de seguridad de la versión demo

Esta versión conserva cuentas, roles, saldos, evidencias y tokens en `localStorage`, y acepta cualquier contraseña como parte del modo demostrativo. Un usuario con acceso a las herramientas del navegador puede alterar ese almacenamiento. Por tanto, los controles implementados permiten demostrar correctamente los procesos y prevenir errores normales de interfaz, pero no convierten la demo en un sistema apto para dinero real.

Para producción serían obligatorios un backend autoritativo, autenticación real, contraseñas cifradas o proveedor de identidad, sesiones seguras, base de datos transaccional, restricciones únicas, bloqueo de filas o control de concurrencia, almacenamiento privado de evidencias, registros inmutables, límites de tasa y monitoreo antifraude.

## Verificación técnica

- `npm run audit:functional`: 26 controles funcionales, por rol y antifraude superados.
- `npx tsc --noEmit`: sin errores.
- `npm run lint`: sin errores; permanecen 8 advertencias de Fast Refresh en componentes compartidos.
- `npm run build`: compilación cliente, SSR y Cloudflare completada.
- `npm audit --omit=dev`: 0 vulnerabilidades.

La prueba visual interactiva no pudo ejecutarse porque no había un navegador conectado a la sesión. La revisión de vistas se realizó mediante inventario de rutas/componentes, análisis de cada manejador y pruebas automatizadas de los servicios y transiciones críticas.
