# Bridge TriLab → orologio (COROS / Garmin)

TriLab non parla direttamente con COROS o Garmin: manda l'allenamento strutturato a un **bridge**,
un piccolo servizio web tuo, che lo traduce nel formato della destinazione. Così COROS e Garmin si
aggiungono dopo senza toccare l'app.

## Come si usa
1. Pubblica `bridge-example.js` su un host HTTPS (Node 18+) e imposta `BRIDGE_TOKEN` e `ALLOW_ORIGIN`.
2. In TriLab, Costruttore → "Bridge": indirizzo, token e destinazione. Con **Prova** non si invia nulla.

## Contratto (v1)
Richiesta `POST` con `Authorization: Bearer <token>`:
```json
{ "schema": "trilab.bridge/v1", "target": "coros | garmin | echo",
  "athlete": { "name": "Anna Rossi", "intervals_id": "i123" },
  "thresholds": { "training_speed_ms": 4.22, "ftp_w": 210, "hr_max": 188 },
  "workout": { "trilab_workout": 1, "sport": "run | bike", "name": "6x3'", "date": "2026-11-05",
    "steps": [ { "type": "warm|work|rest|cool", "duration": {"seconds": 600} | {"meters": 1000},
                 "target": { "pace_s_per_km": [212, 231], "pct_training_speed": [100, 110] } },
               { "type": "repeat", "repeat": 6, "steps": [ ... ] } ] } }
```
Per la bici il target è `{ "pct_ftp": [88, 95] }`. Risposta: `{ "ok": true, "message": "..." }`
oppure un errore HTTP con `{ "ok": false, "message": "..." }`; il messaggio viene mostrato in app.

## Adattatore COROS (da completare)
Il MCP ufficiale COROS è un server remoto con accesso OAuth per atleta, e crea allenamenti di
corsa e bici (non nuoto) fino a 90 giorni avanti. Mancano due informazioni che non ho potuto verificare:
1. **Lo schema esatto** dell'oggetto `course` di `createScheduledWorkout`: collegati con
   `npx @modelcontextprotocol/inspector` all'indirizzo MCP COROS, accedi, apri *Tools* e copia
   l'`inputSchema` di quello strumento.
2. **L'accesso OAuth** per un'app tua: se il server permette la registrazione di un client, il
   bridge conserva il token di ogni atleta e chiama lo strumento; altrimenti si usa il connettore di Claude.
Con lo schema in mano, la traduzione è la funzione `adapters.coros` (da `workout.steps` a `course`).

## Garmin
Oggi: TriLab → intervals.icu → Garmin Connect (pulsante "Invia a intervals.icu"), se l'atleta ha attivato
l'invio degli allenamenti nelle impostazioni di collegamento di intervals.icu.
Diretto: richiede l'accesso al programma sviluppatori di Garmin; `adapters.garmin` è il punto dove metterlo.
