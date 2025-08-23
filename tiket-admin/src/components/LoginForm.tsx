// Formulario de login con diseño premium
import { useState } from 'react'
import { Card, Form, Button, Alert, InputGroup } from 'react-bootstrap'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { LockClosedIcon, UserIcon, SparklesIcon } from '@heroicons/react/24/solid'
import Tilt from 'react-parallax-tilt'

export function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simular delay para efecto visual
    setTimeout(() => {
      const success = login(username, password)
      if (!success) {
        setError('Credenciales inválidas')
      }
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
        style={{ width: '100%', maxWidth: '450px' }}
      >
        <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} perspective={1000}>
          <Card className="border-0 shadow-lg" style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.9), rgba(30,0,50,0.9))',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            overflow: 'hidden'
          }}>
            {/* Borde con gradiente animado */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #00ffff, #ff00ff, #ffff00, #00ffff)',
              backgroundSize: '300% 100%',
              animation: 'gradient-shift 3s ease infinite'
            }} />

            <Card.Body className="p-5">
              {/* Icono animado */}
              <motion.div
                className="text-center mb-4"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                }}
              >
                <div style={{
                  width: '100px',
                  height: '100px',
                  margin: '0 auto',
                  background: 'linear-gradient(45deg, #ff006e, #8338ec)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 40px rgba(255,0,110,0.45)'
                }}>
                  <SparklesIcon style={{ width: '50px', height: '50px', color: 'white' }} />
                </div>
              </motion.div>

              <h2 className="text-center mb-1 text-white" style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontWeight: 700,
                letterSpacing: '5px',
                fontSize: '2.4rem',
                textTransform: 'uppercase',
                textShadow: '0 0 10px rgba(131,56,236,0.8), 0 0 20px rgba(131,56,236,0.6), 0 0 30px rgba(131,56,236,0.4), 0 0 40px rgba(131,56,236,0.2)'
              }}>
                TICKETEANDO
              </h2>
              <div className="text-center mb-4" style={{
                fontFamily: "'Montserrat', sans-serif",
                color: 'rgba(255,255,255,0.85)',
                letterSpacing: '2px'
              }}>
                ADMIN
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                  <InputGroup>
                    <InputGroup.Text style={{
                      background: 'rgba(131,56,236,0.15)',
                      border: '1px solid rgba(131,56,236,0.35)',
                      color: '#ffffff'
                    }}>
                      <UserIcon style={{ width: '20px', height: '20px' }} />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      style={{
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(131,56,236,0.35)',
                        color: 'white',
                        fontSize: '1.05rem'
                      }}
                      className="custom-input"
                    />
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-4">
                  <InputGroup>
                    <InputGroup.Text style={{
                      background: 'rgba(255,0,110,0.15)',
                      border: '1px solid rgba(255,0,110,0.35)',
                      color: '#ffffff'
                    }}>
                      <LockClosedIcon style={{ width: '20px', height: '20px' }} />
                    </InputGroup.Text>
                    <Form.Control
                      type="password"
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,0,110,0.35)',
                        color: 'white',
                        fontSize: '1.05rem'
                      }}
                      className="custom-input"
                    />
                  </InputGroup>
                </Form.Group>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Alert variant="danger" className="mb-4" style={{
                      background: 'rgba(255,0,0,0.2)',
                      border: '1px solid rgba(255,0,0,0.5)',
                      color: '#ff6b6b'
                    }}>
                      {error}
                    </Alert>
                  </motion.div>
                )}

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    size="lg"
                    className="w-100 btn-neon"
                    disabled={loading}
                    style={{
                      background: loading 
                        ? 'linear-gradient(45deg, #666, #999)'
                        : 'linear-gradient(45deg, #ff006e, #8338ec)',
                      border: 'none',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      padding: '12px',
                      borderRadius: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                      boxShadow: '0 4px 15px rgba(255,0,110,0.35)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <LockClosedIcon style={{ width: '22px', height: '22px' }} className="me-2" />
                        Ingresar
                      </>
                    )}
                  </Button>
                </motion.div>

                <div className="text-center mt-4">
                  <small className="text-muted" style={{ fontFamily: "'Montserrat', sans-serif", color: 'rgba(255,255,255,0.6)' }}>
                    Credenciales: admin/admin123 o super/super123
                  </small>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Tilt>

        {/* Estilos adicionales */}
        <style>{`
          @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          .custom-input::placeholder {
            color: rgba(255,255,255,0.5);
          }
          .custom-input:focus {
            background: rgba(0,0,0,0.8) !important;
            color: white !important;
            box-shadow: 0 0 0 0.2rem rgba(131,56,236,0.35) !important;
            border-color: #8338ec !important;
          }
        `}</style>
      </motion.div>
    </div>
  )
}