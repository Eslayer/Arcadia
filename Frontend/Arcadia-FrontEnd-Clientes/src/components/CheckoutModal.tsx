import React, { useState } from 'react';
import { Lock, MapPin, AlertCircle, Loader2, X, Shield, ExternalLink, ArrowRight, CreditCard } from 'lucide-react';
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
  onClose,
}) => {
  const { lang } = useLanguage();
  const { showToast } = useToast();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  // Estados del formulario de entrega
  const [address, setAddress] = useState('Av. Providencia 1234, Depto 402');
  const [city, setCity] = useState('Santiago, Región Metropolitana');
  const [phone, setPhone] = useState('+56 9 8765 4321');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!address.trim() || !city.trim() || !phone.trim()) {
      setErrorMessage(
        lang === 'es'
          ? 'Por favor completa todos los campos de despacho.'
          : 'Please complete all shipping fields.'
      );
      return;
    }

    try {
      setLoading(true);

      // Guardar el contexto del checkout pendiente en localStorage para armar el recibo al volver de WebPay
      localStorage.setItem(
        'arcadia_pending_checkout',
        JSON.stringify({
          items,
          subtotal,
          shipping,
          tax,
          total,
          shippingAddress: {
            address,
            city,
            phone,
          },
          customerName: user?.nombre || user?.email?.split('@')[0] || 'Cliente Arcadia',
          customerEmail: user?.email || 'cliente@arcadiacomics.com',
        })
      );

      const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8083';

      // Payload para iniciar orden y Webpay
      const payload = {
        userId: user?.email || user?.id || 'cliente@arcadiacomics.com',
        totalAmount: Number(total.toFixed(2)),
        items: items.map((item) => ({
          comicId: String(item.id),
          quantity: item.quantity,
        })),
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
        const serverMsg = errorData?.message || `Error ${response.status}: No se pudo inicializar la orden con WebPay`;
        throw new Error(serverMsg);
      }

      const orderData = await response.json();

      if (!orderData.webpayUrl || !orderData.webpayToken) {
        throw new Error(
          lang === 'es'
            ? 'El servidor no retornó la URL o token de WebPay Plus.'
            : 'Server did not return WebPay Plus URL or token.'
        );
      }

      showToast(
        lang === 'es'
          ? 'Redirigiendo al ambiente de integración de Transbank WebPay...'
          : 'Redirecting to Transbank WebPay Integration...',
        'info'
      );

      // Redirección oficial a Transbank WebPay Plus mediante formulario POST
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = orderData.webpayUrl;

      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'token_ws';
      tokenInput.value = orderData.webpayToken;

      form.appendChild(tokenInput);
      document.body.appendChild(form);
      form.submit();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al conectar con WebPay Plus');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-amber-600 p-6 text-white relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md text-white rounded-xl border border-white/20">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-heading">
                {lang === 'es' ? 'Finalizar Compra con WebPay Plus' : 'Secure WebPay Plus Checkout'}
              </h3>
              <p className="text-xs text-white/90">
                {lang === 'es'
                  ? 'Ambiente de Integración Transbank & Despacho Amazon SQS'
                  : 'Transbank Integration & Amazon SQS Dispatch'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Order Snapshot */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 flex items-center justify-between text-sm">
            <div>
              <span className="text-slate-800 font-medium block">
                {lang === 'es' ? `Total a pagar (${items.length} cómics):` : `Total due (${items.length} items):`}
              </span>
              <span className="text-xs text-slate-500">
                {lang === 'es' ? 'Monto procesado en Pesos Chilenos (CLP)' : 'Processed in Chilean Pesos (CLP)'}
              </span>
            </div>
            <span className="text-2xl font-black text-amber-700 font-mono">${total.toFixed(2)}</span>
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
              <MapPin className="w-3.5 h-3.5 text-red-600" />
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Pasarela WebPay Plus */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-red-600" />
                {lang === 'es' ? '2. Pasarela Transbank WebPay Plus' : '2. Transbank WebPay Plus Gateway'}
              </h4>
              <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                Testing / Integración
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              {lang === 'es'
                ? 'Al presionar "Pagar", serás redirigido al portal oficial de pruebas de WebPay Plus de Transbank para ingresar tus credenciales de prueba de Débito o Crédito.'
                : 'When clicking "Pay", you will be safely redirected to Transbank\'s official WebPay Plus testing environment.'}
            </p>

            <div className="bg-white border border-slate-200 rounded-lg p-3 text-[11px] text-gray-600 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>{lang === 'es' ? 'Flujo de Integración Arcadia:' : 'Arcadia Integration Flow:'}</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-gray-500">
                <li>{lang === 'es' ? 'Inicio de transacción en Transbank WebPay v1.2' : 'Initiate transaction on Webpay v1.2'}</li>
                <li>{lang === 'es' ? 'Autorización de pago en la pasarela de prueba' : 'Payment approval on test gateway'}</li>
                <li>{lang === 'es' ? 'Confirmación automática (commit) en ms-ventas' : 'Automatic commit in ms-ventas'}</li>
                <li>
                  <strong className="text-amber-700">
                    {lang === 'es' ? 'Despacho de mensaje a Amazon SQS al completar el pago' : 'Dispatch message to Amazon SQS upon completion'}
                  </strong>
                </li>
              </ul>
            </div>
          </div>

          {/* Security badge */}
          <div className="flex items-center gap-2 text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
            <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              {lang === 'es'
                ? 'Conexión cifrada SSL con WebPay Plus y cola Amazon SQS en AWS Cloud.'
                : 'SSL encrypted connection with WebPay Plus and Amazon SQS in AWS Cloud.'}
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
              className="flex-1 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'es' ? 'Redirigiendo a WebPay...' : 'Redirecting to WebPay...'}</span>
                </>
              ) : (
                <>
                  <span>{lang === 'es' ? `Pagar $${total.toFixed(2)}` : `Pay $${total.toFixed(2)}`}</span>
                  <ExternalLink className="w-4 h-4" />
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
