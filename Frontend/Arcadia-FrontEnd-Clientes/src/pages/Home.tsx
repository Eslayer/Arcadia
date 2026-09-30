import React, { useState, useEffect, useCallback, memo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bookmark, ShoppingCart, Grid, List, Search, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { Comic } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { useFavorites } from '../context/FavoritesContext'
import { useSearch } from '../context/SearchContext'
import ComicCover from '../components/ComicCover'

interface ComicItemProps {
  comic: Comic
  isFav: boolean
  onToggleFav: (comic: Comic) => void
  onAddToCart: (comic: Comic) => void
  t: (key: string) => string
}

// Componentes extraídos fuera de Home y memoizados para evitar desmontajes y el parpadeo blanco
const ComicCard = memo(({ comic, isFav, onToggleFav, onAddToCart, t }: ComicItemProps) => {
  return (
    <div className="card overflow-hidden group flex flex-col justify-between hover:shadow-md transition-shadow bg-white">
      {/* Fondo oscuro para evitar destello blanco durante carga de imagen */}
      <div className="relative h-64 overflow-hidden bg-slate-900">
        <ComicCover
          src={comic.coverImage}
          alt={comic.title}
          title={comic.title}
          genre={comic.genre}
          publisher={comic.publisher}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleFav(comic)
          }}
          className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-amber-50 transition-colors z-10"
          title={isFav ? t('removeFromWishlist') : t('addToWishlist')}
        >
          <Bookmark
            className={`h-4 w-4 transition-colors ${
              isFav ? 'text-amber-500 fill-amber-500' : 'text-gray-400 hover:text-amber-500'
            }`}
          />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">{comic.title}</h3>
          <p className="text-gray-600 text-sm mb-2">{comic.author}</p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl font-bold text-primary-600">${comic.price}</span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded font-medium">{comic.genre}</span>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/comic/${comic.id}`}
              className="flex-1 btn-secondary text-center text-sm py-2"
            >
              {t('viewDetails')}
            </Link>
            <button
              onClick={() => onAddToCart(comic)}
              className="btn-primary p-2"
              title={t('addToCart')}
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

const ComicListItem = memo(({ comic, isFav, onToggleFav, onAddToCart, t }: ComicItemProps) => {
  return (
    <div className="card p-4 flex gap-4 hover:shadow-md transition-shadow bg-white">
      <div className="relative w-24 h-32 flex-shrink-0 overflow-hidden rounded bg-slate-900">
        <ComicCover
          src={comic.coverImage}
          alt={comic.title}
          title={comic.title}
          genre={comic.genre}
          publisher={comic.publisher}
          className="w-24 h-32 object-cover rounded"
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleFav(comic)
          }}
          className="absolute top-1 right-1 bg-white/95 rounded-full p-1 shadow hover:bg-amber-50 transition-colors z-10"
          title={isFav ? t('removeFromWishlist') : t('addToWishlist')}
        >
          <Bookmark
            className={`h-3.5 w-3.5 ${
              isFav ? 'text-amber-500 fill-amber-500' : 'text-gray-400 hover:text-amber-500'
            }`}
          />
        </button>
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-lg mb-1">{comic.title}</h3>
        <p className="text-gray-600 text-sm mb-2">{comic.author}</p>
        <p className="text-gray-700 text-sm mb-3 line-clamp-2">{comic.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-primary-600">${comic.price}</span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded font-medium">{comic.genre}</span>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/comic/${comic.id}`}
              className="btn-secondary text-sm py-2 px-4"
            >
              {t('viewDetails')}
            </Link>
            <button
              onClick={() => onAddToCart(comic)}
              className="btn-primary p-2"
              title={t('addToCart')}
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

const Home = () => {
  const { addToCart } = useCart()
  const { toggleFavorite, isFavorite } = useFavorites()
  const { t } = useLanguage()
  const { searchTerm, clearSearch } = useSearch()
  const location = useLocation()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('title')
  const [comics, setComics] = useState<Comic[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Reaccionar a la ruta activa (New Releases, Bestsellers, Comics)
  useEffect(() => {
    if (location.pathname === '/new-releases') {
      setSortBy('date')
    } else if (location.pathname === '/bestsellers') {
      setSortBy('price-high')
    } else if (location.pathname === '/comics') {
      setSelectedGenre('all')
    }
  }, [location.pathname])

  useEffect(() => {
    const fetchComics = async () => {
      try {
        setLoading(true)
        setError(null)
        const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'https://67mry3gq69.execute-api.us-east-1.amazonaws.com';
        const response = await fetch(`${gatewayUrl}/api/comics`)
        if (!response.ok) {
          throw new Error(`Error ${response.status}: No se pudieron cargar los cómics`)
        }
        const data: Comic[] = await response.json()
        setComics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    fetchComics()
  }, [])

  const handleToggleFav = useCallback((comic: Comic) => {
    toggleFavorite(comic)
  }, [toggleFavorite])

  const handleAddToCart = useCallback((comic: Comic) => {
    addToCart(comic)
  }, [addToCart])

  const genres = ['all', 'Superhero', 'Sci-Fi', 'Horror', 'Historical', 'Fantasy', 'Manga', 'Aventura', 'Acción']

  const normalizedSearch = searchTerm.trim().toLowerCase()

  const filteredAndSortedComics = comics
    .filter(comic => {
      const matchesGenre = selectedGenre === 'all' || comic.genre === selectedGenre
      const matchesSearch = !normalizedSearch ||
        (comic.title && comic.title.toLowerCase().includes(normalizedSearch)) ||
        (comic.author && comic.author.toLowerCase().includes(normalizedSearch)) ||
        (comic.publisher && comic.publisher.toLowerCase().includes(normalizedSearch)) ||
        (comic.genre && comic.genre.toLowerCase().includes(normalizedSearch))

      return matchesGenre && matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'date':
          return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        default:
          return 0
      }
    })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 mb-8 text-white shadow-lg">
        <h1 className="text-4xl font-bold mb-4">{t('welcomeTitle')}</h1>
        <p className="text-xl mb-6 text-primary-100 max-w-2xl">
          {t('welcomeSubtitle')}
        </p>
        <a 
          href="#catalog-section"
          className="inline-block bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors shadow-sm"
        >
          {t('shopNow')}
        </a>
      </div>

      {/* Filters and Controls */}
      <div id="catalog-section" className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {genres.map(genre => (
                <option key={genre} value={genre}>
                  {genre === 'all' ? t('allGenres') : genre}
                </option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="title">{t('sortByTitle')}</option>
              <option value="price-low">{t('sortPriceLow')}</option>
              <option value="price-high">{t('sortPriceHigh')}</option>
              <option value="date">{t('sortDate')}</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Grid view"
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-100'}`}
              title="List view"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Count with Scroll Notice & Active Search Badge */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-gray-600 text-sm">
            {t('showingComics').replace('{count}', filteredAndSortedComics.length.toString())} ({comics.length} total)
          </p>
          {searchTerm && (
            <span className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-800 text-xs font-semibold px-2.5 py-1 rounded-full">
              <Search className="w-3 h-3 text-primary-600" />
              <span>«{searchTerm}»</span>
              <button
                type="button"
                onClick={clearSearch}
                className="hover:text-primary-950 p-0.5"
                title="Quitar filtro de búsqueda"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
        <span className="text-xs text-primary-700 bg-primary-50 border border-primary-200 px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1 w-fit">
          ↕ {t('catalogScrollNotice')}
        </span>
      </div>

      {/* Loading, Error and Comics Grid/List with Scroll Container */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">{t('loadingComics')}</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">Error: {error}</p>
        </div>
      ) : (
        <div className="max-h-[820px] overflow-y-auto pr-2 pb-4 rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4 shadow-inner">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedComics.map(comic => (
                <ComicCard
                  key={comic.id}
                  comic={comic}
                  isFav={isFavorite(comic.id)}
                  onToggleFav={handleToggleFav}
                  onAddToCart={handleAddToCart}
                  t={t}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedComics.map(comic => (
                <ComicListItem
                  key={comic.id}
                  comic={comic}
                  isFav={isFavorite(comic.id)}
                  onToggleFav={handleToggleFav}
                  onAddToCart={handleAddToCart}
                  t={t}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredAndSortedComics.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">{t('noComicsFound')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Home
