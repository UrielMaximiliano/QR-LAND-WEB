// Aplicación de venta de tickets con diseño premium y animaciones GSAP - Optimizada
import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { Container, Row, Col, Form, Button, Card, Alert, Badge, Spinner } from 'react-bootstrap'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Tilt from 'react-parallax-tilt'
import AOS from 'aos'
import 'aos/dist/aos.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import { 
  SparklesIcon, 
  UserIcon,
  ShoppingCartIcon,
  StarIcon,
  FireIcon,
  MusicalNoteIcon,
  CalendarDaysIcon,
  MapPinIcon
} from '@heroicons/react/24/solid'

import { GoogleSheetsEventService, type EventData } from './services/EventService';

gsap.registerPlugin(ScrollTrigger)

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

// Componente principal memoizado para máximo rendimiento
const App = memo(function App() {
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [backgroundImage, setBackgroundImage] = useState(0)
  const [events, setEvents] = useState<EventData[]>([]);
  const [expandedEventId, setExpandedEventId] = useState<string>('');
  const [eventForms, setEventForms] = useState<{[key: string]: any}>({});
  
  const heroRef = useRef(null)

  // Función para obtener form data de un evento específico
  const getEventFormData = (eventId: string) => {
    return eventForms[eventId] || {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      ticketQty: 1,
      coolerQty: 0,
      paymentMethod: 'efectivo'
    };
  }

  // Función para actualizar form data de un evento específico - Optimizada
  const updateEventFormData = useCallback((eventId: string, field: string, value: any) => {
    setEventForms(prev => ({
      ...prev,
      [eventId]: {
        ...getEventFormData(eventId),
        [field]: value
      }
    }));
  }, [getEventFormData])

  // Función para calcular total de un evento específico - Memoizada
  const calculateTotal = useCallback((eventId: string) => {
    const event = events.find(e => e.id === eventId);
    const formData = getEventFormData(eventId);
    const ticketPrice = event?.ticketPrice || 5000;
    const vipPrice = event?.vipPrice || 2000;
    return (formData.ticketQty * ticketPrice) + (formData.coolerQty * vipPrice);
  }, [events, eventForms]);

  // Fetch eventos con manejo optimizado de errores
  useEffect(() => {
    const loadEventsWithRetry = async (retries = 3) => {
      try {
        const service = new GoogleSheetsEventService();
        const eventsData = await service.getAllEvents();
        setEvents(eventsData);
      } catch (error) {
        console.error('Error cargando eventos:', error);
        if (retries > 0) {
          console.log(`🔄 Reintentando... (${retries} intentos restantes)`);
          setTimeout(() => loadEventsWithRetry(retries - 1), 2000);
        }
      }
    };

    loadEventsWithRetry();
  }, []);

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

  // Función para manejar cambios en formularios de eventos específicos - Optimizada
  const handleEventInputChange = useCallback((eventId: string, field: string, value: any) => {
    updateEventFormData(eventId, field, field.includes('Qty') ? parseInt(value) || 0 : value);
  }, [updateEventFormData])

  const savePurchase = async (eventId: string) => {
    try {
          const event = events.find(e => e.id === eventId);
    const eventFormData = getEventFormData(eventId);
    const total = calculateTotal(eventId);

      const params = new URLSearchParams({
        firstName: eventFormData.firstName,
        lastName: eventFormData.lastName,
        phone: eventFormData.phone,
        email: eventFormData.email,
        ticketQty: eventFormData.ticketQty.toString(),
        coolerQty: eventFormData.coolerQty.toString(),
        paymentMethod: eventFormData.paymentMethod,
        total: total.toString(),
        status: 'pendiente',
        eventId: eventId,
        eventName: event?.name || 'Sin evento'
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

  const handleEventSubmit = useCallback(async (eventId: string) => {
    const eventFormData = getEventFormData(eventId);
    
    // Validaciones optimizadas
    if (!eventFormData.firstName.trim() || !eventFormData.lastName.trim() || 
        !eventFormData.phone.trim() || !eventFormData.email.trim()) {
      alert('⚠️ Por favor completa todos los campos obligatorios');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eventFormData.email)) {
      alert('⚠️ Por favor ingresa un email válido');
      return;
    }

    setLoading(true)

    // Animación de procesamiento optimizada
    gsap.to(`#submit-button-${eventId}`, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1
    })

    await savePurchase(eventId)

    const event = events.find(e => e.id === eventId);
    const purchaseData = getEventFormData(eventId);
    const total = calculateTotal(eventId);

    const message = `🎉 *NUEVA COMPRA - ${event?.name || 'Evento'}* 🎉\n\n` +
      `👤 *Cliente:* ${purchaseData.firstName} ${purchaseData.lastName}\n` +
      `📱 *Teléfono:* ${purchaseData.phone}\n` +
      `📧 *Email:* ${purchaseData.email}\n` +
      `🎫 *Entradas:* ${purchaseData.ticketQty}\n` +
      `🧊 *Conservadoras:* ${purchaseData.coolerQty}\n` +
      `💳 *Método de Pago:* ${purchaseData.paymentMethod}\n` +
      `💰 *TOTAL:* $${total.toLocaleString('es-AR')}\n\n` +
      `_Por favor, enviar comprobante de pago_`

    const whatsappUrl = `https://wa.me/5491234567890?text=${encodeURIComponent(message)}`
    
    setTimeout(() => {
      setLoading(false)
      setShowSuccess(true)
      window.open(whatsappUrl, '_blank')
      
      // Resetear formulario del evento después de 3 segundos
      setTimeout(() => {
        setShowSuccess(false)
        setEventForms(prev => ({
          ...prev,
          [eventId]: {
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            ticketQty: 1,
            coolerQty: 0,
            paymentMethod: 'efectivo'
          }
        }));
        setExpandedEventId(''); // Cerrar el formulario
      }, 3000)
    }, 1500)
  }, [events, getEventFormData, calculateTotal, savePurchase])

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

      {/* Hero Section - Responsive */}
      <section ref={heroRef} className="hero-section py-4 py-md-5 mb-4 mb-md-5">
        <Container>
          <Row className="align-items-center min-vh-100">
            <Col lg={12} className="text-center px-3">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
              >
                <h1 className="hero-title display-2 display-md-1 fw-bold text-white mb-3 mb-md-4" style={{
                  textShadow: '0 0 30px rgba(255,0,110,0.5), 0 0 60px rgba(138,56,236,0.3)',
                  fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: '3px',
                  fontSize: 'clamp(2.5rem, 8vw, 5rem)'
                }}>
                  <FireIcon className="d-inline-block me-2 me-md-3" style={{ width: 'clamp(40px, 10vw, 80px)', height: 'clamp(40px, 10vw, 80px)' }} />
                  TIKET NOW
                  <FireIcon className="d-inline-block ms-2 ms-md-3" style={{ width: 'clamp(40px, 10vw, 80px)', height: 'clamp(40px, 10vw, 80px)' }} />
                </h1>
                
                <h2 className="hero-subtitle h4 h-md-3 text-warning mb-4 mb-md-5" style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 300,
                  fontSize: 'clamp(1.2rem, 4vw, 1.75rem)'
                }}>
                  Elige tu Evento Favorito
                </h2>

                <div className="d-flex justify-content-center gap-2 gap-md-3 flex-wrap mb-4 mb-md-5">
                  <Badge className="hero-badge p-3 bg-gradient" style={{ background: 'linear-gradient(45deg, #ff006e, #8338ec)' }}>
                    <MusicalNoteIcon style={{ width: '20px', height: '20px' }} className="me-2" />
                    Múltiples Eventos
                  </Badge>
                  <Badge className="hero-badge p-3 bg-gradient" style={{ background: 'linear-gradient(45deg, #fb5607, #ffbe0b)' }}>
                    <StarIcon style={{ width: '20px', height: '20px' }} className="me-2" />
                    Precios Dinámicos
                  </Badge>
                  <Badge className="hero-badge p-3 bg-gradient" style={{ background: 'linear-gradient(45deg, #3a86ff, #8338ec)' }}>
                    <SparklesIcon style={{ width: '20px', height: '20px' }} className="me-2" />
                    Experiencias Únicas
                  </Badge>
                </div>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Eventos Disponibles - Responsive */}
      <section className="events-section py-4 py-md-5 mb-4 mb-md-5">
        <Container>
          <h2 className="text-center text-white mb-4 mb-md-5" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)' }}>
            Eventos Disponibles
          </h2>
          {events.length === 0 ? (
            <div className="text-center py-5">
              <CalendarDaysIcon style={{ width: '80px', height: '80px', color: '#666' }} className="mb-4" />
              <h3 className="text-white mb-3">No hay eventos disponibles</h3>
              <p className="text-muted">Los eventos creados por los administradores aparecerán aquí.</p>
            </div>
          ) : (
            <Row className="g-3 g-md-4">
              {events.map(event => (
                <Col xl={4} lg={6} md={6} sm={12} key={event.id}>
                  <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10}>
                    <Card 
                      className="h-100 bg-dark text-white border-0" 
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,0,110,0.1), rgba(138,56,236,0.1))',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 8px 32px rgba(255,0,110,0.3)',
                        borderRadius: '15px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {event.image && (
                        <Card.Img 
                          variant="top" 
                          src={event.image} 
                          loading="lazy"
                          alt={`Imagen de ${event.name}`}
                          style={{ 
                            height: 'clamp(150px, 25vw, 200px)', 
                            objectFit: 'cover', 
                            borderRadius: '15px 15px 0 0',
                            transition: 'transform 0.3s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                      )}
                      <Card.Body className="p-3 p-md-4">
                        <Card.Title className="mb-3" style={{ 
                          fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', 
                          fontWeight: 'bold' 
                        }}>
                          {event.name}
                        </Card.Title>
                        
                        <div className="mb-3">
                          <Card.Text className="mb-1">
                            <CalendarDaysIcon style={{ width: '16px', height: '16px' }} className="me-2" />
                            <strong>{event.date} - {event.hour}</strong>
                          </Card.Text>
                          <Card.Text className="mb-2">
                            <MapPinIcon style={{ width: '16px', height: '16px' }} className="me-2" />
                            {event.location}
                          </Card.Text>
                        </div>

                        <Card.Text className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                          {event.description}
                        </Card.Text>

                        <div className="row g-2 mb-3">
                          <div className="col-6">
                            <div className="text-center p-2 bg-dark rounded">
                              <small className="text-muted d-block">Entrada General</small>
                              <strong className="text-info">${event.ticketPrice.toLocaleString('es-AR')}</strong>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="text-center p-2 bg-dark rounded">
                              <small className="text-muted d-block">VIP</small>
                              <strong className="text-warning">${event.vipPrice.toLocaleString('es-AR')}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="text-center mb-3">
                          <small className="text-muted">Capacidad: </small>
                          <strong>{event.capacity} personas</strong>
                        </div>

                        {/* Botón para expandir/contraer formulario */}
                        <div className="d-grid mb-3">
                          <Button
                            size="lg"
                            onClick={() => setExpandedEventId(expandedEventId === event.id ? '' : event.id)}
                            style={{
                              background: expandedEventId === event.id 
                                ? 'linear-gradient(45deg, #28a745, #20c997)' 
                                : 'linear-gradient(45deg, #ff006e, #8338ec)',
                              border: 'none',
                              fontWeight: 'bold',
                              borderRadius: '10px'
                            }}
                          >
                            <ShoppingCartIcon style={{ width: '20px', height: '20px' }} className="me-2" />
                            {expandedEventId === event.id ? 'Cerrar Formulario' : 'Comprar Tickets'}
                          </Button>
                        </div>

                        {/* Formulario expandible */}
                        <AnimatePresence>
                          {expandedEventId === event.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div className="border-top border-secondary pt-4 mt-3">
                                <h6 className="text-center mb-3">
                                  <UserIcon style={{ width: '20px', height: '20px' }} className="me-2" />
                                  Datos del Comprador
                                </h6>
                                
                                                                 <Row className="g-2 g-md-3">
                                   <Col lg={6} md={12} sm={12}>
                                    <Form.Group>
                                      <Form.Label>Nombre</Form.Label>
                                      <Form.Control
                                        type="text"
                                        value={getEventFormData(event.id).firstName}
                                        onChange={(e) => handleEventInputChange(event.id, 'firstName', e.target.value)}
                                        required
                                        className="bg-dark text-white border-secondary"
                                        placeholder="Tu nombre"
                                      />
                                    </Form.Group>
                                  </Col>
                                                                     <Col lg={6} md={12} sm={12}>
                                     <Form.Group>
                                       <Form.Label>Apellido</Form.Label>
                                      <Form.Control
                                        type="text"
                                        value={getEventFormData(event.id).lastName}
                                        onChange={(e) => handleEventInputChange(event.id, 'lastName', e.target.value)}
                                        required
                                        className="bg-dark text-white border-secondary"
                                        placeholder="Tu apellido"
                                      />
                                    </Form.Group>
                                  </Col>
                                                                     <Col lg={6} md={12} sm={12}>
                                     <Form.Group>
                                       <Form.Label>Teléfono</Form.Label>
                                      <Form.Control
                                        type="tel"
                                        value={getEventFormData(event.id).phone}
                                        onChange={(e) => handleEventInputChange(event.id, 'phone', e.target.value)}
                                        required
                                        className="bg-dark text-white border-secondary"
                                        placeholder="Tu teléfono"
                                      />
                                    </Form.Group>
                                  </Col>
                                                                     <Col lg={6} md={12} sm={12}>
                                     <Form.Group>
                                       <Form.Label>Email</Form.Label>
                                      <Form.Control
                                        type="email"
                                        value={getEventFormData(event.id).email}
                                        onChange={(e) => handleEventInputChange(event.id, 'email', e.target.value)}
                                        required
                                        className="bg-dark text-white border-secondary"
                                        placeholder="tu@email.com"
                                      />
                                    </Form.Group>
                                  </Col>
                                                                     <Col lg={4} md={6} sm={12}>
                                     <Form.Group>
                                       <Form.Label>Entradas</Form.Label>
                                      <Form.Control
                                        type="number"
                                        value={getEventFormData(event.id).ticketQty}
                                        onChange={(e) => handleEventInputChange(event.id, 'ticketQty', e.target.value)}
                                        min="1"
                                        required
                                        className="bg-dark text-white border-secondary"
                                      />
                                    </Form.Group>
                                  </Col>
                                                                     <Col lg={4} md={6} sm={12}>
                                     <Form.Group>
                                       <Form.Label>VIP</Form.Label>
                                      <Form.Control
                                        type="number"
                                        value={getEventFormData(event.id).coolerQty}
                                        onChange={(e) => handleEventInputChange(event.id, 'coolerQty', e.target.value)}
                                        min="0"
                                        className="bg-dark text-white border-secondary"
                                      />
                                    </Form.Group>
                                  </Col>
                                                                     <Col lg={4} md={12} sm={12}>
                                     <Form.Group>
                                       <Form.Label>Pago</Form.Label>
                                      <Form.Select
                                        value={getEventFormData(event.id).paymentMethod}
                                        onChange={(e) => handleEventInputChange(event.id, 'paymentMethod', e.target.value)}
                                        className="bg-dark text-white border-secondary"
                                      >
                                        <option value="efectivo">Efectivo</option>
                                        <option value="transferencia">Transferencia</option>
                                        <option value="mercadopago">MercadoPago</option>
                                      </Form.Select>
                                    </Form.Group>
                                  </Col>
                                </Row>

                                {/* Total */}
                                <div className="text-center my-4 p-3 rounded" style={{
                                  background: 'linear-gradient(135deg, rgba(255,0,110,0.1), rgba(138,56,236,0.1))',
                                  border: '2px solid rgba(255,0,110,0.5)'
                                }}>
                                  <h5 className="text-white mb-0">TOTAL A PAGAR</h5>
                                  <h3 className="text-warning mb-0">${calculateTotal(event.id).toLocaleString('es-AR')}</h3>
                                </div>

                                {/* Botón de compra */}
                                <div className="d-grid">
                                  <Button
                                    id={`submit-button-${event.id}`}
                                    onClick={() => handleEventSubmit(event.id)}
                                    disabled={loading}
                                    size="lg"
                                    style={{
                                      background: loading 
                                        ? 'linear-gradient(45deg, #666, #999)' 
                                        : 'linear-gradient(45deg, #ff006e, #8338ec)',
                                      border: 'none',
                                      fontWeight: 'bold',
                                      borderRadius: '10px'
                                    }}
                                  >
                                    {loading ? (
                                      <>
                                        <Spinner size="sm" className="me-2" />
                                        Procesando...
                                      </>
                                    ) : (
                                      <>
                                        <ShoppingCartIcon style={{ width: '20px', height: '20px' }} className="me-2" />
                                        FINALIZAR COMPRA
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card.Body>
                    </Card>
                  </Tilt>
                </Col>
              ))}
            </Row>
          )}
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
        
        /* Responsive Styles */
        @media (max-width: 768px) {
          .hero-section {
            min-height: 70vh !important;
          }
          
          .particles-container {
            display: none; /* Ocultar partículas en móviles para mejor performance */
          }
          
          .hero-badge {
            padding: 0.5rem 1rem !important;
            font-size: 0.8rem !important;
          }
          
          .card-body {
            padding: 1rem !important;
          }
          
          .table-responsive {
            font-size: 0.85rem;
          }
        }
        
        @media (max-width: 576px) {
          .hero-section {
            min-height: 60vh !important;
            padding: 2rem 0 !important;
          }
          
          .events-section {
            padding: 2rem 0 !important;
          }
          
          .btn {
            font-size: 0.9rem !important;
          }
          
          .card-title {
            font-size: 1.1rem !important;
          }
        }
      `}</style>
    </div>
  )
})

export default App