const fetch = require('node-fetch');
const ical = require('node-ical');

module.exports = async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { properties } = body || {};
    const results = {};

    if (!properties || !Array.isArray(properties)) {
      res.status(400).send({ error: 'properties missing' });
      return;
    }

    for (const p of properties) {
      const url = p.icalImportUrl && p.icalImportUrl.trim();
      results[p.id] = [];
      if (!url) continue;

      try {
        const r = await fetch(url, { timeout: 10000 });
        if (!r.ok) throw new Error('Erreur fetch');
        const text = await r.text();
        const parsed = ical.parseICS(text);
        for (const k in parsed) {
          const ev = parsed[k];
          if (ev.type === 'VEVENT') {
            results[p.id].push({
              uid: ev.uid,
              title: ev.summary,
              start: ev.start,
              end: ev.end,
              description: ev.description,
              source: p.name
            });
          }
        }
      } catch (err) {
        console.error('Erreur iCal fetch for', p.id, err.message || err);
      }
    }

    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify({ results }));
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Erreur serveur' });
  }
};
