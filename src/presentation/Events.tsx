import { useEffect } from 'react';
import { useStore } from './store';
import { AdminGuard } from './AdminGuard';
import { SupabaseAdapter } from '../infrastructure/SupabaseAdapter';
import './Events.css';

const adapter = new SupabaseAdapter();

export function Events() {
  const { events, loading, fetchEvents } = useStore();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleAddEvent = async () => {
    const title = window.prompt("Título del Evento (ej. Campus de Junio):");
    if (!title) return;
    const type = window.prompt("Tipo de evento (match, training, campus):", "campus") as any;
    if (!type) return;
    const date = window.prompt("Fecha (ej. 2025-06-25):", new Date().toISOString().split('T')[0]);
    if (!date) return;
    const location = window.prompt("Lugar:", "Colegio Hipatia");
    if (!location) return;
    const imageUrl = window.prompt("URL de imagen:", "https://via.placeholder.com/800x400");
    if (!imageUrl) return;

    try {
      await adapter.createEvent({ title, type, date, location, imageUrl, description: '' });
      fetchEvents();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que quieres borrar este evento?")) return;
    try {
      await adapter.deleteEvent(id);
      fetchEvents();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  if (loading && events.length === 0) {
    return <div className="loading-state">Cargando eventos...</div>;
  }

  return (
    <div className="events-container">
      <div className="events-header">
        <h1>Eventos y Partidos</h1>
        <AdminGuard>
          <button className="btn-admin-add" onClick={handleAddEvent}>+ Añadir Evento</button>
        </AdminGuard>
      </div>

      <div className="events-list">
        {events.length === 0 ? (
          <p className="no-items">Próximamente disponible.</p>
        ) : (
          events.map(ev => (
            <div key={ev.id} className="event-card">
              <AdminGuard>
                <button className="btn-admin-delete" onClick={() => handleDelete(ev.id)}>X</button>
              </AdminGuard>
              <div className="event-image" style={{ backgroundImage: `url(${ev.imageUrl})` }}>
                <div className="event-type-badge">{ev.type.toUpperCase()}</div>
              </div>
              <div className="event-info">
                <h3>{ev.title}</h3>
                <div className="event-meta">
                  <span>📅 {new Date(ev.date).toLocaleDateString('es-ES')}</span>
                  <span>📍 {ev.location}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
