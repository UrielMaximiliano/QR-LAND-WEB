// Componente Card reutilizable para layout consistente
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
}

export function Card({ children, className = '', hover = false, glow = false }: CardProps) {
  return (
    <div className={`
      rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm
      ${hover ? 'hover:bg-white/10 hover:border-white/20 transition-all duration-300' : ''}
      ${glow ? 'shadow-neon' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  color?: 'primary' | 'secondary' | 'accent'
}

export function StatCard({ title, value, icon, color = 'primary' }: StatCardProps) {
  const colors = {
    primary: 'text-primary',
    secondary: 'text-secondary', 
    accent: 'text-accent'
  }
  
  return (
    <Card className="p-6" glow>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/60 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${colors[color]}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <div className={`text-2xl ${colors[color]} opacity-80`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}
