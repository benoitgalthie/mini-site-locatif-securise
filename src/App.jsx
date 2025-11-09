import React, { useEffect, useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import rrulePlugin from '@fullcalendar/rrule';
import './styles.css';

const PASSWORD = "@hicaq159MM@";

const DEFAULT_PROPERTIES = [
  { id: 'studio-guillerval', name: 'Studio Guillerval', color: '#e74c3c', icalImportUrl: '', icalExportUrl: '' },
  { id: 'logement-guillerval', name: 'Logement Guillerval', color: '#3498db', icalImportUrl: '', icalExportUrl: '' }
];

function normalizeEvent(item, property) {
  return {
    id: `${property.id}-${item.uid || Math.random().toString(36).slice(2,9)}`,
    title: item.title || 'Réservation',
    start: item.start,
    end: item.end,
    extendedProps: { platform: item.source || 'Direct', guestName: item.guestName || '', notes: item.notes || '' },
    backgroundColor: property.color,
    borderColor: property.color
  };
}

function Login({ onSuccess }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  function handleLogin(e) {
    e.preventDefault();
    if (input === PASSWORD) {
      localStorage.setItem('loggedIn', 'true');
      onSuccess();
    } else setError('Mot de passe incorrect.');
  }
  return (
    <div className="login-screen">
      <form onSubmit={handleLogin} className="login-box">
        <h1>Connexion – Espace locatif Guillerval</h1>
        <input
          type="password"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Mot de passe"
        />
        <button type="submit">Se connecter</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(localStorage.getItem('loggedIn') === 'true');
  const [properties, setProperties] = useState(DEFAULT_PROPERTIES);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProp, setSelectedProp] = useState('studio-guillerval');
  const fetchIntervalRef = useRef(null);

  useEffect(() => {
    if (loggedIn) {
      fetchAllIcals();
      fetchIntervalRef.current = setInterval(fetchAllIcals, 2 * 60 * 1000);
      return () => clearInterval(fetchIntervalRef.current);
    }
  }, [loggedIn]);

  async function fetchAllIcals() {
    setLoading(true);
    try {
      const resp = await fetch('/api/fetch-ical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties })
      });
      const data = await resp.json();
      const all = [];
      for (const p of properties) {
        const list = data.results?.[p.id] || [];
        list.forEach(it => all.push(normalizeEvent(it, p)));
      }
      setEvents(all);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleDateSelect(info) {
    const title = prompt('Nom du locataire / titre :');
    if (!title) return;
    const prop = properties.find(p => p.id === selectedProp);
    const ev = normalizeEvent({ title, start: info.startStr, end: info.endStr }, prop);
    setEvents(prev => [...prev, ev]);
  }

  function handleEventClick(info) {
    if (confirm(`Supprimer la réservation "${info.event.title}" ?`)) info.event.remove();
  }

  if (!loggedIn) return <Login onSuccess={() => setLoggedIn(true)} />;

  return (
    <div className="app-root">
      <header className="header-bar">
        <h1>Gestion locative — Guillerval</h1>
        <button onClick={() => { localStorage.removeItem('loggedIn'); setLoggedIn(false); }}>Déconnexion</button>
      </header>

      <section className="grid">
        <aside>
          <h2>Logements</h2>
          {properties.map(p => (
            <div key={p.id} style={{ borderLeft: `4px solid ${p.color}`, paddingLeft: 6, marginBottom: 8 }}>
              <strong>{p.name}</strong><br />
              <label>URL iCal :</label>
              <input value={p.icalImportUrl} onChange={e => setProperties(prev => prev.map(pr => pr.id===p.id?{...pr,icalImportUrl:e.target.value}:pr))} />
              <div>
                <input type="radio" checked={selectedProp===p.id} onChange={()=>setSelectedProp(p.id)} /> Créer sur ce logement
              </div>
            </div>
          ))}
          <button onClick={fetchAllIcals}>Synchroniser maintenant</button>
          <p>Statut : {loading?'Chargement...':'À jour'}</p>
        </aside>
        <main>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, rrulePlugin]}
            initialView="dayGridMonth"
            selectable
            select={handleDateSelect}
            events={events}
            eventClick={handleEventClick}
            height={650}
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' }}
          />
        </main>
      </section>
    </div>
  );
}
