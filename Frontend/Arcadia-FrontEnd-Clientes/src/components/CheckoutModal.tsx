import React, { useState } from 'react';
import { Lock, CreditCard, MapPin, CheckCircle, AlertCircle, Loader2, Sparkles, X, Shield } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { ReceiptData } from './OrderReceiptModal';

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  coverImage?: string;
}

interface CheckoutModalProps {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  onSuccess: (receipt: ReceiptData) => void;
  onClose: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  items,
  subtotal,
  shipping,
  tax,
  total,
  onSuccess,
  onClose,
}) => {
  const { lang } = useLanguage();
  const { showToast } = useToast();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  // Form states
  const [address, setAddress] = useState('Av. Providencia 1234, Depto 402');
  const [city, setCity] = useState('Santiago, Región Metropolitana');
  const [phone, setPhone] = useState('+56 9 8765 4321');
  const [cardNumber, setCardNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [ccv, setCcv] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper para llenar con tarjeta de prueba académica de 16 dígitos
  const fillTestCard = () => {
    setCardNumber('4111 2222 3333 4444');
    setExpirationDate('12/28');
    setCcv('123');
    setErrorMessage(null);
  };

  // Formateador visual de tarjeta: 0000 0000 0000 0000
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').substring(0, 16);
    const parts = raw.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(' ') : raw);
  };

  // Formateador de fecha de expiración: MM/YY
  const handleExpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (raw.length >= 3) {
      raw = raw.substring(0, 2) + '/' + raw.substring(2);
    }
    setExpirationDate(raw);
  };

  const handleCcvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').substring(0, 3);
    setCcv(raw);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (cleanCard.length !== 16) {
      setErrorMessage(lang === 'es' ? 'El número de tarjeta debe tener exactamente 16 dígitos.' : 'Card number must be 16 digits.');
      return;
    }

    if (!expirationDate.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
      setErrorMessage(lang === 'es' ? 'La fecha de expiración debe tener el formato MM/YY (ej: 12/28).' : 'Expiration must match MM/YY.');
      return;
    }

    if (ccv.length !== 3) {
      setErrorMessage(lang === 'es' ? 'El código CCV debe tener 3 dígitos.' : 'CCV must be 3 digits.');
      return;
    }

    try {
      setLoading(true);
      const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'https://67mry3gq69.execute-api.us-east-1.amazonaws.com';

      // Construcción del payload conforme a CheckoutRequest en ms-ventas
      const payload = {
        userId: user?.email || user?.id || 'cliente@arcadiacomics.com',
        totalAmount: Number(total.toFixed(2)),
        items: items.map((item) => ({
          comicId: String(item.id),
          quantity: item.quantity,
        })),
        cardNumber: cleanCard,
        expirationDate: expirationDate,
        ccv: ccv,
      };

      const response = await fetch(`${gatewayUrl}/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const serverMsg = errorData?.message || `Error ${response.status}: No se pudo procesar la compra`;
        throw new Error(serverMsg);
      }

      const orderData = await response.json();

      // Notificación Toast flotante
      showToast(
        lang === 'es' ? '¡Pago aprobado y orden guardada en AWS RDS!' : 'Payment approved and order stored in AWS RDS!',
        'success',
        {
          title: lang === 'es' ? 'Compra Exitosa' : 'Successful Order',
          iconType: 'order',
        }
      );

      // Armar la estructura del recibo oficial
      const receipt: ReceiptData = {
        orderId: orderData.id || `ORD-${Date.now().toString().substring(6)}`,
        createdAt: orderData.createdAt || new Date().toISOString(),
        status: orderData.status || 'APPROVED',
        customerName: user?.nombre || user?.email?.split('@')[0] || 'Cliente Arcadia',
        customerEmail: user?.email || 'cliente@arcadiacomics.com',
        shippingAddress: {
          address,
          city,
          phone,
        },
        items: items.map((item) => ({
          comicId: item.id,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal,
        shipping,
        tax,
        total,
        last4Digits: cleanCard.substring(12),
      };

      onSuccess(receipt);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al conectar con el microservicio de ventas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">
                {lang === 'es' ? 'Finalizar Compra Segura' : 'Secure Checkout'}
              </h3>
              <p className="text-xs text-primary-100">
                {lang === 'es'
                  ? 'Conexión cifrada con Microservicio Ventas (AWS EC2 / RDS)'
                  : 'Encrypted connection with Sales Microservice (AWS EC2 / RDS)'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Order Snapshot */}
          <div className="bg-primary-50/60 rounded-xl p-3.5 border border-primary-100 flex items-center justify-between text-sm">
            <span className="text-primary-900 font-medium">
              {lang === 'es' ? `Total a pagar (${items.length} productos):` : `Total due (${items.length} items):`}
            </span>
            <span className="text-lg font-bold text-primary-700">${total.toFixed(2)}</span>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Dirección de Despacho */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary-600" />
              {lang === 'es' ? '1. Datos de Despacho' : '1. Shipping Address'}
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {lang === 'es' ? 'Dirección (Calle y Número / Depto)' : 'Street Address'}
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej: Av. Providencia 1234, Depto 402"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {lang === 'es' ? 'Ciudad / Región' : 'City / State'}
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Santiago"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {lang === 'es' ? 'Teléfono de Contacto' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+56 9 8765 4321"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Pago con Tarjeta */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-primary-600" />
                {lang === 'es' ? '2. Método de Pago (Simulado)' : '2. Payment Method (Simulated)'}
              </h4>

              {/* Botón Tarjeta Demo */}
              <button
                type="button"
                onClick={fillTestCard}
                className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-semibold bg-primary-50 hover:bg-primary-100 px-2.5 py-1 rounded-md transition-colors"
                title="Rellenar datos de tarjeta para prueba rápida"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{lang === 'es' ? 'Usar Tarjeta de Prueba' : 'Use Test Card'}</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {lang === 'es' ? 'Número de Tarjeta (16 dígitos)' : 'Card Number (16 digits)'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="4111 2222 3333 4444"
                    maxLength={19}
                    className="w-full pl-10 pr-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                  <CreditCard className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {lang === 'es' ? 'Vencimiento (MM/YY)' : 'Expires (MM/YY)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={expirationDate}
                    onChange={handleExpChange}
                    placeholder="12/28"
                    maxLength={5}
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {lang === 'es' ? 'Código CCV (3 dígitos)' : 'CCV (3 digits)'}
                  </label>
                  <input
                    type="password"
                    required
                    value={ccv}
                    onChange={handleCcvChange}
                    placeholder="123"
                    maxLength={3}
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security badge */}
          <div className="flex items-center gap-2 text-[11px] text-gray-400 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
            <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>
              {lang === 'es'
                ? 'Conexión SSL de 256 bits protegida por AWS API Gateway y ALB.'
                : '256-bit SSL encrypted connection through AWS API Gateway & ALB.'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'es' ? 'Procesando en AWS...' : 'Processing in AWS...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{lang === 'es' ? `Pagar $${total.toFixed(2)}` : `Pay $${total.toFixed(2)}`}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutModal;
