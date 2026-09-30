import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

describe('Componente App de Login', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('debería renderizar el formulario de inicio de sesión con sus campos', () => {
    render(<App />)

    expect(screen.getByText('Arcadia Admin')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('admin@arcadia.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar Sesión' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bypass Login (Modo Presentación)' })).toBeInTheDocument()
  })

  it('debería permitir escribir en los campos de correo y contraseña', () => {
    render(<App />)

    const emailInput = screen.getByPlaceholderText('admin@arcadia.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'secret123' } })

    expect(emailInput.value).toBe('user@example.com')
    expect(passwordInput.value).toBe('secret123')
  })

  it('debería cambiar a la vista de registro al hacer clic en Regístrate', () => {
    render(<App />)

    const registerBtn = screen.getByRole('button', { name: 'Regístrate' })
    fireEvent.click(registerBtn)

    expect(screen.getByRole('heading', { name: 'Registrarse' })).toBeInTheDocument()
  })
})
