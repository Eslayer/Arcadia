import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, Lock, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import ComicCover from '../components/ComicCover'
import CheckoutModal from '../components/CheckoutModal'
import OrderReceiptModal, { ReceiptData } from '../components/OrderReceiptModal'

const Cart = () => {
  const { items, total, updateQuantity, removeFromCart, clearCart } = useCart()
  const { t, lang } = useLanguage()
  const { showToast } = useToast()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [completedReceipt, setCompletedReceipt] = useState<ReceiptData | null>(null)

  const shipping = total >= 50 ? 0 : 5.99
  const tax = total * 0.08
  const finalTotal = total + shipping + tax

  // Detectar retorno desde la pasarela WebPay Plus
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const payment = params.get('payment')

    if (payment === 'success') {
      const orderId = params.get('orderId') || `ORD-${Date.now().toString().substring(6)}`
      const authCode = params.get('authCode') || ''
      const amountParam = params.get('amount')
      const paidTotal = amountParam ? parseFloat(amountParam) : finalTotal

      // Recuperar los datos del carrito/despacho guardados antes de la redirección
      const pendingRaw = localStorage.getItem('arcadia_pending_checkout')
      let pendingData: any = null
      if (pendingRaw) {
        try {
          pendingData = JSON.parse(pendingRaw)
        } catch (e) {
          console.error('Error parseando pending checkout', e)
        }
      }

      const receipt: ReceiptData = {
        orderId,
        createdAt: new Date().toISOString(),
        status: 'APPROVED',
        customerName: pendingData?.customerName || 'Cliente Arcadia',
        customerEmail: pendingData?.customerEmail || 'cliente@arcadiacomics.com',
        shippingAddress: pendingData?.shippingAddress || {
          address: 'Av. Providencia 1234, Depto 402',
          city: 'Santiago, Región Metropolitana',
          phone: '+56 9 8765 4321',
        },
        items: pendingData?.items || items,
        subtotal: pendingData?.subtotal || total,
        shipping: pendingData?.shipping ?? shipping,
        tax: pendingData?.tax ?? tax,
        total: paidTotal || pendingData?.total || finalTotal,
        last4Digits: '6623',
        authorizationCode: authCode,
      }

      clearCart()
      localStorage.removeItem('arcadia_pending_checkout')
      setCompletedReceipt(receipt)

      showToast(
        lang === 'es'
          ? '¡Pago aprobado en WebPay Plus! Evento publicado en Amazon SNS y distribuido por Fan-Out a colas SQS.'
          : 'Payment approved on WebPay Plus! Event published to Amazon SNS and fanned out to SQS queues.',
        'success',
        {
          title: lang === 'es' ? 'Transbank WebPay Plus' : 'Transbank WebPay Plus',
          iconType: 'order',
        }
      )

      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (payment === 'cancelled') {
      showToast(
        lang === 'es'
          ? 'La compra fue cancelada en el portal de Transbank WebPay.'
          : 'Payment was cancelled on Transbank WebPay.',
        'warning'
      )
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (payment === 'rejected') {
      showToast(
        lang === 'es'
          ? 'El pago fue rechazado por WebPay. Por favor intenta nuevamente.'
          : 'Payment was rejected by WebPay. Please try again.',
        'error'
      )
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (payment === 'error') {
      const msg = params.get('message') || 'Error al procesar el pago'
      showToast(msg, 'error')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [lang, showToast, clearCart, total, finalTotal, shipping, tax, items])

  const handleProceedToCheckout = () => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    if (!token && !user) {
      setShowLoginModal(true)
      return
    }
    setShowCheckoutModal(true)
  }

  const handleGoToLogin = () => {
    const loginUrl = import.meta.env.VITE_LOGIN_URL || 'http://arcadia-login-arcadi.s3-website-us-east-1.amazonaws.com'
    window.location.href = loginUrl
  }

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id)
    } else {
      updateQuantity(id, newQuantity)
    }
  }

  const handleCheckoutSuccess = (receipt: ReceiptData) => {
    clearCart()
    setShowCheckoutModal(false)
    setCompletedReceipt(receipt)
  }

  if (items.length === 0 && !completedReceipt) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('emptyCartTitle')}</h1>
          <p className="text-gray-600 mb-8">{t('emptyCartSubtitle')}</p>
          <Link to="/" className="btn-primary">
            {t('continueShopping')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('shoppingCart')}</h1>
        <p className="text-gray-600">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm">
            {/* Header */}
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t('shoppingCart')}</h2>
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  {t('clearCart')}
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="divide-y divide-gray-200">
              {items.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-20 h-28 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                      <ComicCover
                        src={item.coverImage}
                        alt={item.title}
                        title={item.title}
                        genre={item.genre}
                        publisher={item.publisher}
                        className="w-20 h-28 object-cover rounded"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-600">{item.author}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="p-1 rounded border border-gray-300 hover:bg-gray-100"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="p-1 rounded border border-gray-300 hover:bg-gray-100"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            ${item.price.toFixed(2)} c/u
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Continue Shopping */}
          <div className="mt-6">
            <Link
              to="/"
              className="btn-secondary inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('continueShopping')}
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">{t('orderSummary')}</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>{t('subtotal')}</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{t('shipping')}</span>
                <span>{shipping === 0 ? t('free') : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{t('tax')}</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>{t('total')}</span>
                  <span className="text-primary-600">
                    ${finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {total < 50 && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-primary-700">
                  {t('freeShippingNotice').replace('{amount}', (50 - total).toFixed(2))}
                </p>
              </div>
            )}

            <button
              onClick={handleProceedToCheckout}
              className="w-full btn-primary py-3 mb-3 flex items-center justify-center gap-2 shadow-sm font-semibold"
            >
              <Lock className="w-4 h-4" />
              {t('proceedToCheckout')}
            </button>

            <p className="text-xs text-gray-500 text-center">
              {t('secureCheckoutNotice')}
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Iniciar Sesión Obligatorio para Comprar */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary-200">
              <Lock className="w-7 h-7" />
            </div>

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('loginRequiredToBuy')}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('loginToBuyDesc')}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGoToLogin}
                className="w-full btn-primary py-3 text-center text-sm font-semibold shadow-md flex items-center justify-center gap-2"
              >
                <span>{t('loginNow')}</span>
              </button>

              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Formulario de Pago y Finalización (CheckoutModal) */}
      {showCheckoutModal && (
        <CheckoutModal
          items={items}
          subtotal={total}
          shipping={shipping}
          tax={tax}
          total={finalTotal}
          onSuccess={handleCheckoutSuccess}
          onClose={() => setShowCheckoutModal(false)}
        />
      )}

      {/* Modal: Recibo Oficial Imprimible / Voucher de Compra (OrderReceiptModal) */}
      {completedReceipt && (
        <OrderReceiptModal
          receipt={completedReceipt}
          onClose={() => setCompletedReceipt(null)}
        />
      )}
    </div>
  )
}

export default Cart
