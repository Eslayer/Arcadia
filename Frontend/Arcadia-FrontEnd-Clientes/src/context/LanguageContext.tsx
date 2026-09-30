import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'es' | 'en';

interface LanguageContextType {
  lang: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  es: {
    // Header
    searchPlaceholder: 'Buscar cómics...',
    profileTitle: 'Perfil de Usuario',
    activeSession: 'Sesión Activa',
    logout: 'Cerrar Sesión',
    notLoggedIn: 'No has iniciado sesión',
    login: 'Iniciar Sesión',
    role: 'Rol',
    // Home Banner
    welcomeTitle: 'Bienvenidos a Arcadia Comics',
    welcomeSubtitle: 'Descubre historias increíbles de tus editoriales favoritas',
    shopNow: 'Explorar Catálogo',
    // Filters & Sort
    allGenres: 'Todos los Géneros',
    sortByTitle: 'Ordenar por Título',
    sortPriceLow: 'Precio: Menor a Mayor',
    sortPriceHigh: 'Precio: Mayor a Menor',
    sortDate: 'Más Recientes Primero',
    showingComics: 'Mostrando {count} cómics',
    loadingComics: 'Cargando catálogo de cómics...',
    noComicsFound: 'No se encontraron cómics con estos filtros.',
    // Comic Card & Actions
    viewDetails: 'Ver Detalles',
    addToCart: 'Añadir al Carrito',
    addedToCart: '¡Añadido!',
    // Comic Detail
    byAuthor: 'por',
    description: 'Descripción',
    comicInfo: 'Información del Cómic',
    publisher: 'Editorial',
    releaseDate: 'Fecha de Lanzamiento',
    genre: 'Género',
    pages: 'Páginas',
    pagesCount: '{count} páginas',
    language: 'Idioma',
    back: 'Volver',
    productDetails: 'Detalles del Producto',
    officialPublisher: 'Editorial oficial:',
    formatCollector: 'Formato: Edición de colección, {pages} páginas ({lang})',
    availabilityStock: 'Disponibilidad: {stock} unidades en almacén',
    outOfStock: 'Agotado temporalmente',
    skuCode: 'Código SKU:',
    shippingInfo: 'Envíos: Despacho asegurado con seguimiento en 2-3 días hábiles',
    freeShippingOver50: 'Envío gratuito: En órdenes superiores a $50',
    returnWarranty: 'Garantía: Devolución sin costo antes de 30 días',
    // Ratings & Reviews
    customerReviews: 'Opiniones y Reseñas de Clientes',
    noReviewsYet: 'Sin calificaciones aún. ¡Sé el primero en calificar este cómic!',
    basedOnReviews: 'basado en {count} valoraciones',
    leaveReviewTitle: 'Deja tu valoración',
    writeYourReview: 'Escribe tu opinión sobre la historia, el arte o la edición...',
    publishReview: 'Publicar Calificación',
    mustLoginToReview: 'Inicia sesión para dejar tu calificación.',
    yourRating: 'Tu Calificación:',
    postingAs: 'Publicando como:',
    guestUser: 'Lector Invitado',
    reviewSuccess: '¡Gracias! Tu reseña ha sido publicada.',
    selectRatingError: 'Por favor selecciona una calificación de 1 a 5 estrellas.',
    // Cart & Checkout
    shoppingCart: 'Carrito de Compras',
    emptyCartTitle: 'Tu carrito está vacío',
    emptyCartSubtitle: 'Parece que aún no has agregado ningún cómic a tu carrito.',
    continueShopping: 'Continuar Comprando',
    clearCart: 'Vaciar Carrito',
    orderSummary: 'Resumen de la Orden',
    subtotal: 'Subtotal',
    shipping: 'Envío',
    free: 'Gratis',
    tax: 'Impuestos (8%)',
    total: 'Total a Pagar',
    proceedToCheckout: 'Proceder al Pago',
    secureCheckoutNotice: 'Compra protegida y cifrada por Arcadia Comics',
    freeShippingNotice: '¡Agrega ${amount} más para obtener envío gratis!',
    loginRequiredToBuy: 'Necesitas iniciar sesión para comprar',
    loginToBuyDesc: 'Para procesar tu orden y proteger tu compra, inicia sesión con tu cuenta de Arcadia.',
    loginNow: 'Iniciar Sesión',
    close: 'Cerrar',
    // Wishlist & UI (Antes Favoritos)
    wishlist: 'Lista de Deseos',
    myWishlist: 'Mi Lista de Deseos & Ofertas',
    noWishlistYet: 'Tu lista de deseos está vacía',
    noWishlistDesc: 'Guarda los cómics que quieres comprar más adelante. Te avisaremos cuando tengan descuentos o promociones especiales.',
    addToWishlist: 'Guardar en Lista de Deseos',
    removeFromWishlist: 'Quitar de Lista de Deseos',
    priceDropAlert: 'Notificarme si baja de precio',
    priceDropAlertActive: '🔔 Alerta de descuento activada',
    priceDropToast: '¡Alerta activada! Te avisaremos si este cómic baja de precio o entra en oferta.',
    moveToCart: 'Mover al Carrito',
    wishlistSpecialDeal: 'Oferta Exclusiva Wishlist (-15%)',
    // Compatibilidad retroactiva
    favorites: 'Lista de Deseos',
    myFavorites: 'Mi Lista de Deseos & Ofertas',
    noFavoritesYet: 'Tu lista de deseos está vacía',
    noFavoritesDesc: 'Guarda los cómics que quieres comprar más adelante. Te avisaremos cuando tengan descuentos o promociones especiales.',
    addToFavorites: 'Guardar en Lista de Deseos',
    removeFromFavorites: 'Quitar de Lista de Deseos',
    noImageAvailable: 'Sin imagen disponible',
    catalogScrollNotice: 'Desplaza hacia abajo dentro del catálogo para ver más cómics',
    // Profile & Orders
    myProfile: 'Mi Perfil',
    cloudOrderHistory: 'Historial de Compras en la Nube',
    noOrdersTitle: 'Aún no has realizado ninguna compra',
    noOrdersDesc: 'Explora el catálogo y completa tu primera orden para verla registrada aquí y descargar tu voucher.',
    totalOrders: 'Órdenes Realizadas',
    viewVoucher: 'Ver Voucher',
    printVoucher: 'Imprimir / Guardar en PDF',
    // Toasts
    toastAddedToCart: '¡Cómic añadido al carrito!',
    toastRemovedFromCart: 'Cómic eliminado del carrito',
    toastAddedToFav: '¡Guardado en tu Lista de Deseos!',
    toastRemovedFromFav: 'Eliminado de tu Lista de Deseos',
    toastOrderSuccess: '¡Pago aprobado y orden guardada en AWS RDS!',
    // Footer
    companyDesc: 'Tu destino número uno para cómics, novelas gráficas y manga. Descubre historias legendarias de todas las editoriales.',
    quickLinks: 'Enlaces Rápidos',
    homeLink: 'Inicio',
    allComicsLink: 'Todos los Cómics',
    newReleasesLink: 'Nuevos Lanzamientos',
    bestsellersLink: 'Los Más Vendidos',
    customerService: 'Atención al Cliente',
    contactUs: 'Contáctanos',
    shippingPolicy: 'Información de Envío',
    returnsPolicy: 'Devoluciones y Reembolsos',
    faq: 'Preguntas Frecuentes',
    copyright: '© 2026 Arcadia Comics. Todos los derechos reservados.'
  },
  en: {
    // Header
    searchPlaceholder: 'Search comics...',
    profileTitle: 'User Profile',
    activeSession: 'Active Session',
    logout: 'Log Out',
    notLoggedIn: 'You are not logged in',
    login: 'Log In',
    role: 'Role',
    // Home Banner
    welcomeTitle: 'Welcome to Arcadia Comics',
    welcomeSubtitle: 'Discover amazing stories from your favorite publishers',
    shopNow: 'Shop Now',
    // Filters & Sort
    allGenres: 'All Genres',
    sortByTitle: 'Sort by Title',
    sortPriceLow: 'Price: Low to High',
    sortPriceHigh: 'Price: High to Low',
    sortDate: 'Newest First',
    showingComics: 'Showing {count} comics',
    loadingComics: 'Loading comics catalog...',
    noComicsFound: 'No comics found matching your criteria.',
    // Comic Card & Actions
    viewDetails: 'View Details',
    addToCart: 'Add to Cart',
    addedToCart: 'Added!',
    // Comic Detail
    byAuthor: 'by',
    description: 'Description',
    comicInfo: 'Comic Information',
    publisher: 'Publisher',
    releaseDate: 'Release Date',
    genre: 'Genre',
    pages: 'Pages',
    pagesCount: '{count} pages',
    language: 'Language',
    back: 'Back',
    productDetails: 'Product Details',
    officialPublisher: 'Official Publisher:',
    formatCollector: 'Format: Collector edition, {pages} pages ({lang})',
    availabilityStock: 'Availability: {stock} units in stock',
    outOfStock: 'Temporarily out of stock',
    skuCode: 'SKU Code:',
    shippingInfo: 'Shipping: Insured tracking dispatch in 2-3 business days',
    freeShippingOver50: 'Free shipping: On orders over $50',
    returnWarranty: 'Warranty: 30-day hassle-free returns',
    // Ratings & Reviews
    customerReviews: 'Customer Reviews & Ratings',
    noReviewsYet: 'No reviews yet. Be the first to rate this comic!',
    basedOnReviews: 'based on {count} ratings',
    leaveReviewTitle: 'Leave your rating',
    writeYourReview: 'Write your thoughts about the story, art or edition...',
    publishReview: 'Post Rating',
    mustLoginToReview: 'Log in to submit your rating.',
    yourRating: 'Your Rating:',
    postingAs: 'Posting as:',
    guestUser: 'Guest Reader',
    reviewSuccess: 'Thank you! Your review has been submitted.',
    selectRatingError: 'Please select a rating from 1 to 5 stars.',
    // Cart & Checkout
    shoppingCart: 'Shopping Cart',
    emptyCartTitle: 'Your cart is empty',
    emptyCartSubtitle: "Looks like you haven't added any comics to your cart yet.",
    continueShopping: 'Continue Shopping',
    clearCart: 'Clear Cart',
    orderSummary: 'Order Summary',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    free: 'Free',
    tax: 'Tax (8%)',
    total: 'Total Due',
    proceedToCheckout: 'Proceed to Checkout',
    secureCheckoutNotice: 'Secure checkout encrypted by Arcadia Comics',
    freeShippingNotice: 'Add ${amount} more for free shipping!',
    loginRequiredToBuy: 'You need to log in to complete your purchase',
    loginToBuyDesc: 'To process your order and secure your purchase, please log in with your Arcadia account.',
    loginNow: 'Log In Now',
    close: 'Close',
    // Favorites & UI
    // Wishlist & UI
    wishlist: 'Wishlist',
    myWishlist: 'My Wishlist & Deals',
    noWishlistYet: 'Your wishlist is empty',
    noWishlistDesc: 'Save comics you want to buy later. We will notify you when they are on sale or have special discounts.',
    addToWishlist: 'Save to Wishlist',
    removeFromWishlist: 'Remove from Wishlist',
    priceDropAlert: 'Notify me if price drops',
    priceDropAlertActive: '🔔 Price drop alert active',
    priceDropToast: 'Alert activated! We will notify you if this comic goes on sale.',
    moveToCart: 'Move to Cart',
    wishlistSpecialDeal: 'Exclusive Wishlist Deal (-15%)',
    // Backward compatibility
    favorites: 'Wishlist',
    myFavorites: 'My Wishlist & Deals',
    noFavoritesYet: 'Your wishlist is empty',
    noFavoritesDesc: 'Save comics you want to buy later. We will notify you when they are on sale or have special discounts.',
    addToFavorites: 'Save to Wishlist',
    removeFromFavorites: 'Remove from Wishlist',
    noImageAvailable: 'No image available',
    catalogScrollNotice: 'Scroll down inside the catalog to see more comics',
    // Profile & Orders
    myProfile: 'My Profile',
    cloudOrderHistory: 'Cloud Purchase History',
    noOrdersTitle: 'No purchases yet',
    noOrdersDesc: 'Browse our catalog and place your first order to see it tracked here and download your voucher.',
    totalOrders: 'Total Orders',
    viewVoucher: 'View Voucher',
    printVoucher: 'Print / Save as PDF',
    // Toasts
    toastAddedToCart: 'Comic added to cart!',
    toastRemovedFromCart: 'Comic removed from cart',
    toastAddedToFav: 'Saved to your Wishlist!',
    toastRemovedFromFav: 'Removed from your Wishlist',
    toastOrderSuccess: 'Payment approved and order stored in AWS RDS!',
    // Footer
    companyDesc: 'Your premier destination for comics, graphic novels, and manga. Discover amazing stories from all publishers.',
    quickLinks: 'Quick Links',
    homeLink: 'Home',
    allComicsLink: 'All Comics',
    newReleasesLink: 'New Releases',
    bestsellersLink: 'Bestsellers',
    customerService: 'Customer Service',
    contactUs: 'Contact Us',
    shippingPolicy: 'Shipping Info',
    returnsPolicy: 'Returns & Refunds',
    faq: 'FAQ',
    copyright: '© 2026 Arcadia Comics. All rights reserved.'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('arcadia_lang') as Language) || 'es';
  });

  const setLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('arcadia_lang', newLang);
  };

  const t = (key: string): string => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
