import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { CartProvider, useCart } from './CartContext'

const TestComponent = () => {
  const { items, total, addToCart, removeFromCart, updateQuantity, clearCart } = useCart()
  
  return (
    <div>
      <div data-testid="total">Total: {total}</div>
      <div data-testid="items-count">Cantidad: {items.length}</div>
      <ul>
        {items.map(item => (
          <li key={item.id} data-testid={`item-${item.id}`}>
            {item.title} - Cant: {item.quantity} - Precio: {item.price}
          </li>
        ))}
      </ul>
      <button
        data-testid="add-btn"
        onClick={() =>
          addToCart({
            id: '1',
            title: 'Amazing Spider-Man',
            author: 'Stan Lee',
            price: 9.99,
            coverImage: 'image.png',
            description: 'A comic book',
            publisher: 'Marvel',
            releaseDate: '1963-03-01',
            genre: 'Superhero',
            pages: 32,
            language: 'English',
          })
        }
      >
        Añadir Artículo
      </button>
      <button data-testid="remove-btn" onClick={() => removeFromCart('1')}>
        Eliminar Artículo
      </button>
      <button data-testid="update-btn" onClick={() => updateQuantity('1', 5)}>
        Actualizar Cant a 5
      </button>
      <button data-testid="clear-btn" onClick={clearCart}>
        Limpiar Carrito
      </button>
    </div>
  )
}

describe('CartContext y useCart', () => {
  it('debería inicializarse con el carrito vacío', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    expect(screen.getByTestId('total')).toHaveTextContent('Total: 0')
    expect(screen.getByTestId('items-count')).toHaveTextContent('Cantidad: 0')
  })

  it('debería añadir un artículo al carrito y calcular el total', async () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    const addBtn = screen.getByTestId('add-btn')
    
    // Añadir primer artículo
    await act(async () => {
      addBtn.click()
    })

    expect(screen.getByTestId('items-count')).toHaveTextContent('Cantidad: 1')
    expect(screen.getByTestId('total')).toHaveTextContent('Total: 9.99')
    expect(screen.getByTestId('item-1')).toHaveTextContent('Amazing Spider-Man - Cant: 1 - Precio: 9.99')

    // Añadir el mismo artículo de nuevo para probar el incremento de cantidad
    await act(async () => {
      addBtn.click()
    })

    expect(screen.getByTestId('items-count')).toHaveTextContent('Cantidad: 1')
    expect(screen.getByTestId('total')).toHaveTextContent('Total: 19.98')
    expect(screen.getByTestId('item-1')).toHaveTextContent('Amazing Spider-Man - Cant: 2 - Precio: 9.99')
  })

  it('debería actualizar la cantidad de un artículo', async () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    const addBtn = screen.getByTestId('add-btn')
    const updateBtn = screen.getByTestId('update-btn')

    await act(async () => {
      addBtn.click()
    })

    await act(async () => {
      updateBtn.click()
    })

    expect(screen.getByTestId('total')).toHaveTextContent('Total: 49.95')
    expect(screen.getByTestId('item-1')).toHaveTextContent('Amazing Spider-Man - Cant: 5 - Precio: 9.99')
  })

  it('debería eliminar un artículo del carrito', async () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    const addBtn = screen.getByTestId('add-btn')
    const removeBtn = screen.getByTestId('remove-btn')

    await act(async () => {
      addBtn.click()
    })

    expect(screen.getByTestId('items-count')).toHaveTextContent('Cantidad: 1')

    await act(async () => {
      removeBtn.click()
    })

    expect(screen.getByTestId('items-count')).toHaveTextContent('Cantidad: 0')
    expect(screen.getByTestId('total')).toHaveTextContent('Total: 0')
  })

  it('debería limpiar el carrito', async () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    const addBtn = screen.getByTestId('add-btn')
    const clearBtn = screen.getByTestId('clear-btn')

    await act(async () => {
      addBtn.click()
    })

    expect(screen.getByTestId('items-count')).toHaveTextContent('Cantidad: 1')

    await act(async () => {
      clearBtn.click()
    })

    expect(screen.getByTestId('items-count')).toHaveTextContent('Cantidad: 0')
    expect(screen.getByTestId('total')).toHaveTextContent('Total: 0')
  })
})
