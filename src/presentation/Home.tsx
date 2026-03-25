import { Link } from 'react-router-dom';
import './Home.css';

export function Home() {
  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">SIEMPRE LUCHANDO</h1>
          <p className="hero-subtitle">Únete a la familia Uros de Rivas. El mejor baloncesto local.</p>
          <div className="hero-buttons">
            <Link to="/events" className="btn-primary">Ver Calendario</Link>
            <Link to="/market" className="btn-secondary">Tienda Oficial</Link>
          </div>
        </div>
      </section>
      
      <section className="latest-features">
        <h2>ÚLTIMAS NOTICIAS</h2>
        <div className="feature-grid">
          <div className="feature-card animate-slide-up">
            <div className="feature-img" style={{ backgroundImage: "url('/assets/bull_black.jpeg')" }}></div>
            <h3>Crónica del último partido EBA</h3>
            <p>El primer equipo consigue una victoria aplastante frente al Estudiantes.</p>
          </div>
          <div className="feature-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="feature-img" style={{ backgroundImage: "url('/assets/bull_white.jpeg')" }}></div>
            <h3>Nuevas Equipaciones Disponibles</h3>
            <p>Hazte con la ropa oficial y luce los colores 2026/2027.</p>
          </div>
          <div className="feature-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="feature-img" style={{ backgroundImage: "url('/assets/bull_black.jpeg')" }}></div>
            <h3>Inscripciones Abiertas</h3>
            <p>Reserva la plaza para las escuelas municipales y nuestro Campus de Verano.</p>
          </div>
        </div>
      </section>
      
      <section className="sponsors-section">
        <h3>NUESTROS PATROCINADORES</h3>
        <div className="sponsors-scroll">
          <img src="/assets/sponsor_jarmauto.jpg" alt="Jarmauto" onError={e => e.currentTarget.style.display='none'} />
          <img src="/assets/sponsor_rotusil.jpg" alt="Rotusil" onError={e => e.currentTarget.style.display='none'} />
          <img src="/assets/sponsor_clinica_everest.jpg" alt="Everest Clínica Dental" onError={e => e.currentTarget.style.display='none'} />
          <img src="/assets/sponsor_ferrual.jpg" alt="Ferrual" onError={e => e.currentTarget.style.display='none'} />
          <img src="/assets/sponsor_alquiler_de_maquinaria.jpg" alt="Alquiler Maquinaria" onError={e => e.currentTarget.style.display='none'} />
        </div>
      </section>
    </div>
  );
}
