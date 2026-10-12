import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, Search, User, Bookmark, X, LogOut, Shield } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useLanguage } from '../../context/LanguageContext'
import { useFavorites } from '../../context/FavoritesContext'
import { useSearch } from '../../context/SearchContext'

const Header = () => {
  const { items } = useCart()
  const { favorites } = useFavorites()
  const { lang, setLanguage, t } = useLanguage()
  const { searchTerm, setSearchTerm, clearSearch } = useSearch()
  const navigate = useNavigate()
  const location = useLocation()

  const cartItemCount = items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
  const favoritesCount = favorites.length

  const [showProfile, setShowProfile] = useState(false)
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null

  const displayName = user?.nombre || user?.email?.split('@')[0] || ''
  const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : ''

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    const loginUrl = import.meta.env.VITE_LOGIN_URL || 'http://arcadia-login-arcadi.s3-website-us-east-1.amazonaws.com'
    window.location.href = loginUrl
  }

  const handleGoToLogin = () => {
    const loginUrl = import.meta.env.VITE_LOGIN_URL || 'http://arcadia-login-arcadi.s3-website-us-east-1.amazonaws.com'
    window.location.href = loginUrl
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    // Si no estamos en la página principal ni en el catálogo, redirigir suavemente al catálogo
    if (location.pathname !== '/' && location.pathname !== '/comics') {
      navigate('/')
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 relative print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white font-black text-xl shadow-sm shadow-primary-500/20 font-heading">
              A
            </div>
            <div className="text-xl sm:text-2xl font-black text-primary-600 tracking-tight font-heading">
              Arcadia <span className="text-slate-900 font-bold">Comics</span>
            </div>
          </Link>

          {/* Real-time Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-10 pr-9 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-all"
              />
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2.5 top-2.5 p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-2 sm:space-x-3">
            {/* Language Selector Button */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
              <button
                type="button"
                onClick={() => setLanguage('es')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  lang === 'es'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Cambiar a Español"
              >
                <span>🇪🇸</span>
                <span>ES</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  lang === 'en'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Switch to English"
              >
                <span>🇺🇸</span>
                <span>EN</span>
              </button>
            </div>

            {/* Profile Dropdown & Avatar */}
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2 border border-transparent hover:border-gray-200"
                title={t('profileTitle')}
              >
                {user ? (
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {displayInitial}
                  </div>
                ) : (
                  <User className="h-6 w-6 text-gray-600" />
                )}
                {user && (
                  <span className="text-xs font-semibold text-gray-700 hidden sm:inline max-w-[100px] truncate">
                    {displayName}
                  </span>
                )}
              </button>

              {showProfile && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 py-3 px-4 z-50 animate-in fade-in duration-150">
                  {user ? (
                    <div>
                      <div className="border-b border-gray-100 pb-3 mb-2">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('activeSession')}</p>
                        <p className="text-sm font-bold text-gray-800 mt-0.5 truncate">{user.nombre || displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-[11px] font-medium border border-primary-100">
                          <Shield className="w-3 h-3 text-primary-600" />
                          {user.rol || 'Cliente Arcadia'}
                        </span>
                      </div>

                      <div className="space-y-1 mb-2">
                        <Link
                          to="/perfil"
                          onClick={() => setShowProfile(false)}
                          className="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <User className="w-4 h-4 text-primary-600" />
                          <span>{t('myProfile')}</span>
                        </Link>
                        <Link
                          to="/wishlist"
                          onClick={() => setShowProfile(false)}
                          className="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-gray-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Bookmark className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span>{t('myWishlist')}</span>
                          {favoritesCount > 0 && (
                            <span className="ml-auto bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              {favoritesCount}
                            </span>
                          )}
                        </Link>
                      </div>

                      <div className="border-t border-gray-100 pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 text-left text-xs text-red-600 hover:text-red-700 font-semibold py-1.5 px-2.5 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{t('logout')}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-600 mb-3">{t('notLoggedIn')}</p>
                      <button
                        onClick={handleGoToLogin}
                        className="w-full btn-primary text-xs py-2 text-center rounded-xl shadow-sm"
                      >
                        {t('login')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist Button (Clean, elegant Bookmark with subtle indicator) */}
            <button
              onClick={() => navigate('/wishlist')}
              className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors flex items-center"
              title={`${t('wishlist')}${favoritesCount > 0 ? ` (${favoritesCount})` : ''}`}
            >
              <Bookmark className={`h-5 w-5 transition-colors ${favoritesCount > 0 ? 'text-amber-500 fill-amber-500' : 'text-gray-600'}`} />
              {favoritesCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white"></span>
              )}
            </button>

            {/* Cart Icon */}
            <button
              onClick={() => navigate('/cart')}
              className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
              title={t('shoppingCart')}
            >
              <ShoppingCart className="h-5 w-5 text-gray-600" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-sm">
                  {cartItemCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Real-time Search (Mobile) */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-9 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-gray-50"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 top-2.5 p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
