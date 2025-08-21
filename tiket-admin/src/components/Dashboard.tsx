// Dashboard con diseño premium y gráficos
import { useState, useEffect } from 'react'
import { Row, Col, Card, Badge, Spinner, Alert, Table, Button } from 'react-bootstrap'
import { motion } from 'framer-motion'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement } from 'chart.js'
import { Doughnut, Line } from 'react-chartjs-2'
import type { Purchase } from '../types'
import { GoogleSheetsPurchaseService } from '../services/PurchaseService'
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
  XCircleIcon
} from '@heroicons/react/24/solid'



ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement)

export function Dashboard() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendingQR, setSendingQR] = useState<number | null>(null)
  
  // IDs del Google Sheet
  const SHEET_ID = '1cGfDtuuKPHmYcrVf6rf3DXiege2TmanwaimRKy5E53c'
  const SHEET_NAME = 'Hoja 1'

  const purchaseService = new GoogleSheetsPurchaseService(SHEET_ID, SHEET_NAME)
  const qrService = new QuickChartQRService()
  const whatsappService = new WaMeWhatsAppService()





  useEffect(() => {
    loadPurchases()
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



  // Cálculos para estadísticas
  const totalRevenue = purchases.reduce((sum, p) => sum + p.total, 0)
  const totalTickets = purchases.reduce((sum, p) => sum + p.ticketQty, 0)
  const totalCoolers = purchases.reduce((sum, p) => sum + p.coolerQty, 0)
  const pendingCount = purchases.filter(p => p.status === 'Pendiente').length
  const confirmedCount = purchases.filter(p => p.status === 'Confirmado').length



  // Datos para gráficos
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
      data: [pendingCount, confirmedCount],
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
                  <h2 className="display-5 fw-bold mb-1">${totalRevenue.toLocaleString('es-AR')}</h2>
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
                  <h2 className="display-5 fw-bold mb-1">{totalTickets}</h2>
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
                  <h2 className="display-5 fw-bold mb-1">{totalCoolers}</h2>
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
                <Doughnut data={paymentMethodData} options={{
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
                <Doughnut data={statusData} options={{
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
                <Line data={revenueData} options={{
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


    </div>
  )
}