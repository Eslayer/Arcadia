import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

// Mock de window.location
const mockHref = vi.fn()
Object.defineProperty(window, 'location', {
  value: {
    search: '',
    pathname: '/',
    get href() {
      return ''
    },
    set href(val) {
      mockHref(val)
    }
  },
  writable: true
})

describe('Componente App de AdminPanel', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('debería mostrar mensaje de verificación si no está autorizado', () => {
    render(<App />)
    expect(screen.getByText('Verificando credenciales de Administrador...')).toBeInTheDocument()
  })

  it('debería renderizar el panel de administración si está autorizado', () => {
    localStorage.setItem('token', 'mock-token')
    localStorage.setItem('user', JSON.stringify({ nombre: 'Admin User', rol: 'Admin' }))

    render(<App />)

    expect(screen.getByText('AdminPanel')).toBeInTheDocument()
    expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument()
    expect(screen.getByText('Inicio')).toBeInTheDocument()
    expect(screen.getByText('Usuarios')).toBeInTheDocument()
    expect(screen.getByText('Cómics')).toBeInTheDocument()
    expect(screen.getByText('Ventas')).toBeInTheDocument()
  })
})
