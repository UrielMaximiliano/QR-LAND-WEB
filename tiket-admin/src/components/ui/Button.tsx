// Componente Button reutilizable
// Aplica principio de composición y reutilización

import type { ButtonHTMLAttributes } from 'react'
import React from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  children, 
  className = '',
  disabled,
  ...props 
}: ButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background'
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary via-secondary to-accent text-white shadow-neon hover:scale-105 focus:ring-primary/50',
    secondary: 'bg-white/10 text-white hover:bg-white/20 focus:ring-white/50',
    accent: 'bg-accent/20 text-accent hover:bg-accent/30 focus:ring-accent/50',
    ghost: 'text-white/80 hover:text-white hover:bg-white/5 focus:ring-white/50'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  }
  
  const isDisabled = disabled || loading
  
  return (
    <button
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {children}
        </div>
      ) : (
        children
      )}
    </button>
  )
}
