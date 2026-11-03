---
name: update-laliga-dates
description: Actualiza en MongoDB las fechas de los próximos partidos de LaLiga (quinileague) usando football-data.org y cotejando con Marca/AS antes de escribir. Usar cuando el usuario pida "actualizar fechas/horarios de los partidos", "actualizar jornadas", "sync de horarios", "update match dates", o al hablar de mantener al día los deadlines de apuestas de las próximas jornadas. Limita las peticiones a la ventana de ~1 mes hacia adelante (suele haber 2-3 jornadas confirmadas), nunca recorre todas las jornadas hasta la 38.
---

# Actualizar fechas de partidos de LaLiga (quinileague)

Actualiza `Match.date` (MongoDB Atlas) de las próximas jornadas con horario
oficial, usando football-data.org como fuente primaria y Marca/AS como
cotejo. El repo del proyecto es `/home/luis/dev/quinileague`.

## Por qué este flujo

- football-data.org devuelve `status: TIMED` solo cuando el horario está
  confirmado; los `SCHEDULED` son placeholders a medianoche (00:00Z) que
  NO se deben escribir en la BD, o el deadline de apuestas saldría mal.
- Free tier: 100 peticiones/día. Por eso una sola llamada con
  `dateFrom`/`dateTo` (hoy → +30 días) en vez de preguntar jornada a
  jornada; rara vez hay más de 2-3 jornadas confirmadas en esa ventana.
- Antes de escribir, coteja con fuentes periodísticas. Cuando la skill
  lleve varias ejecuciones sin incidencias, este paso se podrá eliminar
  (dejarlo indicado en el PR/commits si toca retirarlo).

## Pasos

1. **Ejecutar dry-run** (no escribe nada):

   ```bash
   cd /home/luis/dev/quinileague
   node scripts/update-upcoming.js
   ```

   El script lee `.env` solo (MONGODB_URI, FOOTBALL_DATA_TOKEN), hace
   1 petición, descarta jornadas sin `TIMED` y muestra old→new en hora
   Madrid. Si no hay jornadas confirmadas o todos los cambios son
   "sin cambios", termina ahí y reporta.

2. **Cotejar con las fuentes** (obligatorio mientras no se retire el paso):
   - Marca (calendario completo): https://www.marca.com/futbol/primera-division/calendario.html
   - AS por jornada: la URL la imprime el script
     (`https://as.com/resultados/futbol/primera/<temporada>/jornada/regular_a_<N>/`)
   - Si alguna hora difiere de lo que devuelve la API → **parar**, no
     aplicar, y mostrar la discrepancia al usuario.

3. **Aplicar** si el cotejo cuadra:

   ```bash
   node scripts/update-upcoming.js --apply
   ```

4. **Reportar**: jornadas tocadas, nº de partidos actualizados/sin
   cambios/no encontrados, y el próximo deadline (fecha del primer
   partido de la jornada − 5 min, que es como lo calcula la app).

## Parámetros del script

- `--days=N` (default 30): anchura de la ventana hacia adelante.
- `--max-matchdays=N` (default 3): tope de jornadas por ejecución.
- `--apply`: escribe en MongoDB; sin él es dry-run.

## Si falla

- `FOOTBALL_DATA_TOKEN is required`: el token no está en `.env` ni en
  el entorno.
- Equipo sin mapear: añadir la traducción en `TEAM_ALIASES` dentro de
  `scripts/update-upcoming.js` (nombres de la API → nombres cortos de
  la BD, p. ej. `Club Atlético de Madrid` → `Atlético`) y reejecutar.
- 429 de la API: límite diario alcanzado; reintentar mañana.
