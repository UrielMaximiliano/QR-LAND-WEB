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
  QrCodeIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarDaysIcon,
  MapPinIcon,
  PhotoIcon,
  PlusIcon
} from '@heroicons/react/24/solid'



ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement)

// Componente memoizado para evitar re-renders innecesarios
export const Dashboard = memo(function Dashboard() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendingQR, setSendingQR] = useState<number | null>(null)
  
  // Estados para Event Manager
  const [events, setEvents] = useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [showEventModal, setShowEventModal] = useState(false)
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null)
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
      setEvents(data)
    } catch (err) {
      console.error('Error cargando eventos:', err)
      setError('Error cargando eventos. Verifica la conexión.')
    } finally {
      setEventsLoading(false)
    }
  }, [eventService])

  const handleCreateEvent = useCallback(async () => {
    try {
      const created = await eventService.createEvent(newEvent)
      setEvents(prev => [created, ...prev])
      setShowEventModal(false)
      resetEventForm()
      setError(null) // Limpiar errores anteriores
    } catch (err) {
      console.error('Error creando evento:', err)
      setError('Error creando evento. Inténtalo de nuevo.')
    }
  }, [eventService, newEvent, events])

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



  // Cálculos para estadísticas - Memoizados para optimizar performance
  const statistics = useMemo(() => {
    const totalRevenue = purchases.reduce((sum, p) => sum + p.total, 0)
    const totalTickets = purchases.reduce((sum, p) => sum + p.ticketQty, 0)
    const totalCoolers = purchases.reduce((sum, p) => sum + p.coolerQty, 0)
    const pendingCount = purchases.filter(p => p.status === 'Pendiente').length
    const confirmedCount = purchases.filter(p => p.status === 'Confirmado').length
    
    return {
      totalRevenue,
      totalTickets,
      totalCoolers,
      pendingCount,
      confirmedCount
    }
  }, [purchases])



  // Datos para gráficos - Memoizados para evitar recálculos innecesarios
  const chartData = useMemo(() => {
    const paymentMethodData = {
      labels: ['Efectivo', 'Transferencia', 'MercadoPago'],
      datasets: [{
        data: [
          purchases.filter(p => p.paymentMethod === 'efectivo').length,
          purchases.filter(p => p.paymentMethod === 'transferencia').length,
          purchases.filter(p => p.paymentMethod === 'mercadopago').length
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
      labels: purchases.slice(-7).map(p => `${p.firstName} ${p.lastName.charAt(0)}.`),
      datasets: [{
        label: 'Ingresos',
        data: purchases.slice(-7).map(p => p.total),
        borderColor: 'rgba(0, 255, 255, 1)',
        backgroundColor: 'rgba(0, 255, 255, 0.1)',
        tension: 0.4
      }]
    }

    return { paymentMethodData, statusData, revenueData }
  }, [purchases, statistics])

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
      {/* Estadísticas principales */}
      <Row className="g-4 mb-5">
        <Col lg={3} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10}>
              <Card className="glass-card text-white h-100 pulse-neon" style={{
                background: 'linear-gradient(135deg, rgba(0,255,255,0.1), rgba(0,100,255,0.1))'
              }}>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <CurrencyDollarIcon style={{ width: '40px', height: '40px', color: '#00ffff' }} />
                    <Badge bg="info" className="px-3 py-2">Total</Badge>
                  </div>
                  <h2 className="display-5 fw-bold mb-1">${statistics.totalRevenue.toLocaleString('es-AR')}</h2>
                  <p className="mb-0 text-info">Ingresos Totales</p>
                </Card.Body>
              </Card>
            </Tilt>
          </motion.div>
        </Col>

        <Col lg={3} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10}>
              <Card className="glass-card text-white h-100" style={{
                background: 'linear-gradient(135deg, rgba(255,0,255,0.1), rgba(255,0,100,0.1))'
              }}>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <TicketIcon style={{ width: '40px', height: '40px', color: '#ff00ff' }} />
                    <Badge bg="danger" className="px-3 py-2">Tickets</Badge>
                  </div>
                  <h2 className="display-5 fw-bold mb-1">{statistics.totalTickets}</h2>
                  <p className="mb-0 text-danger">Entradas Vendidas</p>
                </Card.Body>
              </Card>
            </Tilt>
          </motion.div>
        </Col>

        <Col lg={3} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10}>
              <Card className="glass-card text-white h-100" style={{
                background: 'linear-gradient(135deg, rgba(255,255,0,0.1), rgba(255,150,0,0.1))'
              }}>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <UserGroupIcon style={{ width: '40px', height: '40px', color: '#ffff00' }} />
                    <Badge bg="warning" className="px-3 py-2 text-dark">Clientes</Badge>
                  </div>
                  <h2 className="display-5 fw-bold mb-1">{purchases.length}</h2>
                  <p className="mb-0 text-warning">Compradores</p>
                </Card.Body>
              </Card>
            </Tilt>
          </motion.div>
        </Col>

        <Col lg={3} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10}>
              <Card className="glass-card text-white h-100" style={{
                background: 'linear-gradient(135deg, rgba(0,255,0,0.1), rgba(0,150,100,0.1))'
              }}>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <SparklesIcon style={{ width: '40px', height: '40px', color: '#00ff00' }} />
                    <Badge bg="success" className="px-3 py-2">VIP</Badge>
                  </div>
                  <h2 className="display-5 fw-bold mb-1">{statistics.totalCoolers}</h2>
                  <p className="mb-0 text-success">Conservadoras</p>
                </Card.Body>
              </Card>
            </Tilt>
          </motion.div>
        </Col>
      </Row>

      {/* Gráficos */}
      <Row className="g-4 mb-5">
        <Col lg={4}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass-card h-100">
              <Card.Body>
                <h5 className="text-white mb-4">
                  <ChartBarIcon style={{ width: '24px', height: '24px' }} className="me-2" />
                  Métodos de Pago
                </h5>
                <Doughnut data={chartData.paymentMethodData} options={{
                  plugins: { legend: { labels: { color: 'white' } } }
                }} />
              </Card.Body>
            </Card>
          </motion.div>
        </Col>

        <Col lg={4}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="glass-card h-100">
              <Card.Body>
                <h5 className="text-white mb-4">
                  <ArrowTrendingUpIcon style={{ width: '24px', height: '24px' }} className="me-2" />
                  Estado de Pagos
                </h5>
                <Doughnut data={chartData.statusData} options={{
                  plugins: { legend: { labels: { color: 'white' } } }
                }} />
              </Card.Body>
            </Card>
          </motion.div>
        </Col>

        <Col lg={4}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="glass-card h-100">
              <Card.Body>
                <h5 className="text-white mb-4">
                  <CurrencyDollarIcon style={{ width: '24px', height: '24px' }} className="me-2" />
                  Últimos Ingresos
                </h5>
                <Line data={chartData.revenueData} options={{
                  scales: {
                    y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                  },
                  plugins: { legend: { labels: { color: 'white' } } }
                }} />
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
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="text-white mb-0">
                <CalendarDaysIcon style={{ width: '30px', height: '30px' }} className="me-2" />
                Event Manager
              </h4>
              <Button
                onClick={() => setShowEventModal(true)}
                className="btn-neon"
                style={{
                  background: 'linear-gradient(45deg, #ff006e, #8338ec)',
                  border: 'none',
                  padding: '12px 24px',
                  fontWeight: 'bold',
                  borderRadius: '10px'
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
              <Row className="g-4">
                {events.map((event, index) => (
                  <Col lg={4} md={6} key={event.id}>
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
                              <h5 className="mb-1">{event.name}</h5>
                              <Badge bg={event.status === 'active' ? 'success' : 'secondary'}>
                                {event.status === 'active' ? 'Activo' : 'Inactivo'}
                              </Badge>
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
                                <div className="text-center p-2 bg-dark rounded">
                                  <small className="text-muted d-block">General</small>
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
            <h4 className="text-white mb-0">
              <UserGroupIcon style={{ width: '30px', height: '30px' }} className="me-2" />
              Lista de Compras
            </h4>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table hover variant="dark" className="align-middle">
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(0,255,255,0.3)' }}>
                    <th>#</th>
                    <th>Cliente</th>
                    <th>Contacto</th>
                    <th>Tickets</th>
                    <th>VIP</th>
                    <th>Total</th>
                    <th>Pago</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase, index) => (
                    <motion.tr
                      key={purchase.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td>{index + 1}</td>
                      <td>
                        <strong>{purchase.firstName} {purchase.lastName}</strong>
                      </td>
                      <td>
                        <small className="d-block">{purchase.phone}</small>
                        <small className="text-info">{purchase.email}</small>
                      </td>
                      <td>
                        <Badge bg="primary" className="px-3 py-2">{purchase.ticketQty}</Badge>
                      </td>
                      <td>
                        {purchase.coolerQty > 0 ? (
                          <Badge bg="warning" className="px-3 py-2">{purchase.coolerQty}</Badge>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="fw-bold text-success">
                        ${purchase.total.toLocaleString('es-AR')}
                      </td>
                      <td>
                        <Badge bg="info">{purchase.paymentMethod}</Badge>
                      </td>
                      <td>
                        {purchase.status === 'Confirmado' ? (
                          <Badge bg="success">
                            <CheckCircleIcon style={{ width: '16px', height: '16px' }} className="me-1" />
                            Confirmado
                          </Badge>
                        ) : (
                          <Badge bg="danger">
                            <XCircleIcon style={{ width: '16px', height: '16px' }} className="me-1" />
                            Pendiente
                          </Badge>
                        )}
                      </td>
                      <td>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => confirmAndSend(purchase, index + 1)}
                          disabled={sendingQR === index + 1}
                          className="btn-neon"
                          style={{
                            borderColor: '#00ff00',
                            color: '#00ff00'
                          }}
                        >
                          {sendingQR === index + 1 ? (
                            <>
                              <Spinner size="sm" className="me-1" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <QrCodeIcon style={{ width: '16px', height: '16px' }} className="me-1" />
                              Enviar QRs
                            </>
                          )}
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </motion.div>

      {/* Modal para crear/editar evento */}
      <Modal show={showEventModal} onHide={() => { setShowEventModal(false); resetEventForm(); }} size="lg">
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>
            <CalendarDaysIcon style={{ width: '24px', height: '24px' }} className="me-2" />
            {eventToEdit ? 'Editar Evento' : 'Crear Nuevo Evento'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          <Form>
            <Row className="g-3">
              <Col md={6}>
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
              <Col md={3}>
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
              <Col md={3}>
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
              <Col md={6}>
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
              <Col md={6}>
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
              <Col md={4}>
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
              <Col md={4}>
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
              <Col md={4}>
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