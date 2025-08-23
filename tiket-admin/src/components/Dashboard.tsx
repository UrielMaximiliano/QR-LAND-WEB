// Dashboard con diseño premium y gráficos - Optimizado para máximo rendimiento
import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { Row, Col, Card, Badge, Spinner, Alert, Table, Button, Modal, Form } from 'react-bootstrap'
import { motion } from 'framer-motion'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement } from 'chart.js'
import { Doughnut, Line } from 'react-chartjs-2'
import type { Purchase, Event } from '../types'
import { GoogleSheetsPurchaseService } from '../services/PurchaseService'
import { GoogleSheetsEventService } from '../services/EventService'
import { QuickChartQRService } from '../services/QRService'
import { WaMeWhatsAppService } from '../services/WhatsAppService'
import Tilt from 'react-parallax-tilt'
import { 
  CurrencyDollarIcon, 
  TicketIcon, 
  UserGroupIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  CalendarDaysIcon,
  MapPinIcon,
  PhotoIcon,
  PlusIcon
} from '@heroicons/react/24/solid'
import { useAuth } from '../contexts/AuthContext'



ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement)

// Plugin para fondo oscuro en áreas de gráficos
const darkChartBackgroundPlugin = {
  id: 'darkBackground',
  beforeDraw: (chart: any, _args: any, options: any) => {
    const { ctx, chartArea } = chart
    if (!chartArea) return
    const { left, top, width, height } = chartArea
    ctx.save()
    ctx.fillStyle = (options && options.color) || 'rgba(20,20,20,0.85)'
    ctx.fillRect(left, top, width, height)
    ctx.restore()
  }
}
ChartJS.register(darkChartBackgroundPlugin as any)

// Componente memoizado para evitar re-renders innecesarios
export const Dashboard = memo(function Dashboard() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendingQR, setSendingQR] = useState<number | null>(null)
  const { user } = useAuth()
  
  // Estados para Event Manager
  const [events, setEvents] = useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [showEventModal, setShowEventModal] = useState(false)
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null)
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('all') // Filtro por evento
  const [newEvent, setNewEvent] = useState({
    name: '',
    date: '',
    hour: '',
    description: '',
    location: '',
    image: '',
    ticketPrice: 0,
    vipPrice: 0,
    capacity: 0,
    createdBy: 'admin', // TODO: usar usuario actual cuando implementemos auth
    status: 'active' as 'active' | 'inactive'
  })
  
  // IDs del Google Sheet
  const SHEET_ID = '1cGfDtuuKPHmYcrVf6rf3DXiege2TmanwaimRKy5E53c'
  const SHEET_NAME = 'Hoja 1'

  const purchaseService = new GoogleSheetsPurchaseService(SHEET_ID, SHEET_NAME)
  const qrService = new QuickChartQRService()
  const whatsappService = new WaMeWhatsAppService()
  const eventService = new GoogleSheetsEventService(SHEET_ID)





  useEffect(() => {
    loadPurchases()
    loadEvents()
  }, [])



  const loadPurchases = async () => {
    try {
      setLoading(true)
      const data = await purchaseService.getAllPurchases()
      setPurchases(data)
      setError(null)
    } catch (err) {
      setError('Error cargando las compras. Verifica que el Google Sheet sea público.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const confirmAndSend = async (purchase: Purchase, rowNumber?: number) => {
    setSendingQR(rowNumber ?? 0)
    
    try {
      const qrCodes = qrService.generateTicketQRs(purchase)
      whatsappService.sendQRCodes(purchase, qrCodes)
    } catch (err) {
      console.error('Error enviando QRs:', err)
    } finally {
      setSendingQR(null)
    }
  }

  // Funciones para Event Manager - Optimizadas con useCallback
  const loadEvents = useCallback(async () => {
    try {
      setEventsLoading(true)
      const data = await eventService.getAllEvents()
      // Siempre scoping por owner
      const scoped = user ? data.filter(e => e.createdBy === user.username) : []
      setEvents(scoped)
    } catch (err) {
      console.error('Error cargando eventos:', err)
      setError('Error cargando eventos. Verifica la conexión.')
    } finally {
      setEventsLoading(false)
    }
  }, [eventService, user])

  const handleCreateEvent = useCallback(async () => {
    try {
      const createdPayload = { ...newEvent, createdBy: user?.username ?? 'admin' }
      const created = await eventService.createEvent(createdPayload as any)
      setEvents(prev => [created, ...prev])
      setShowEventModal(false)
      resetEventForm()
      setError(null)
    } catch (err) {
      console.error('Error creando evento:', err)
      setError('Error creando evento. Inténtalo de nuevo.')
    }
  }, [eventService, newEvent, user])

  const handleUpdateEvent = useCallback(async () => {
    if (!eventToEdit) return
    
    try {
      const updated = { ...eventToEdit, ...newEvent }
      await eventService.updateEvent(updated)
      setEvents(prev => prev.map(e => e.id === eventToEdit.id ? updated : e))
      setShowEventModal(false)
      resetEventForm()
      setError(null)
    } catch (err) {
      console.error('Error actualizando evento:', err)
      setError('Error actualizando evento. Inténtalo de nuevo.')
    }
  }, [eventService, eventToEdit, newEvent])

  const handleDeleteEvent = useCallback(async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este evento?')) return
    
    try {
      await eventService.deleteEvent(id)
      setEvents(prev => prev.filter(e => e.id !== id))
      setError(null)
    } catch (err) {
      console.error('Error eliminando evento:', err)
      setError('Error eliminando evento. Inténtalo de nuevo.')
    }
  }, [eventService])

  const resetEventForm = useCallback(() => {
    setNewEvent({
      name: '',
      date: '',
      hour: '',
      description: '',
      location: '',
      image: '',
      ticketPrice: 0,
      vipPrice: 0,
      capacity: 0,
      createdBy: 'admin',
      status: 'active'
    })
    setEventToEdit(null)
  }, [])

  const openEditModal = useCallback((event: Event) => {
    setEventToEdit(event)
    setNewEvent({
      name: event.name,
      date: event.date,
      hour: event.hour,
      description: event.description,
      location: event.location,
      image: event.image,
      ticketPrice: event.ticketPrice,
      vipPrice: event.vipPrice,
      capacity: event.capacity,
      createdBy: event.createdBy,
      status: event.status
    })
    setShowEventModal(true)
  }, [])



  // Base de compras según scope del usuario
  const scopedPurchases = useMemo(() => {
    if (user) {
      const myEventIds = new Set(events.filter(e => e.createdBy === user.username).map(e => e.id))
      return purchases.filter(p => p.eventId && myEventIds.has(p.eventId))
    }
    return []
  }, [purchases, events, user])

  // Filtrar compras por evento seleccionado
  const filteredPurchases = useMemo(() => {
    const base = scopedPurchases
    if (selectedEventFilter === 'all') return base;
    return base.filter(p => p.eventId === selectedEventFilter);
  }, [scopedPurchases, selectedEventFilter]);

  // Cálculos para estadísticas - Memoizados y filtrados por evento
  const statistics = useMemo(() => {
    const relevantPurchases = filteredPurchases;
    const totalRevenue = relevantPurchases.reduce((sum, p) => sum + p.total, 0)
    const totalTickets = relevantPurchases.reduce((sum, p) => sum + p.ticketQty, 0)
    const totalCoolers = relevantPurchases.reduce((sum, p) => sum + p.coolerQty, 0)
    const pendingCount = relevantPurchases.filter(p => p.status === 'Pendiente').length
    const confirmedCount = relevantPurchases.filter(p => p.status === 'Confirmado').length
    
    return {
      totalRevenue,
      totalTickets,
      totalCoolers,
      pendingCount,
      confirmedCount,
      totalPurchases: relevantPurchases.length
    }
  }, [filteredPurchases])



  // Datos para gráficos - Memoizados y filtrados por evento
  const chartData = useMemo(() => {
    const relevantPurchases = filteredPurchases;
    const paymentMethodData = {
      labels: ['Efectivo', 'Transferencia', 'MercadoPago'],
      datasets: [{
        data: [
          relevantPurchases.filter(p => p.paymentMethod === 'efectivo').length,
          relevantPurchases.filter(p => p.paymentMethod === 'transferencia').length,
          relevantPurchases.filter(p => p.paymentMethod === 'mercadopago').length
        ],
        backgroundColor: [
          'rgba(0, 255, 255, 0.6)',
          'rgba(255, 0, 255, 0.6)',
          'rgba(255, 255, 0, 0.6)'
        ],
        borderColor: [
          'rgba(0, 255, 255, 1)',
          'rgba(255, 0, 255, 1)',
          'rgba(255, 255, 0, 1)'
        ],
        borderWidth: 2
      }]
    }

    const statusData = {
      labels: ['Pendientes', 'Confirmados'],
      datasets: [{
        data: [statistics.pendingCount, statistics.confirmedCount],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 2
      }]
    }

    const revenueData = {
      labels: relevantPurchases.slice(-7).map(p => `${p.firstName} ${p.lastName.charAt(0)}.`),
      datasets: [{
        label: selectedEventFilter === 'all' ? 'Ingresos Totales' : 'Ingresos del Evento',
        data: relevantPurchases.slice(-7).map(p => p.total),
        borderColor: 'rgba(0, 255, 255, 1)',
        backgroundColor: 'rgba(0, 255, 255, 0.1)',
        tension: 0.4
      }]
    }

    return { paymentMethodData, statusData, revenueData }
  }, [filteredPurchases, statistics, selectedEventFilter])

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="info" style={{ width: '4rem', height: '4rem' }} />
        <h3 className="mt-3 text-white">Cargando datos...</h3>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="danger" className="glass-card">
        <h4>Error</h4>
        <p>{error}</p>
        <Button variant="outline-danger" onClick={loadPurchases}>Reintentar</Button>
      </Alert>
    )
  }

  return (
    <div className="dashboard">
      {/* Estadísticas principales - Responsive */}
      <Row className="g-3 g-md-4 mb-4 mb-md-5">
        <Col xl={3} lg={6} md={6} sm={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10}>
              <Card className="glass-card text-white h-100 pulse-neon" style={{
                background: 'linear-gradient(135deg, rgba(255,0,110,0.10), rgba(131,56,236,0.10))'
              }}>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <CurrencyDollarIcon style={{ width: '40px', height: '40px', color: '#ffbe0b' }} />
                    <Badge bg="warning" className="px-3 py-2 text-dark" style={{ opacity: 0.9, fontFamily: "'Montserrat', sans-serif" }}>Total</Badge>
                  </div>
                  <h2 className="display-5 fw-bold mb-1" style={{ fontFamily: "'Montserrat', sans-serif", color: 'rgba(255,255,255,0.9)' }}>${statistics.totalRevenue.toLocaleString('es-AR')}</h2>
                  <p className="mb-0" style={{ color: '#ffbe0b', fontFamily: "'Montserrat', sans-serif" }}>
                    {selectedEventFilter === 'all' ? 'Ingresos Totales' : 'Ingresos del Evento'}
                  </p>
                </Card.Body>
              </Card>
            </Tilt>
          </motion.div>
        </Col>

        <Col xl={3} lg={6} md={6} sm={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10}>
              <Card className="glass-card text-white h-100" style={{
                background: 'linear-gradient(135deg, rgba(255,0,255,0.10), rgba(255,0,100,0.10))'
              }}>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <TicketIcon style={{ width: '40px', height: '40px', color: '#8338ec' }} />
                    <Badge bg="secondary" className="px-3 py-2" style={{ opacity: 0.9, fontFamily: "'Montserrat', sans-serif" }}>Tickets</Badge>
                  </div>
                  <h2 className="display-5 fw-bold mb-1" style={{ fontFamily: "'Montserrat', sans-serif", color: 'rgba(255,255,255,0.9)' }}>{statistics.totalTickets}</h2>
                  <p className="mb-0" style={{ color: '#8338ec', fontFamily: "'Montserrat', sans-serif" }}>
                    {selectedEventFilter === 'all' ? 'Entradas Vendidas' : 'Entradas del Evento'}
                  </p>
                </Card.Body>
              </Card>
            </Tilt>
          </motion.div>
        </Col>

        <Col xl={3} lg={6} md={6} sm={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10}>
              <Card className="glass-card text-white h-100" style={{
                background: 'linear-gradient(135deg, rgba(255,190,11,0.10), rgba(251,86,7,0.10))'
              }}>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <UserGroupIcon style={{ width: '40px', height: '40px', color: '#ffbe0b' }} />
                    <Badge bg="warning" className="px-3 py-2 text-dark" style={{ opacity: 0.9, fontFamily: "'Montserrat', sans-serif" }}>Clientes</Badge>
                  </div>
                  <h2 className="display-5 fw-bold mb-1" style={{ fontFamily: "'Montserrat', sans-serif", color: 'rgba(255,255,255,0.9)' }}>{statistics.totalPurchases}</h2>
                  <p className="mb-0" style={{ color: '#ffbe0b', fontFamily: "'Montserrat', sans-serif" }}>
                    {selectedEventFilter === 'all' ? 'Total Compradores' : 'Compradores del Evento'}
                  </p>
                </Card.Body>
              </Card>
            </Tilt>
          </motion.div>
        </Col>

        <Col xl={3} lg={6} md={6} sm={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10}>
              <Card className="glass-card text-white h-100" style={{
                background: 'linear-gradient(135deg, rgba(0,255,0,0.08), rgba(0,150,100,0.08))'
              }}>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <SparklesIcon style={{ width: '40px', height: '40px', color: '#00ff88' }} />
                    <Badge bg="success" className="px-3 py-2" style={{ opacity: 0.9, fontFamily: "'Montserrat', sans-serif" }}>VIP</Badge>
                  </div>
                  <h2 className="display-5 fw-bold mb-1" style={{ fontFamily: "'Montserrat', sans-serif", color: 'rgba(255,255,255,0.9)' }}>{statistics.totalCoolers}</h2>
                  <p className="mb-0" style={{ color: '#00ffaa', fontFamily: "'Montserrat', sans-serif" }}>Conservadoras</p>
                </Card.Body>
              </Card>
            </Tilt>
          </motion.div>
        </Col>
      </Row>

      {/* Gráficos - Responsive */}
      <Row className="g-3 g-md-4 mb-4 mb-md-5">
        <Col lg={4} md={6} sm={12}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass-card h-100">
              <Card.Body>
                <h5 className="text-white mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  <ChartBarIcon style={{ width: '24px', height: '24px' }} className="me-2" />
                  Métodos de Pago
                </h5>
                <Doughnut data={chartData.paymentMethodData} options={{
                  plugins: { legend: { labels: { color: 'white' } } }
                }} plugins={[darkChartBackgroundPlugin as any]} />
              </Card.Body>
            </Card>
          </motion.div>
        </Col>

        <Col lg={4} md={6} sm={12}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="glass-card h-100">
              <Card.Body>
                <h5 className="text-white mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  <ArrowTrendingUpIcon style={{ width: '24px', height: '24px' }} className="me-2" />
                  Estado de Pagos
                </h5>
                <Doughnut data={chartData.statusData} options={{
                  plugins: { legend: { labels: { color: 'white' } } }
                }} plugins={[darkChartBackgroundPlugin as any]} />
              </Card.Body>
            </Card>
          </motion.div>
        </Col>

        <Col lg={4} md={12} sm={12}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="glass-card h-100">
              <Card.Body>
                <h5 className="text-white mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  <CurrencyDollarIcon style={{ width: '24px', height: '24px' }} className="me-2" />
                  Últimos Ingresos
                </h5>
                <Line data={chartData.revenueData} options={{
                  scales: {
                    y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                  },
                  plugins: { legend: { labels: { color: 'white' } } }
                }} plugins={[darkChartBackgroundPlugin as any]} />
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Event Manager Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="glass-card mb-5">
          <Card.Header className="bg-transparent border-bottom border-secondary">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
              <h4 className="text-white mb-0" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                <CalendarDaysIcon style={{ width: '30px', height: '30px' }} className="me-2" />
                Event Manager
              </h4>
              <Button
                onClick={() => setShowEventModal(true)}
                className="btn-neon"
                style={{
                  background: 'linear-gradient(45deg, #ff006e, #8338ec)',
                  border: 'none',
                  padding: '10px 20px',
                  fontWeight: 'bold',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontFamily: "'Montserrat', sans-serif"
                }}
              >
                <PlusIcon style={{ width: '20px', height: '20px' }} className="me-2" />
                Crear Evento
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {eventsLoading ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="info" />
                <p className="text-white mt-2">Cargando eventos...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-5">
                <CalendarDaysIcon style={{ width: '60px', height: '60px', color: '#666' }} className="mb-3" />
                <h5 className="text-white">No hay eventos creados</h5>
                <p className="text-muted">¡Crea tu primer evento para empezar!</p>
              </div>
            ) : (
              <Row className="g-3 g-md-4">
                {events.map((event, index) => (
                  <Col xl={4} lg={6} md={6} sm={12} key={event.id}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10}>
                        <Card className="h-100 bg-dark text-white border-0" style={{
                          background: 'linear-gradient(135deg, rgba(255,0,110,0.1), rgba(138,56,236,0.1))',
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 8px 32px rgba(255,0,110,0.3)',
                          borderRadius: '15px'
                        }}>
                          {event.image && (
                            <Card.Img 
                              variant="top" 
                              src={event.image} 
                              style={{ height: '200px', objectFit: 'cover' }}
                            />
                          )}
                          <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h5 className="mb-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>{event.name}</h5>
                              <div className="d-flex align-items-center gap-2">
                                {event.sheetId ? (
                                  <Badge bg="success">Base creada</Badge>
                                ) : (
                                  <Badge bg="secondary">Creando base…</Badge>
                                )}
                                <Badge bg={event.status === 'active' ? 'success' : 'secondary'}>
                                  {event.status === 'active' ? 'Activo' : 'Inactivo'}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <div className="d-flex align-items-center mb-1">
                                <CalendarDaysIcon style={{ width: '16px', height: '16px' }} className="me-2" />
                                <small>{event.date} - {event.hour}</small>
                              </div>
                              <div className="d-flex align-items-center mb-1">
                                <MapPinIcon style={{ width: '16px', height: '16px' }} className="me-2" />
                                <small>{event.location}</small>
                              </div>
                            </div>

                            <p className="text-muted small mb-3">{event.description}</p>

                            <div className="row g-2 mb-3">
                              <div className="col-6">
                                <div className="text-center p-2 bg-dark rounded" style={{ border: '1px solid #8338ec' }}>
                                  <small className="text-muted d-block" style={{ fontFamily: "'Montserrat', sans-serif", color: 'rgba(255,255,255,0.8)' }}>Entrada General</small>
                                  <strong className="text-warning" style={{ color: 'rgba(255,190,11,0.9)' }}>${event.ticketPrice.toLocaleString('es-AR')}</strong>
                                </div>
                              </div>
                              <div className="col-6">
                                <div className="text-center p-2 bg-dark rounded" style={{ border: '1px solid #ffbe0b' }}>
                                  <small className="text-muted d-block" style={{ fontFamily: "'Montserrat', sans-serif", color: 'rgba(255,255,255,0.8)' }}>VIP</small>
                                  <strong className="text-warning" style={{ color: 'rgba(255,190,11,0.9)' }}>${event.vipPrice.toLocaleString('es-AR')}</strong>
                                </div>
                              </div>
                            </div>

                            <div className="text-center mb-3">
                              <small className="text-muted">Capacidad: </small>
                              <strong>{event.capacity} personas</strong>
                            </div>

                            <div className="d-grid gap-2">
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => openEditModal(event)}
                                className="btn-neon"
                              >
                                Editar
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteEvent(event.id)}
                                className="btn-neon"
                              >
                                Eliminar
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Tilt>
                    </motion.div>
                  </Col>
                ))}
              </Row>
            )}
          </Card.Body>
        </Card>
      </motion.div>

      {/* Tabla de compras */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="glass-card">
          <Card.Header className="bg-transparent border-bottom border-secondary">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
              <div>
                <h4 className="text-white mb-2 mb-lg-0" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  Lista de Compras
                </h4>
                {selectedEventFilter !== 'all' && (
                  <Badge bg="info" className="d-block d-lg-inline ms-0 ms-lg-2 mt-2 mt-lg-0">
                    {events.find(e => e.id === selectedEventFilter)?.name || 'Evento'}
                  </Badge>
                )}
              </div>
              <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2 gap-sm-3 w-100 w-lg-auto">
                {/* Select sin emojis */}
                <Form.Select
                  value={selectedEventFilter}
                  onChange={(e) => setSelectedEventFilter(e.target.value)}
                  className="bg-dark text-white border-secondary"
                  style={{ minWidth: '200px', fontSize: '0.9rem', fontFamily: "'Montserrat', sans-serif" }}
                >
                  <option value="all">Todas las compras</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </Form.Select>
                <Badge bg="secondary" className="px-3 py-2">
                  {statistics.totalPurchases} compras
                </Badge>
                <Button
                  variant="outline-info"
                  size="sm"
                  onClick={() => { loadPurchases(); loadEvents(); }}
                  className="btn-neon"
                  disabled={loading || eventsLoading}
                  style={{ borderColor: '#00ffff', color: '#00ffff' }}
                >
                  { (loading || eventsLoading) ? (<Spinner size="sm" className="me-1" />) : null } Actualizar
                </Button>
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            <style>{`
              .purchase-table thead th { background: rgba(15,15,20,0.95); color: #fff; }
              .purchase-table tbody tr:nth-child(odd) { background: rgba(255,255,255,0.02); }
              .purchase-table tbody tr:nth-child(even) { background: rgba(255,255,255,0.04); }
              .purchase-table tbody tr:hover { background: rgba(255,0,110,0.10) !important; }
            `}</style>
            {selectedEventFilter !== 'all' && (
              <div className="mb-4">
                {(() => {
                  const selectedEvent = events.find(e => e.id === selectedEventFilter);
                  return selectedEvent ? (
                    <Alert variant="dark" className="glass-card">
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <h6 className="mb-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                            <strong>{selectedEvent.name}</strong>
                          </h6>
                          <small>
                            {selectedEvent.date} - {selectedEvent.hour} | {selectedEvent.location} | {selectedEvent.capacity} personas
                          </small>
                        </div>
                        <div className="text-end">
                          <small className="d-block">Tickets: ${selectedEvent.ticketPrice.toLocaleString('es-AR')}</small>
                          <small className="d-block">VIP: ${selectedEvent.vipPrice.toLocaleString('es-AR')}</small>
                        </div>
                      </div>
                    </Alert>
                  ) : null;
                })()}
              </div>
            )}
            <div className="table-responsive">
              <Table hover variant="dark" className="align-middle purchase-table" style={{ minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Cliente</th>
                    <th>Contacto</th>
                    <th>Evento</th>
                    <th>Tickets</th>
                    <th>VIP</th>
                    <th>Total</th>
                    <th>Pago</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-4">
                        <div className="text-muted">
                          <p className="mb-0">
                            {selectedEventFilter === 'all' ? 'No hay compras registradas' : 'No hay compras para este evento'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPurchases.map((purchase, index) => (
                      <motion.tr key={purchase.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{purchase.firstName} {purchase.lastName}</strong>
                        </td>
                        <td>
                          <small className="d-block">{purchase.phone}</small>
                          <small className="text-info">{purchase.email}</small>
                        </td>
                        <td>
                          {purchase.eventName ? (
                            <Badge bg="warning" className="px-2 py-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>{purchase.eventName}</Badge>
                          ) : (
                            <span className="text-muted">Sin evento</span>
                          )}
                        </td>
                        <td><Badge bg="primary" className="px-3 py-2">{purchase.ticketQty}</Badge></td>
                        <td>{purchase.coolerQty > 0 ? (<Badge bg="warning" className="px-3 py-2">{purchase.coolerQty}</Badge>) : (<span className="text-muted">-</span>)}</td>
                        <td className="fw-bold text-success">${purchase.total.toLocaleString('es-AR')}</td>
                        <td><Badge bg="info">{purchase.paymentMethod}</Badge></td>
                        <td>
                          {purchase.status === 'Confirmado' ? (
                            <Badge bg="success">Confirmado</Badge>
                          ) : (
                            <Badge bg="danger">Pendiente</Badge>
                          )}
                        </td>
                        <td>
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => confirmAndSend(purchase, index + 1)}
                            disabled={sendingQR === index + 1}
                            className="btn-neon"
                            style={{ borderColor: '#00ff00', color: '#00ff00' }}
                          >
                            {sendingQR === index + 1 ? (<><Spinner size="sm" className="me-1" /> Enviando...</>) : ('Enviar QRs')}
                          </Button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </motion.div>

      {/* Modal para crear/editar evento - Responsive */}
      <Modal 
        show={showEventModal} 
        onHide={() => { setShowEventModal(false); resetEventForm(); }} 
        size="lg"
        fullscreen="sm-down"
      >
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>
            <CalendarDaysIcon style={{ width: '24px', height: '24px' }} className="me-2" />
            {eventToEdit ? 'Editar Evento' : 'Crear Nuevo Evento'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          <Form>
            <Row className="g-3">
              <Col lg={6} md={12}>
                <Form.Group>
                  <Form.Label>Nombre del Evento *</Form.Label>
                  <Form.Control
                    type="text"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                    required
                    className="bg-dark text-white border-secondary"
                    placeholder="Ej: Fiesta de Año Nuevo"
                  />
                </Form.Group>
              </Col>
              <Col lg={3} md={6} sm={6}>
                <Form.Group>
                  <Form.Label>Fecha *</Form.Label>
                  <Form.Control
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    required
                    className="bg-dark text-white border-secondary"
                  />
                </Form.Group>
              </Col>
              <Col lg={3} md={6} sm={6}>
                <Form.Group>
                  <Form.Label>Hora *</Form.Label>
                  <Form.Control
                    type="time"
                    value={newEvent.hour}
                    onChange={(e) => setNewEvent({ ...newEvent, hour: e.target.value })}
                    required
                    className="bg-dark text-white border-secondary"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Descripción</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="bg-dark text-white border-secondary"
                    placeholder="Describe tu evento..."
                  />
                </Form.Group>
              </Col>
              <Col lg={6} md={12}>
                <Form.Group>
                  <Form.Label>
                    <MapPinIcon style={{ width: '16px', height: '16px' }} className="me-1" />
                    Ubicación *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    required
                    className="bg-dark text-white border-secondary"
                    placeholder="Ej: Club Central, Buenos Aires"
                  />
                </Form.Group>
              </Col>
              <Col lg={6} md={12}>
                <Form.Group>
                  <Form.Label>
                    <PhotoIcon style={{ width: '16px', height: '16px' }} className="me-1" />
                    URL de Imagen
                  </Form.Label>
                  <Form.Control
                    type="url"
                    value={newEvent.image}
                    onChange={(e) => setNewEvent({ ...newEvent, image: e.target.value })}
                    className="bg-dark text-white border-secondary"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </Form.Group>
              </Col>
              <Col lg={4} md={6} sm={12}>
                <Form.Group>
                  <Form.Label>Precio Entrada General *</Form.Label>
                  <Form.Control
                    type="number"
                    value={newEvent.ticketPrice}
                    onChange={(e) => setNewEvent({ ...newEvent, ticketPrice: parseFloat(e.target.value) || 0 })}
                    required
                    min="0"
                    className="bg-dark text-white border-secondary"
                    placeholder="5000"
                  />
                </Form.Group>
              </Col>
              <Col lg={4} md={6} sm={12}>
                <Form.Group>
                  <Form.Label>Precio VIP/Conservadora *</Form.Label>
                  <Form.Control
                    type="number"
                    value={newEvent.vipPrice}
                    onChange={(e) => setNewEvent({ ...newEvent, vipPrice: parseFloat(e.target.value) || 0 })}
                    required
                    min="0"
                    className="bg-dark text-white border-secondary"
                    placeholder="8000"
                  />
                </Form.Group>
              </Col>
              <Col lg={4} md={12} sm={12}>
                <Form.Group>
                  <Form.Label>Capacidad Máxima *</Form.Label>
                  <Form.Control
                    type="number"
                    value={newEvent.capacity}
                    onChange={(e) => setNewEvent({ ...newEvent, capacity: parseInt(e.target.value) || 0 })}
                    required
                    min="1"
                    className="bg-dark text-white border-secondary"
                    placeholder="500"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Estado del Evento</Form.Label>
                  <Form.Select
                    value={newEvent.status}
                    onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value as 'active' | 'inactive' })}
                    className="bg-dark text-white border-secondary"
                  >
                    <option value="active">Activo (visible en ventas)</option>
                    <option value="inactive">Inactivo (oculto en ventas)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button 
            variant="secondary" 
            onClick={() => { setShowEventModal(false); resetEventForm(); }}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={eventToEdit ? handleUpdateEvent : handleCreateEvent}
            disabled={!newEvent.name || !newEvent.date || !newEvent.hour || !newEvent.location || newEvent.ticketPrice <= 0 || newEvent.vipPrice <= 0 || newEvent.capacity <= 0}
            style={{
              background: 'linear-gradient(45deg, #ff006e, #8338ec)',
              border: 'none'
            }}
          >
            {eventToEdit ? 'Guardar Cambios' : 'Crear Evento'}
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  )
})