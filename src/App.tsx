import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from './presentation/store';
import { Navbar } from './presentation/Navbar';
import { Footer } from './presentation/Footer';
import { Home } from './presentation/Home';
import { Login } from './presentation/Login';
import { Market } from './presentation/Market';
import { Events } from './presentation/Events';
import { Clasificaciones } from './presentation/Clasificaciones';

function App() {
  const { initAuth } = useStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/market" element={<Market />} />
            <Route path="/events" element={<Events />} />
            <Route path="/clasificaciones" element={<Clasificaciones />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
