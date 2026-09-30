import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import ComicDetail from './pages/ComicDetail'
import Cart from './pages/Cart'
import Favorites from './pages/Favorites'
import Profile from './pages/Profile'
import { CartProvider } from './context/CartContext'
import { LanguageProvider } from './context/LanguageContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { ToastProvider } from './context/ToastContext'
import { SearchProvider } from './context/SearchContext'

function App() {
  useEffect(() => {
    // 1. Capturar token y datos de usuario si vienen en los query params
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userStr = params.get('user');

    if (token) {
      localStorage.setItem('token', token);
    }
    if (userStr) {
      localStorage.setItem('user', userStr);
    }

    // 2. Limpiar la barra de direcciones inmediatamente para que la URL se vea limpia y profesional
    if (token || userStr) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <LanguageProvider>
      <ToastProvider>
        <FavoritesProvider>
          <CartProvider>
            <SearchProvider>
              <div className="min-h-screen flex flex-col bg-gray-50">
                <Header />
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/comics" element={<Home />} />
                    <Route path="/new-releases" element={<Home />} />
                    <Route path="/bestsellers" element={<Home />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/wishlist" element={<Favorites />} />
                    <Route path="/perfil" element={<Profile />} />
                    <Route path="/comic/:id" element={<ComicDetail />} />
                    <Route path="/cart" element={<Cart />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </SearchProvider>
          </CartProvider>
        </FavoritesProvider>
      </ToastProvider>
    </LanguageProvider>
  )
}

export default App
