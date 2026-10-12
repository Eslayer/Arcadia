import React from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, ShoppingCart, Trash2, ArrowLeft, Bell, BellRing, Sparkles } from 'lucide-react'
import { useFavorites } from '../context/FavoritesContext'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import ComicCover from '../components/ComicCover'

const Wishlist: React.FC = () => {
  const { wishlist, toggleWishlist, clearWishlist, togglePriceAlert, hasPriceAlert } = useFavorites()
  const { addToCart } = useCart()
  const { t, lang } = useLanguage()

  const handleMoveToCart = (comic: any) => {
    addToCart(comic)
  }

  if (wishlist.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-2xl mx-auto p-8">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-200">
            <Bookmark className="h-10 w-10 text-amber-500 fill-amber-100" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('myWishlist')}</h1>
          <p className="text-gray-600 mb-2 font-medium">{t('noWishlistYet')}</p>
          <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto">{t('noWishlistDesc')}</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl shadow-md">
            <ArrowLeft className="h-4 w-4" />
            <span>{t('shopNow')}</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner de Lista de Deseos & Alertas de Ofertas */}
      <div className="bg-gradient-to-br from-primary-50 via-white to-primary-100/60 rounded-2xl p-6 sm:p-8 border border-primary-200/70 shadow-sm mb-8 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 border border-primary-200 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-primary-600" />
            <span>{lang === 'es' ? 'Alertas de Ofertas & Descuentos' : 'Deal Alerts & Discounts'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 font-heading">{t('myWishlist')}</h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-4">
            {lang === 'es'
              ? 'Guarda los cómics que quieres comprar más adelante. Puedes activar alertas para que te notifiquemos si bajan de precio o entran en oferta especial.'
              : 'Save comics you want to buy later. You can activate alerts so we notify you if their price drops or they enter a special deal.'}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700">
            <span className="bg-white border border-primary-100 px-2.5 py-1 rounded-lg font-medium shadow-sm">
              📦 {wishlist.length} {wishlist.length === 1 ? (lang === 'es' ? 'cómic guardado' : 'item saved') : (lang === 'es' ? 'cómics guardados' : 'items saved')}
            </span>
            <span className="bg-white border border-primary-100 px-2.5 py-1 rounded-lg font-medium shadow-sm">
              🔔 Notificaciones de precio activas
            </span>
          </div>
        </div>
      </div>

      {/* Top bar controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            {lang === 'es' ? 'Cómics en tu Lista' : 'Comics in your List'}
          </h2>
          <p className="text-xs text-gray-500">
            {lang === 'es'
              ? 'Mueve tus cómics al carrito cuando decidas comprarlos o activa avisos de rebajas'
              : 'Move your comics to the cart whenever you decide to purchase or enable sale alerts'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={clearWishlist}
            className="text-xs text-gray-500 hover:text-red-600 font-medium px-3 py-2 rounded-lg border border-gray-200 hover:border-red-200 transition-colors"
          >
            {lang === 'es' ? 'Vaciar Lista' : 'Clear Wishlist'}
          </button>
          <Link
            to="/"
            className="btn-secondary text-xs inline-flex items-center gap-1.5 py-2 px-3.5 rounded-lg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t('continueShopping')}</span>
          </Link>
        </div>
      </div>

      {/* Grid of Wishlist Comics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlist.map((comic) => {
          const alertActive = hasPriceAlert(comic.id)

          return (
            <div
              key={comic.id}
              className="card overflow-hidden group flex flex-col justify-between hover:shadow-lg transition-all border border-gray-100 bg-white"
            >
              <div className="relative h-64 overflow-hidden bg-primary-50">
                <ComicCover
                  src={comic.coverImage}
                  alt={comic.title}
                  title={comic.title}
                  genre={comic.genre}
                  publisher={comic.publisher}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Remove from wishlist button */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(comic)}
                  className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-red-50 text-amber-500 hover:text-red-600 transition-colors z-10"
                  title={t('removeFromWishlist')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Card Details */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-base mb-1 line-clamp-1 text-gray-900">{comic.title}</h3>
                  <p className="text-gray-500 text-xs mb-3">{comic.author} • <span className="font-medium text-gray-700">{comic.publisher}</span></p>

                  {/* Standard Price display */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-black text-primary-600">${comic.price.toFixed(2)}</span>
                    <span className="text-xs bg-gray-100 px-2.5 py-1 rounded font-medium text-gray-700">{comic.genre}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100">
                  {/* Price drop alert toggle */}
                  <button
                    type="button"
                    onClick={() => togglePriceAlert(comic)}
                    className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border ${
                      alertActive
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-amber-50 hover:text-amber-700'
                    }`}
                  >
                    {alertActive ? (
                      <>
                        <BellRing className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                        <span>{lang === 'es' ? 'Alerta de oferta activa' : 'Price alert active'}</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-3.5 h-3.5 text-gray-400" />
                        <span>{lang === 'es' ? 'Avisarme si baja de precio' : 'Alert me if price drops'}</span>
                      </>
                    )}
                  </button>

                  {/* Move to cart & details */}
                  <div className="flex gap-2">
                    <Link
                      to={`/comic/${comic.id}`}
                      className="btn-secondary text-center text-xs py-2 px-3 rounded-lg flex-1 font-medium"
                    >
                      {t('viewDetails')}
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleMoveToCart(comic)}
                      className="btn-primary py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
                      title={t('moveToCart')}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>{t('moveToCart')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Wishlist
