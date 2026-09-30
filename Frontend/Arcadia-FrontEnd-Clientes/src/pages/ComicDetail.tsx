import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShoppingCart, ArrowLeft, Star, Calendar, BookOpen, Globe, MessageSquare, CheckCircle, Heart } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { Comic } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { useFavorites } from '../context/FavoritesContext'
import ComicCover from '../components/ComicCover'

interface CustomerReview {
  id: string
  userName: string
  rating: number
  comment: string
  date: string
}

// Reseñas iniciales por defecto para dar realismo a los cómics precargados
const DEFAULT_INITIAL_REVIEWS: Record<string, CustomerReview[]> = {
  '1': [
    {
      id: 'rev-w1',
      userName: 'Carlos M.',
      rating: 5,
      comment: 'Una obra maestra absoluta de la novela gráfica. La calidad del papel y los colores en esta edición son espectaculares.',
      date: '2026-02-15'
    },
    {
      id: 'rev-w2',
      userName: 'Lucía Fernández',
      rating: 5,
      comment: 'Lectura obligatoria para cualquier entusiasta del cómic. La trama te atrapa de principio a fin.',
      date: '2026-03-01'
    }
  ],
  '2': [
    {
      id: 'rev-b1',
      userName: 'Martín R.',
      rating: 5,
      comment: 'La mejor historia de Batman jamás contada. Frank Miller en su punto máximo.',
      date: '2026-01-20'
    }
  ],
  '3': [
    {
      id: 'rev-op1',
      userName: 'AnimeLover99',
      rating: 5,
      comment: 'El inicio de la aventura más legendaria del manga. Excelente impresión y encuadernación.',
      date: '2026-03-10'
    }
  ]
}

const ComicDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { addToCart } = useCart()
  const { toggleFavorite, isFavorite } = useFavorites()
  const { t, lang } = useLanguage()
  
  // Detalles del Comic
  const [comic, setComic] = useState<Comic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Reseñas de Clientes
  const [reviews, setReviews] = useState<CustomerReview[]>([])
  const [newRating, setNewRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [newComment, setNewComment] = useState<string>('')
  const [reviewSuccess, setReviewSuccess] = useState<boolean>(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null

  // Cargar información del cómic
  useEffect(() => {
    if (!id) return

    const fetchComic = async () => {
      try {
        setLoading(true)
        setError(null)
        const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'https://67mry3gq69.execute-api.us-east-1.amazonaws.com'
        const response = await fetch(`${gatewayUrl}/api/comics/${id}`)
        if (!response.ok) {
          throw new Error(`Error ${response.status}: No se pudo cargar el cómic`)
        }
        const data: Comic = await response.json()
        setComic(data)

        // Cargar reseñas asociadas al cómic desde localStorage
        const storageKey = `arcadia_reviews_${id}`
        const savedReviews = localStorage.getItem(storageKey)
        if (savedReviews) {
          try {
            setReviews(JSON.parse(savedReviews))
          } catch (e) {
            setReviews([])
          }
        } else if (DEFAULT_INITIAL_REVIEWS[id]) {
          setReviews(DEFAULT_INITIAL_REVIEWS[id])
        } else {
          setReviews([])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchComic()
  }, [id])

  // Publicar nueva reseña
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault()
    setReviewError(null)

    if (newRating < 1 || newRating > 5) {
      setReviewError(t('selectRatingError'))
      return
    }

    const reviewerName = user?.nombre || user?.email?.split('@')[0] || t('guestUser')
    const newRev: CustomerReview = {
      id: `rev-${Date.now()}`,
      userName: reviewerName,
      rating: newRating,
      comment: newComment.trim() || (lang === 'es' ? '¡Excelente lectura y calidad de impresión!' : 'Great read and great print quality!'),
      date: new Date().toISOString().split('T')[0]
    }

    const updated = [newRev, ...reviews]
    setReviews(updated)
    if (id) {
      localStorage.setItem(`arcadia_reviews_${id}`, JSON.stringify(updated))
    }

    setNewComment('')
    setReviewSuccess(true)
    setTimeout(() => setReviewSuccess(false), 4000)
  }

  // Cálculos dinámicos de rating
  const reviewCount = reviews.length
  const avgRating = reviewCount > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
    : null

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <p className="text-gray-500 text-lg">{t('loadingComics')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-red-500 mb-4">{error}</p>
          <Link to="/" className="btn-primary">
            {t('back')}
          </Link>
        </div>
      </div>
    )
  }

  if (!comic) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('noComicsFound')}</h1>
          <Link to="/" className="btn-primary">
            {t('back')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-primary-600 transition-colors">
          {t('homeLink')}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{comic.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Comic Image */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex items-center justify-center min-h-[460px]">
            <ComicCover
              src={comic.coverImage}
              alt={comic.title}
              title={comic.title}
              genre={comic.genre}
              publisher={comic.publisher}
              className="w-full h-full min-h-[460px] max-h-[520px] object-contain rounded-lg"
            />
          </div>
          
          {/* Thumbnail Gallery */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-100 rounded-lg aspect-[3/4] flex items-center justify-center text-gray-400 text-xs font-semibold border border-gray-200">
                Pág. {i * 10}
              </div>
            ))}
          </div>
        </div>

        {/* Comic Details */}
        <div className="space-y-6">
          {/* Title and Rating */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{comic.title}</h1>
            <p className="text-xl text-gray-600 mb-4">{t('byAuthor')} {comic.author}</p>
            
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <span className="text-3xl font-bold text-primary-600">${comic.price}</span>
              
              <div className="flex items-center bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200">
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
                {avgRating ? (
                  <span className="ml-1.5 text-sm font-bold text-gray-800">
                    {avgRating} <span className="font-normal text-gray-500">({reviewCount} {t('customerReviews').toLowerCase()})</span>
                  </span>
                ) : (
                  <span className="ml-1.5 text-xs text-gray-600 font-medium">
                    {t('noReviewsYet')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold mb-2">{t('description')}</h2>
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
              {comic.description || (lang === 'es'
                ? `Edición especial de ${comic.title}, creada por ${comic.author} y publicada oficialmente por ${comic.publisher}. Una entrega imperdible de colección para los fanáticos del género ${comic.genre}.`
                : `Special edition of ${comic.title}, created by ${comic.author} and officially published by ${comic.publisher}. A must-have collector item for fans of the ${comic.genre} genre.`
              )}
            </p>
          </div>

          {/* Comic Information Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('comicInfo')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">{t('publisher')}</p>
                  <p className="font-medium text-gray-800">{comic.publisher}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">{t('releaseDate')}</p>
                  <p className="font-medium text-gray-800">
                    {comic.releaseDate ? new Date(comic.releaseDate).toLocaleDateString() : '2024'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="h-5 w-5 bg-primary-100 rounded flex items-center justify-center text-xs font-bold text-primary-700">
                  {comic.genre ? comic.genre[0] : 'C'}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">{t('genre')}</p>
                  <p className="font-medium text-gray-800">{comic.genre || 'Superhero'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="h-5 w-5 bg-primary-100 rounded flex items-center justify-center text-xs font-bold text-primary-700">
                  #
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">{t('pages')}</p>
                  <p className="font-medium text-gray-800">
                    {t('pagesCount').replace('{count}', (comic.pages || 120).toString())}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Globe className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">{t('language')}</p>
                  <p className="font-medium text-gray-800">{comic.language || 'Español'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => addToCart(comic)}
              className="flex-1 min-w-[160px] btn-primary flex items-center justify-center gap-2 py-3 shadow-md"
            >
              <ShoppingCart className="h-5 w-5" />
              {t('addToCart')}
            </button>

            <button
              type="button"
              onClick={() => toggleFavorite(comic)}
              className={`p-3 rounded-lg border flex items-center justify-center transition-colors shadow-sm ${
                comic && isFavorite(comic.id)
                  ? 'bg-rose-50 border-rose-300 text-rose-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-rose-50 hover:text-rose-600'
              }`}
              title={comic && isFavorite(comic.id) ? t('removeFromFavorites') : t('addToFavorites')}
            >
              <Heart
                className={`h-5 w-5 ${
                  comic && isFavorite(comic.id) ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
            </button>
            
            <Link
              to="/"
              className="btn-secondary flex items-center gap-2 px-5 py-3"
            >
              <ArrowLeft className="h-5 w-5" />
              {t('back')}
            </Link>
          </div>

          {/* Additional Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold mb-3">{t('productDetails')}</h3>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>• <strong>{t('officialPublisher')}</strong> {comic.publisher}</li>
              <li>• <strong>{t('formatCollector').replace('{pages}', (comic.pages || 120).toString()).replace('{lang}', comic.language || 'Español')}</strong></li>
              <li>• <strong>{comic.stock > 0 ? t('availabilityStock').replace('{stock}', comic.stock.toString()) : t('outOfStock')}</strong></li>
              <li>• <strong>{t('skuCode')}</strong> ARC-{comic.id}</li>
              <li>• {t('shippingInfo')}</li>
              <li>• {t('freeShippingOver50')}</li>
              <li>• {t('returnWarranty')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CUSTOMER REVIEWS & RATINGS SECTION */}
      <div className="border-t border-gray-200 pt-10 mt-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary-600" />
              {t('customerReviews')}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {reviewCount > 0 
                ? `${t('basedOnReviews').replace('{count}', reviewCount.toString())} — Calificación promedio: ${avgRating} / 5.0`
                : t('noReviewsYet')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Review Submission Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-gray-900 mb-3">{t('leaveReviewTitle')}</h3>
            
            {reviewSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>{t('reviewSuccess')}</span>
              </div>
            )}

            {reviewError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                {reviewError}
              </div>
            )}

            <form onSubmit={handleAddReview} className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {t('postingAs')} <strong className="text-gray-700">{user?.nombre || user?.email || t('guestUser')}</strong>
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('yourRating')}
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 focus:outline-none"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          star <= (hoverRating || newRating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-bold text-gray-700 text-sm">
                    {hoverRating || newRating} / 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('description')}
                </label>
                <textarea
                  rows={4}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t('writeYourReview')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-2.5 text-sm font-semibold shadow-sm"
              >
                {t('publishReview')}
              </button>
            </form>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8">
                <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">{t('noReviewsYet')}</p>
                <p className="text-gray-400 text-sm mt-1">Comparte tus impresiones y ayuda a otros coleccionistas.</p>
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm transition-hover hover:border-primary-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                        {rev.userName ? rev.userName[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">{rev.userName}</h4>
                        <p className="text-xs text-gray-400">{rev.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center bg-yellow-50 px-2 py-1 rounded">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="ml-1 text-xs font-bold text-gray-700">{rev.rating}.0</span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed pl-12">
                    {rev.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComicDetail