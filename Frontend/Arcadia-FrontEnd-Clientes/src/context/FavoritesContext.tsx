import React, { createContext, useContext, useState, useEffect } from 'react'
import { Comic } from './CartContext'
import { useToast } from './ToastContext'

interface FavoritesContextType {
  favorites: Comic[]
  wishlist: Comic[] // Alias moderno para lista de deseos
  toggleFavorite: (comic: Comic) => Promise<void>
  toggleWishlist: (comic: Comic) => Promise<void>
  isFavorite: (id: string) => boolean
  isInWishlist: (id: string) => boolean
  clearFavorites: () => void
  clearWishlist: () => void
  isCloudSynced: boolean
  priceAlerts: string[]
  togglePriceAlert: (comic: Comic) => void
  hasPriceAlert: (comicId: string) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast()
  const [favorites, setFavorites] = useState<Comic[]>(() => {
    try {
      const saved = localStorage.getItem('arcadia_favorites')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [isCloudSynced, setIsCloudSynced] = useState(false)
  const [priceAlerts, setPriceAlerts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('arcadia_price_alerts')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'https://67mry3gq69.execute-api.us-east-1.amazonaws.com'

  // Sincronizar con AWS Cloud (RDS MySQL vía API Gateway) cuando el usuario tiene sesión activa
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) return

    try {
      const user = JSON.parse(userStr)
      const email = user?.email
      if (!email) return

      fetch(`${gatewayUrl}/api/comics/favoritos?email=${encodeURIComponent(email)}`)
        .then(res => {
          if (res.ok) return res.json()
          throw new Error('Endpoint no disponible aún')
        })
        .then((cloudFavorites: Comic[]) => {
          if (Array.isArray(cloudFavorites)) {
            setFavorites(cloudFavorites)
            localStorage.setItem('arcadia_favorites', JSON.stringify(cloudFavorites))
            setIsCloudSynced(true)
          }
        })
        .catch(err => {
          console.info('Modo híbrido: Usando caché local de lista de deseos', err.message)
        })
    } catch (e) {
      console.error('Error parseando usuario para lista de deseos cloud', e)
    }
  }, [gatewayUrl])

  // Guardar en caché local ante cualquier cambio
  useEffect(() => {
    try {
      localStorage.setItem('arcadia_favorites', JSON.stringify(favorites))
    } catch (e) {
      console.error('Error guardando lista de deseos en caché local', e)
    }
  }, [favorites])

  useEffect(() => {
    try {
      localStorage.setItem('arcadia_price_alerts', JSON.stringify(priceAlerts))
    } catch (e) {
      console.error('Error guardando alertas de precio', e)
    }
  }, [priceAlerts])

  const toggleFavorite = async (comic: Comic) => {
    const exists = favorites.some(item => item.id === comic.id)
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : null
    const email = user?.email

    // 1. Actualización optimista de interfaz
    if (exists) {
      setFavorites(prev => prev.filter(item => item.id !== comic.id))
      showToast('Eliminado de tu Lista de Deseos', 'info', {
        title: 'Lista de Deseos',
        comicTitle: comic.title,
        iconType: 'favorite',
      })
    } else {
      setFavorites(prev => [...prev, comic])
      showToast('¡Guardado en tu Lista de Deseos!', 'success', {
        title: 'Lista de Deseos & Alertas',
        comicTitle: comic.title,
        iconType: 'favorite',
      })
    }

    // 2. Persistencia en la nube (AWS RDS MySQL) si el usuario está autenticado
    if (email) {
      try {
        if (exists) {
          // Eliminar de la nube
          await fetch(`${gatewayUrl}/api/comics/favoritos?email=${encodeURIComponent(email)}&comicId=${encodeURIComponent(comic.id)}`, {
            method: 'DELETE'
          })
        } else {
          // Guardar en la nube
          await fetch(`${gatewayUrl}/api/comics/favoritos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, comicId: comic.id })
          })
        }
        setIsCloudSynced(true)
      } catch (err) {
        console.warn('No se pudo sincronizar el cambio con la nube inmediatamente', err)
      }
    }
  }

  const togglePriceAlert = (comic: Comic) => {
    const exists = priceAlerts.includes(comic.id)
    if (exists) {
      setPriceAlerts(prev => prev.filter(id => id !== comic.id))
      showToast('Alerta de descuento desactivada', 'info', {
        title: 'Alertas de Ofertas',
        comicTitle: comic.title,
      })
    } else {
      setPriceAlerts(prev => [...prev, comic.id])
      showToast('¡Alerta activada! Te notificaremos si este cómic baja de precio o entra en oferta.', 'success', {
        title: 'Alertas de Ofertas',
        comicTitle: comic.title,
      })
    }
  }

  const hasPriceAlert = (comicId: string) => {
    return priceAlerts.includes(comicId)
  }

  const isFavorite = (id: string) => {
    return favorites.some(item => item.id === id)
  }

  const clearFavorites = () => {
    setFavorites([])
    localStorage.removeItem('arcadia_favorites')
  }

  return (
    <FavoritesContext.Provider value={{
      favorites,
      wishlist: favorites,
      toggleFavorite,
      toggleWishlist: toggleFavorite,
      isFavorite,
      isInWishlist: isFavorite,
      clearFavorites,
      clearWishlist: clearFavorites,
      isCloudSynced,
      priceAlerts,
      togglePriceAlert,
      hasPriceAlert,
    }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export const useFavorites = () => {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}

export const useWishlist = useFavorites
