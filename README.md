# Mini-site locatif — Prototype

Projet: mini-site React + serverless pour gérer 2 logements (Studio Guillerval & Logement Guillerval).
Contient synchronisation iCal (Airbnb / Booking) via une fonction serverless (api/fetch-ical.js).

## Installation locale
1. `npm install`
2. `npm run dev`

## Déploiement
- Déployer sur Vercel/Netlify. Le dossier `api/` contient la fonction serverless.
- Configurer une tâche cron (Scheduled Function) pour appeler `/api/fetch-ical` régulièrement (ex. toutes les 2 min).
