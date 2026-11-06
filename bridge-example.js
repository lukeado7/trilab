// TriLab · bridge di esempio (nessuna dipendenza). Avvio: BRIDGE_TOKEN=segreto node bridge-example.js
// Riceve gli allenamenti strutturati di TriLab (schema "trilab.bridge/v1") e li smista per destinazione.
// Oggi funziona solo "echo" (prova). Gli adattatori "coros" e "garmin" sono i punti dove aggiungere
// le chiamate reali: vedi README.md.
const http = require('http');
const TOKEN = process.env.BRIDGE_TOKEN || '';
const PORT = +process.env.PORT || 8787;
const ORIGIN = process.env.ALLOW_ORIGIN || '*';           // in produzione: l'indirizzo della tua app

const countSteps = w => w.steps.reduce((n, s) => n + (s.type === 'repeat' ? s.repeat * s.steps.length : 1), 0);

const adapters = {
  echo: async p => ({ ok: true, message: `Prova ricevuta: «${p.workout.name || 'senza nome'}» del ${p.workout.date}, ${countSteps(p.workout)} step. Nulla è stato inviato.` }),
  coros: async p => { throw Object.assign(new Error('Adattatore COROS non ancora implementato (vedi README: serve lo schema di createScheduledWorkout)'), { status: 501 }); },
  garmin: async p => { throw Object.assign(new Error('Adattatore Garmin non ancora implementato: per ora usa "Invia a intervals.icu"'), { status: 501 }); },
};

function validate(p) {
  if (!p || p.schema !== 'trilab.bridge/v1') return 'schema non riconosciuto';
  if (!adapters[p.target]) return 'destinazione sconosciuta: ' + p.target;
  const w = p.workout;
  if (!w || !Array.isArray(w.steps) || !w.steps.length) return 'allenamento senza step';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(w.date || '')) return 'data non valida';
  if (!['run', 'bike'].includes(w.sport)) return 'disciplina non supportata: ' + w.sport;
  return null;
}

http.createServer((req, res) => {
  const send = (code, obj) => {
    res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ORIGIN,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' });
    res.end(JSON.stringify(obj));
  };
  if (req.method === 'OPTIONS') return send(204, {});
  if (req.method !== 'POST') return send(405, { ok: false, message: 'usa POST' });
  if (TOKEN && req.headers.authorization !== 'Bearer ' + TOKEN) return send(401, { ok: false, message: 'token non valido' });
  let body = '';
  req.on('data', d => { body += d; if (body.length > 2e5) req.destroy(); });
  req.on('end', async () => {
    let p; try { p = JSON.parse(body); } catch (e) { return send(400, { ok: false, message: 'JSON non valido' }); }
    const err = validate(p); if (err) return send(400, { ok: false, message: err });
    try { send(200, await adapters[p.target](p)); }
    catch (e) { send(e.status || 500, { ok: false, message: e.message }); }
  });
}).listen(PORT, () => console.log('bridge in ascolto sulla porta', PORT));
