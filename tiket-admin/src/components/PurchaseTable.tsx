// Tabla de compras con diseño optimizado para eventos
import type { Purchase } from '../types'
import { Button } from './ui/Button'

interface PurchaseTableProps {
  purchases: Purchase[]
  onSendQRs: (purchase: Purchase) => void
  actioningId: string | null
}

export function PurchaseTable({ purchases, onSendQRs, actioningId }: PurchaseTableProps) {
  const getStatusBadge = (status: Purchase['status']) => {
    const styles = {
      'Pendiente': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Confirmado': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Enviado': 'bg-green-500/20 text-green-400 border-green-500/30'
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {status === 'Pendiente' && '⏳'} 
        {status === 'Confirmado' && '✅'} 
        {status === 'Enviado' && '📱'} 
        {status}
      </span>
    )
  }

  const formatDate = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return timestamp
    }
  }

  if (purchases.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="text-6xl mb-4">🎫</div>
        <h3 className="text-xl font-semibold text-white/80 mb-2">No hay compras registradas</h3>
        <p className="text-white/60">Las compras aparecerán aquí automáticamente</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left p-4 text-sm font-medium text-white/80">📅 Fecha</th>
            <th className="text-left p-4 text-sm font-medium text-white/80">👤 Cliente</th>
            <th className="text-left p-4 text-sm font-medium text-white/80">📱 Contacto</th>
            <th className="text-center p-4 text-sm font-medium text-white/80">🎫 Entradas</th>
            <th className="text-center p-4 text-sm font-medium text-white/80">🧊 Conservadora</th>
            <th className="text-left p-4 text-sm font-medium text-white/80">💳 Pago</th>
            <th className="text-right p-4 text-sm font-medium text-white/80">💰 Total</th>
            <th className="text-center p-4 text-sm font-medium text-white/80">📊 Estado</th>
            <th className="text-center p-4 text-sm font-medium text-white/80">⚡ Acción</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase) => (
            <tr 
              key={purchase.id} 
              className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
            >
              <td className="p-4 text-sm text-white/80">
                {formatDate(purchase.timestamp)}
              </td>
              
              <td className="p-4">
                <div>
                  <p className="font-medium text-white">
                    {purchase.firstName} {purchase.lastName}
                  </p>
                </div>
              </td>
              
              <td className="p-4 text-sm">
                <div className="space-y-1">
                  <p className="text-white/80">{purchase.phone}</p>
                  <p className="text-white/60 text-xs truncate max-w-[180px]">
                    {purchase.email}
                  </p>
                </div>
              </td>
              
              <td className="p-4 text-center">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-primary/20 text-primary rounded-full text-sm font-bold">
                  {purchase.ticketQty}
                </span>
              </td>
              
              <td className="p-4 text-center">
                {purchase.coolerQty > 0 ? (
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-secondary/20 text-secondary rounded-full text-sm font-bold">
                    {purchase.coolerQty}
                  </span>
                ) : (
                  <span className="text-white/40 text-sm">—</span>
                )}
              </td>
              
              <td className="p-4 text-sm">
                <span className="bg-white/10 px-2 py-1 rounded text-xs">
                  {purchase.paymentMethod}
                </span>
              </td>
              
              <td className="p-4 text-right font-semibold text-white">
                ${purchase.total.toLocaleString()}
              </td>
              
              <td className="p-4 text-center">
                {getStatusBadge(purchase.status)}
              </td>
              
              <td className="p-4 text-center">
                <Button
                  onClick={() => onSendQRs(purchase)}
                  loading={actioningId === purchase.id}
                  variant={purchase.status === 'Enviado' ? 'ghost' : 'primary'}
                  size="sm"
                  className="min-w-[100px]"
                >
                  {actioningId === purchase.id ? (
                    'Enviando...'
                  ) : purchase.status === 'Enviado' ? (
                    '📱 Reenviar'
                  ) : (
                    '🚀 Enviar QRs'
                  )}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
