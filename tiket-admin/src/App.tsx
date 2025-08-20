// Panel de administración con diseño premium y animaciones GSAP
import { useEffect, useRef } from 'react'
import { Container } from 'react-bootstrap'
import { gsap } from 'gsap'
import AOS from 'aos'
import 'aos/dist/aos.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import { useAuth } from './contexts/AuthContext'
import { LoginForm } from './components/LoginForm'
import { Dashboard } from './components/Dashboard'
import { motion, AnimatePresence } from 'framer-motion'

// Imágenes de fondo para el admin
const adminBackgrounds = [
  'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf',
  'https://images.unsplash.com/photo-1571266028243-d220c6a8d7e7',
  'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14',
  'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3'
]

export default function App() {
  const { isAuthenticated, logout } = useAuth()
  const appRef = useRef(null)
  const backgroundRef = useRef(0)

  useEffect(() => {
    // Inicializar AOS
    AOS.init({
      duration: 1000,
      once: false,
      mirror: true
    })

    // Animación de entrada con GSAP
    const ctx = gsap.context(() => {
      gsap.from('.admin-header', {
        y: -100,
        opacity: 0,
        duration: 1.5,
        ease: 'power4.out'
      })

      // Animación de partículas de neón
      gsap.to('.neon-particle', {
        x: 'random(-50, 50)',
        y: 'random(-50, 50)',
        duration: 'random(3, 6)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: {
          each: 0.1,
          from: 'random'
        }
      })
    }, appRef)

    // Cambiar fondo cada 8 segundos
    const interval = setInterval(() => {
      backgroundRef.current = (backgroundRef.current + 1) % adminBackgrounds.length
      document.querySelector('.dynamic-bg')?.setAttribute(
        'style',
        `background-image: linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.9)), url(${adminBackgrounds[backgroundRef.current]})`
      )
    }, 8000)

    return () => {
      ctx.revert()
      clearInterval(interval)
    }
  }, [])

  return (
    <div ref={appRef} className="admin-app min-vh-100 position-relative overflow-hidden">
      {/* Fondo dinámico */}
      <div 
        className="dynamic-bg position-fixed top-0 start-0 w-100 h-100"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.9)), url(${adminBackgrounds[0]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          zIndex: -2,
          transition: 'background-image 1.5s ease-in-out'
        }}
      />

      {/* Partículas de neón */}
      <div className="neon-container position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: -1, pointerEvents: 'none' }}>
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="neon-particle position-absolute"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              background: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff0080'][Math.floor(Math.random() * 5)],
              borderRadius: '50%',
              boxShadow: `0 0 ${Math.random() * 20 + 10}px currentColor`,
              opacity: Math.random() * 0.5 + 0.3
            }}
          />
        ))}
      </div>

      {/* Header con efecto glassmorphism */}
      <header className="admin-header py-3 mb-4" style={{
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(20px)',
        borderBottom: '2px solid rgba(255,0,255,0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <Container>
          <div className="d-flex justify-content-between align-items-center">
            <motion.h1 
              className="mb-0 text-white"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '2.5rem',
                letterSpacing: '3px',
                textShadow: '0 0 30px rgba(0,255,255,0.5), 0 0 60px rgba(255,0,255,0.3)'
              }}
              animate={{ 
                textShadow: [
                  '0 0 30px rgba(0,255,255,0.5), 0 0 60px rgba(255,0,255,0.3)',
                  '0 0 40px rgba(255,0,255,0.5), 0 0 80px rgba(0,255,255,0.3)',
                  '0 0 30px rgba(0,255,255,0.5), 0 0 60px rgba(255,0,255,0.3)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              🎉 TIKET NOW - ADMIN PANEL
            </motion.h1>
            
            {isAuthenticated && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="btn btn-outline-danger"
                style={{
                  borderColor: '#ff0080',
                  color: '#ff0080',
                  fontWeight: 'bold',
                  borderWidth: '2px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ff0080'
                  e.currentTarget.style.color = 'white'
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(255,0,128,0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#ff0080'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                Cerrar Sesión
              </motion.button>
            )}
          </div>
        </Container>
      </header>

      {/* Contenido principal con animaciones */}
      <main className="py-4">
        <Container>
          <AnimatePresence mode="wait">
            {!isAuthenticated ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5 }}
              >
                <LoginForm />
              </motion.div>
            ) : (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.5 }}
              >
                <Dashboard />
              </motion.div>
            )}
          </AnimatePresence>
        </Container>
      </main>

      {/* Estilos personalizados */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;700&display=swap');
        
        body {
          font-family: 'Rajdhani', sans-serif;
          overflow-x: hidden;
        }
        
        /* Scrollbar personalizada */
        ::-webkit-scrollbar {
          width: 12px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.8);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #00ffff, #ff00ff);
          border-radius: 10px;
          border: 2px solid rgba(0,0,0,0.8);
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #ff00ff, #00ffff);
        }
        
        /* Efectos de neón para botones */
        .btn-neon {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .btn-neon::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }
        
        .btn-neon:hover::before {
          left: 100%;
        }
        
        /* Animación de pulso para elementos importantes */
        @keyframes pulse-neon {
          0% {
            box-shadow: 0 0 20px rgba(0,255,255,0.5);
          }
          50% {
            box-shadow: 0 0 40px rgba(255,0,255,0.7), 0 0 60px rgba(0,255,255,0.5);
          }
          100% {
            box-shadow: 0 0 20px rgba(0,255,255,0.5);
          }
        }
        
        .pulse-neon {
          animation: pulse-neon 2s infinite;
        }
        
        /* Glassmorphism para cards */
        .glass-card {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 15px;
        }
        
        /* Efecto hover para tablas */
        .table-hover tbody tr:hover {
          background: rgba(0,255,255,0.1) !important;
          transform: scale(1.01);
          transition: all 0.3s ease;
          box-shadow: 0 5px 15px rgba(0,255,255,0.3);
        }
        
        /* Inputs con estilo cyberpunk */
        .form-control:focus,
        .form-select:focus {
          background: rgba(0,0,0,0.8) !important;
          border-color: #00ffff !important;
          color: #00ffff !important;
          box-shadow: 0 0 0 0.25rem rgba(0,255,255,0.25) !important;
        }
      `}</style>
    </div>
  )
}