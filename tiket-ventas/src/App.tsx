// Aplicación de venta de tickets con diseño premium y animaciones GSAP
import { useState, useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import { Container, Row, Col, Form, Button, Card, Alert, Badge } from 'react-bootstrap'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Tilt from 'react-parallax-tilt'
import AOS from 'aos'
import 'aos/dist/aos.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import { 
  SparklesIcon, 
  TicketIcon, 
  CurrencyDollarIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CreditCardIcon,
  ShoppingCartIcon,
  StarIcon,
  FireIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/solid'

gsap.registerPlugin(ScrollTrigger)

// Configuración de precios
const ticketPrice = 5000
const coolerPrice = 2000

// URL del Google Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyxB9fgzC8d2Km8G0vr3zEl-1pBEOwnp5H09ZjRt32fJyrvoL3uzCC9kTilRxAUhY-CWw/exec'

// Imágenes de fiestas (usando URLs de Unsplash)
const partyImages = [
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745',
  'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec'
]

export default function App() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    ticketQty: 1,
    coolerQty: 0,
    paymentMethod: 'efectivo'
  })
  

  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [backgroundImage, setBackgroundImage] = useState(0)
  
  const heroRef = useRef(null)
  const formRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef(null)
  
  const total = (formData.ticketQty * ticketPrice) + (formData.coolerQty * coolerPrice)

  useEffect(() => {
    // Inicializar AOS
    AOS.init({
      duration: 1000,
      once: false,
      mirror: true
    })

    // Animación del hero con GSAP
    const ctx = gsap.context(() => {
      gsap.timeline()
        .from('.hero-title', {
          y: -100,
          opacity: 0,
          duration: 1.5,
          ease: 'bounce.out'
        })
        .from('.hero-subtitle', {
          x: -200,
          opacity: 0,
          duration: 1
        }, '-=0.5')
        .from('.hero-badge', {
          scale: 0,
          rotation: 720,
          duration: 1.5,
          ease: 'elastic.out(1, 0.5)',
          stagger: 0.2
        }, '-=0.5')
    }, heroRef)

    // Animación de partículas flotantes
    gsap.to('.floating-particle', {
      y: 'random(-20, 20)',
      x: 'random(-20, 20)',
      rotation: 'random(-180, 180)',
      duration: 'random(3, 5)',
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      stagger: {
        each: 0.2,
        from: 'random'
      }
    })

    // Cambiar imagen de fondo cada 5 segundos
    const interval = setInterval(() => {
      setBackgroundImage(prev => (prev + 1) % partyImages.length)
    }, 5000)

    return () => {
      ctx.revert()
      clearInterval(interval)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Qty') ? parseInt(value) || 0 : value
    }))
  }

  const savePurchase = async () => {
    try {
      const params = new URLSearchParams({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        ticketQty: formData.ticketQty.toString(),
        coolerQty: formData.coolerQty.toString(),
        paymentMethod: formData.paymentMethod,
        total: total.toString(),
        status: 'pendiente'
      })

      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      })

      console.log('Datos guardados en Google Sheets')
    } catch (error) {
      console.error('Error guardando en Google Sheets', error)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Animación de procesamiento
    gsap.to('.submit-button', {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1
    })

    await savePurchase()

    const message = `🎉 *NUEVA COMPRA - TIKET NOW* 🎉\n\n` +
      `👤 *Cliente:* ${formData.firstName} ${formData.lastName}\n` +
      `📱 *Teléfono:* ${formData.phone}\n` +
      `📧 *Email:* ${formData.email}\n` +
      `🎫 *Entradas:* ${formData.ticketQty}\n` +
      `🧊 *Conservadoras:* ${formData.coolerQty}\n` +
      `💳 *Método de Pago:* ${formData.paymentMethod}\n` +
      `💰 *TOTAL:* $${total.toLocaleString('es-AR')}\n\n` +
      `_Por favor, enviar comprobante de pago_`

    const whatsappUrl = `https://wa.me/5491234567890?text=${encodeURIComponent(message)}`
    
    setTimeout(() => {
      setLoading(false)
      setShowSuccess(true)
      window.open(whatsappUrl, '_blank')
      
      // Resetear formulario después de 3 segundos
      setTimeout(() => {
        setShowSuccess(false)
        setFormData({
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          ticketQty: 1,
          coolerQty: 0,
          paymentMethod: 'efectivo'
        })
      }, 3000)
    }, 1500)
  }

  return (
    <div className="app-container">
      {/* Background con imagen dinámica */}
      <div 
        className="dynamic-background"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url(${partyImages[backgroundImage]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
          transition: 'background-image 1s ease-in-out'
        }}
      />

      {/* Partículas flotantes */}
      <div className="particles-container">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="floating-particle"
            style={{
              position: 'fixed',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 30 + 10}px`,
              height: `${Math.random() * 30 + 10}px`,
              background: `radial-gradient(circle, ${['#ff006e', '#fb5607', '#ffbe0b', '#8338ec', '#3a86ff'][Math.floor(Math.random() * 5)]}, transparent)`,
              borderRadius: '50%',
              opacity: 0.3,
              pointerEvents: 'none',
              zIndex: 1
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section ref={heroRef} className="hero-section py-5 mb-5">
        <Container>
          <Row className="align-items-center min-vh-100">
            <Col lg={12} className="text-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
              >
                <h1 className="hero-title display-1 fw-bold text-white mb-4" style={{
                  textShadow: '0 0 30px rgba(255,0,110,0.5), 0 0 60px rgba(138,56,236,0.3)',
                  fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: '5px'
                }}>
                  <FireIcon className="d-inline-block me-3" style={{ width: '80px', height: '80px' }} />
                  TIKET NOW
                  <FireIcon className="d-inline-block ms-3" style={{ width: '80px', height: '80px' }} />
                </h1>
                
                <h2 className="hero-subtitle h3 text-warning mb-5" style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 300
                }}>
                  La Fiesta Más Épica del Año
                </h2>

                <div className="d-flex justify-content-center gap-3 flex-wrap mb-5">
                  <Badge className="hero-badge p-3 bg-gradient" style={{ background: 'linear-gradient(45deg, #ff006e, #8338ec)' }}>
                    <MusicalNoteIcon style={{ width: '20px', height: '20px' }} className="me-2" />
                    DJ Internacional
                  </Badge>
                  <Badge className="hero-badge p-3 bg-gradient" style={{ background: 'linear-gradient(45deg, #fb5607, #ffbe0b)' }}>
                    <StarIcon style={{ width: '20px', height: '20px' }} className="me-2" />
                    Open Bar
                  </Badge>
                  <Badge className="hero-badge p-3 bg-gradient" style={{ background: 'linear-gradient(45deg, #3a86ff, #8338ec)' }}>
                    <SparklesIcon style={{ width: '20px', height: '20px' }} className="me-2" />
                    Show en Vivo
                  </Badge>
      </div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Button
                    size="lg"
                    className="px-5 py-3"
                    style={{
                      background: 'linear-gradient(45deg, #ff006e, #8338ec)',
                      border: 'none',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 30px rgba(255,0,110,0.5)'
                    }}
                    onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    COMPRAR AHORA
                  </Button>
                </motion.div>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="features-section py-5 mb-5">
        <Container>
          <Row className="g-4">
            <Col md={4} data-aos="fade-up" data-aos-delay="100">
              <Tilt tiltMaxAngleX={20} tiltMaxAngleY={20}>
                <Card className="h-100 bg-dark text-white border-0" style={{
                  background: 'linear-gradient(135deg, rgba(255,0,110,0.1), rgba(138,56,236,0.1))',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 32px rgba(255,0,110,0.3)'
                }}>
                  <Card.Body className="text-center p-5">
                    <TicketIcon style={{ width: '60px', height: '60px', color: '#ff006e' }} className="mb-3" />
                    <h4>Entrada General</h4>
                    <h2 className="text-warning">${ticketPrice.toLocaleString('es-AR')}</h2>
                    <p>Acceso completo al evento</p>
                  </Card.Body>
                </Card>
              </Tilt>
            </Col>
            
            <Col md={4} data-aos="fade-up" data-aos-delay="200">
              <Tilt tiltMaxAngleX={20} tiltMaxAngleY={20}>
                <Card className="h-100 bg-dark text-white border-0" style={{
                  background: 'linear-gradient(135deg, rgba(251,86,7,0.1), rgba(255,190,11,0.1))',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 32px rgba(251,86,7,0.3)'
                }}>
                  <Card.Body className="text-center p-5">
                    <SparklesIcon style={{ width: '60px', height: '60px', color: '#fb5607' }} className="mb-3" />
                    <h4>Conservadora VIP</h4>
                    <h2 className="text-warning">${coolerPrice.toLocaleString('es-AR')}</h2>
                    <p>Mesa exclusiva con servicio</p>
                  </Card.Body>
                </Card>
              </Tilt>
            </Col>
            
            <Col md={4} data-aos="fade-up" data-aos-delay="300">
              <Tilt tiltMaxAngleX={20} tiltMaxAngleY={20}>
                <Card className="h-100 bg-dark text-white border-0" style={{
                  background: 'linear-gradient(135deg, rgba(58,134,255,0.1), rgba(138,56,236,0.1))',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 32px rgba(58,134,255,0.3)'
                }}>
                  <Card.Body className="text-center p-5">
                    <StarIcon style={{ width: '60px', height: '60px', color: '#3a86ff' }} className="mb-3" />
                    <h4>Experiencia Premium</h4>
                    <h2 className="text-warning">∞</h2>
                    <p>Una noche inolvidable</p>
                  </Card.Body>
                </Card>
              </Tilt>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Formulario de Compra */}
      <section ref={formRef} className="form-section py-5">
        <Container>
          <Row className="justify-content-center">
            <Col lg={8}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <Card className="shadow-lg border-0" style={{
                  background: 'rgba(0,0,0,0.8)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '20px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: 'linear-gradient(45deg, #ff006e, #8338ec)',
                    padding: '3px'
                  }}>
                    <Card.Body className="p-5" style={{ background: 'rgba(0,0,0,0.95)' }}>
                      <h2 className="text-center mb-5 text-white" style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '3rem',
                        letterSpacing: '3px',
                        textShadow: '0 0 20px rgba(255,0,110,0.5)'
                      }}>
                        <ShoppingCartIcon style={{ width: '50px', height: '50px' }} className="me-3" />
                        COMPRA TUS TICKETS
                      </h2>

                      <Form onSubmit={handleSubmit}>
                        <Row className="g-4">
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="text-white d-flex align-items-center">
                                <UserIcon style={{ width: '20px', height: '20px' }} className="me-2" />
                                Nombre
                              </Form.Label>
                              <Form.Control
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                required
                                className="bg-dark text-white border-secondary"
                                style={{ borderRadius: '10px' }}
                              />
                            </Form.Group>
                          </Col>

                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="text-white d-flex align-items-center">
                                <UserIcon style={{ width: '20px', height: '20px' }} className="me-2" />
                                Apellido
                              </Form.Label>
                              <Form.Control
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                required
                                className="bg-dark text-white border-secondary"
                                style={{ borderRadius: '10px' }}
                              />
                            </Form.Group>
                          </Col>

                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="text-white d-flex align-items-center">
                                <PhoneIcon style={{ width: '20px', height: '20px' }} className="me-2" />
                                Teléfono
                              </Form.Label>
                              <Form.Control
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                required
                                className="bg-dark text-white border-secondary"
                                style={{ borderRadius: '10px' }}
                              />
                            </Form.Group>
                          </Col>

                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="text-white d-flex align-items-center">
                                <EnvelopeIcon style={{ width: '20px', height: '20px' }} className="me-2" />
                                Email
                              </Form.Label>
                              <Form.Control
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                className="bg-dark text-white border-secondary"
                                style={{ borderRadius: '10px' }}
                              />
                            </Form.Group>
                          </Col>

                          <Col md={4}>
                            <Form.Group>
                              <Form.Label className="text-white d-flex align-items-center">
                                <TicketIcon style={{ width: '20px', height: '20px' }} className="me-2" />
                                Cantidad de Entradas
                              </Form.Label>
                              <Form.Control
                                type="number"
                                name="ticketQty"
                                value={formData.ticketQty}
                                onChange={handleInputChange}
                                min="1"
                                required
                                className="bg-dark text-white border-secondary"
                                style={{ borderRadius: '10px' }}
                              />
                            </Form.Group>
                          </Col>

                          <Col md={4}>
                            <Form.Group>
                              <Form.Label className="text-white d-flex align-items-center">
                                <SparklesIcon style={{ width: '20px', height: '20px' }} className="me-2" />
                                Conservadoras VIP
                              </Form.Label>
                              <Form.Control
                                type="number"
                                name="coolerQty"
                                value={formData.coolerQty}
                                onChange={handleInputChange}
                                min="0"
                                className="bg-dark text-white border-secondary"
                                style={{ borderRadius: '10px' }}
                              />
                            </Form.Group>
                          </Col>

                          <Col md={4}>
                            <Form.Group>
                              <Form.Label className="text-white d-flex align-items-center">
                                <CreditCardIcon style={{ width: '20px', height: '20px' }} className="me-2" />
                                Método de Pago
                              </Form.Label>
                              <Form.Select
                                name="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={handleInputChange}
                                className="bg-dark text-white border-secondary"
                                style={{ borderRadius: '10px' }}
                              >
                                <option value="efectivo">Efectivo</option>
                                <option value="transferencia">Transferencia</option>
                                <option value="mercadopago">MercadoPago</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        </Row>

                        {/* Total animado */}
                        <motion.div
                          className="text-center my-5 p-4 rounded"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255,0,110,0.1), rgba(138,56,236,0.1))',
                            border: '2px solid rgba(255,0,110,0.5)'
                          }}
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <h3 className="text-white mb-0">
                            <CurrencyDollarIcon style={{ width: '40px', height: '40px' }} className="me-2" />
                            TOTAL A PAGAR
                          </h3>
                          <h1 className="text-warning display-3 fw-bold">
                            ${total.toLocaleString('es-AR')}
                          </h1>
                        </motion.div>

                        <div className="d-grid">
                          <Button
                            type="submit"
                            size="lg"
                            disabled={loading}
                            className="submit-button py-3"
                            style={{
                              background: loading 
                                ? 'linear-gradient(45deg, #666, #999)' 
                                : 'linear-gradient(45deg, #ff006e, #8338ec)',
                              border: 'none',
                              fontSize: '1.5rem',
                              fontWeight: 'bold',
                              borderRadius: '15px',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {loading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Procesando...
                              </>
                            ) : (
                              <>
                                <ShoppingCartIcon style={{ width: '30px', height: '30px' }} className="me-2" />
                                FINALIZAR COMPRA
                              </>
                            )}
                          </Button>
                        </div>
                      </Form>
                    </Card.Body>
                  </div>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Success Alert */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999
            }}
          >
            <Alert variant="success" className="shadow-lg p-5 text-center" style={{
              background: 'linear-gradient(45deg, #00f5ff, #ff00ff)',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              borderRadius: '20px'
            }}>
              <h2>¡Compra Exitosa! 🎉</h2>
              <p>Redirigiendo a WhatsApp...</p>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@300;400;700&display=swap');
        
        body {
          overflow-x: hidden;
          background: #000;
        }
        
        .app-container {
          min-height: 100vh;
          position: relative;
        }
        
        .particles-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 1;
        }
        
        .form-control:focus,
        .form-select:focus {
          background-color: #1a1a1a !important;
          border-color: #ff006e !important;
          color: white !important;
          box-shadow: 0 0 0 0.25rem rgba(255, 0, 110, 0.25) !important;
        }
        
        .submit-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(255, 0, 110, 0.6) !important;
        }
        
        /* Scrollbar personalizada */
        ::-webkit-scrollbar {
          width: 10px;
        }
        
        ::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #ff006e, #8338ec);
          border-radius: 5px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #ff006e, #fb5607);
        }
      `}</style>
    </div>
  )
}