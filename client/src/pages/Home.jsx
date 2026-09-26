// src/pages/Home.jsx  (antes pages/index.html)

import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Home() {
  const { hash } = useLocation();

  // Permite que los enlaces "/#como-funciona" y "/#impacto" hagan scroll a su sección
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <h1>Una plataforma para conectar empresas donantes y organizaciones sociales.</h1>
            <p className="lede">
              A Manos Llenas conecta a empresas con productos o insumos sobrantes con organizaciones sociales que
              pueden aprovecharlos, con ubicación, tiempos y calidad verificables en cada donación.
            </p>
            <div className="hero-actions">
              <Link className="btn" to="/registro">Registrar mi empresa u organización</Link>
              <Link className="btn secondary" to="/login">Ya tengo cuenta</Link>
            </div>
            <div className="stat-row">
              <div className="stat">
                <b>8%</b>
                <span>de los bienes producidos se descarta o perece cada año</span>
              </div>
              <div className="stat">
                <b>$163 mmd</b>
                <span>en pérdidas anuales por desperdicio en cadenas de suministro</span>
              </div>
            </div>
          </div>
          <div className="hero-card">
            <h3>Hoy en el tablero</h3>
            <p>
              Pan de caja excedente, fruta y verdura de segunda calidad, despensas para 40 familias y comidas
              comunitarias diarias — publicados por empresas y organizaciones reales de la red.
            </p>
            <Link className="btn gold small" to="/login">Ver el tablero de ofertas</Link>
          </div>
        </div>
      </section>

      <section id="como-funciona">
        <div className="wrap">
          <div className="section-head">
            <h2>Cómo funciona</h2>
          </div>
          <div className="steps">
            <div className="step">
              <h3>1. Regístrate y ubícate en el mapa</h3>
              <p>Empresas y organizaciones crean un perfil con datos de contacto, ubicación y, en el caso de las organizaciones, su capacidad de recepción.</p>
            </div>
            <div className="step">
              <h3>2. Publica o reclama</h3>
              <p>Las empresas publican ofertas de lo que tienen disponible; las organizaciones publican solicitudes o reclaman ofertas que se ajusten a lo que necesitan.</p>
            </div>
            <div className="step">
              <h3>3. Entrega, califica y da seguimiento</h3>
              <p>Cada donación se puede marcar como recibida y calificar. Si algo llega deficiente, queda registrado para dar seguimiento a la empresa donante.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="alt" id="impacto">
        <div className="wrap">
          <div className="section-head">
            <h2>Pensado para quienes ya hacen este trabajo</h2>
          </div>
          <div className="pillars">
            <div className="pillar">
              <h3>Transparencia verificable</h3>
              <p>Reportes de cuánto ha donado cada empresa, a cuántas organizaciones ha llegado y qué porcentaje tuvo algún problema.</p>
            </div>
            <div className="pillar">
              <h3>Simple para equipos pequeños</h3>
              <p>Sin pasos complicados: pensado para organizaciones sin personal con experiencia tecnológica.</p>
            </div>
            <div className="pillar">
              <h3>Ubicación siempre visible</h3>
              <p>Cada perfil muestra su ubicación en un mapa, para calcular con quién conviene coordinar la entrega.</p>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <span>A Manos Llenas — prototipo funcional, Actividad 2 de Ingeniería de Software.</span>
          <span>Sin backend: los datos de esta demo se guardan en tu navegador.</span>
        </div>
      </footer>
    </>
  );
}
