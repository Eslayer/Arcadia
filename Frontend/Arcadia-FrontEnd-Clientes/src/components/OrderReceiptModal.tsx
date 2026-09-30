import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Printer, ArrowRight, X, ShieldCheck, Package } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface ReceiptItem {
  id?: string;
  comicId: string;
  title: string;
  quantity: number;
  price: number;
}

export interface ReceiptData {
  orderId: string;
  createdAt: string;
  status: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: {
    address: string;
    city: string;
    phone: string;
  };
  items: ReceiptItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  last4Digits: string;
}

interface OrderReceiptModalProps {
  receipt: ReceiptData;
  onClose: () => void;
}

const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({ receipt, onClose }) => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  const handleGoToProfile = () => {
    onClose();
    navigate('/perfil');
  };

  const formattedDate = new Date(receipt.createdAt).toLocaleString(
    lang === 'es' ? 'es-ES' : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 print:bg-white print:p-0 print:static">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden my-8 print:shadow-none print:border-none print:m-0 print:w-full print:max-w-none">
        {/* Modal Top Bar (Hidden in print) */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{lang === 'es' ? '¡Orden Confirmada en AWS Cloud!' : 'Order Confirmed in AWS Cloud!'}</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-200 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Content */}
        <div className="p-6 sm:p-8 print:p-6" id="printable-receipt">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-black text-lg">
                  A
                </div>
                <h2 className="text-2xl font-black tracking-tight text-gray-900">Arcadia Comics</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {lang === 'es' ? 'Plataforma Cloud Native de Cómics & Coleccionables' : 'Cloud Native Platform for Comics & Collectibles'}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md w-fit">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'es' ? 'Transacción Cifrada y Persistida en RDS' : 'Encrypted & Persisted Transaction on RDS'}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-primary-100">
                {receipt.status === 'APPROVED' ? (lang === 'es' ? 'PAGADO' : 'PAID') : receipt.status}
              </span>
              <p className="text-xs font-mono text-gray-400 mt-2">{lang === 'es' ? 'Voucher' : 'Voucher'} #{receipt.orderId.substring(0, 8)}</p>
              <p className="text-xs text-gray-500">{formattedDate}</p>
            </div>
          </div>

          {/* Customer & Shipping Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 text-xs sm:text-sm">
            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[11px] mb-1">
                {lang === 'es' ? 'Datos del Cliente' : 'Customer Info'}
              </p>
              <p className="font-bold text-gray-800">{receipt.customerName}</p>
              <p className="text-gray-600">{receipt.customerEmail}</p>
              <p className="text-gray-500 mt-1">
                {lang === 'es' ? 'Pago con tarjeta' : 'Paid with card'}: •••• {receipt.last4Digits}
              </p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[11px] mb-1">
                {lang === 'es' ? 'Dirección de Entrega' : 'Shipping Destination'}
              </p>
              <p className="font-medium text-gray-800">{receipt.shippingAddress.address}</p>
              <p className="text-gray-600">{receipt.shippingAddress.city}</p>
              <p className="text-gray-500 mt-1">{lang === 'es' ? 'Contacto' : 'Phone'}: {receipt.shippingAddress.phone}</p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              {lang === 'es' ? 'Cómics Adquiridos' : 'Purchased Items'}
            </h4>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">{lang === 'es' ? 'Descripción' : 'Description'}</th>
                    <th className="py-2.5 px-3 text-center font-semibold">{lang === 'es' ? 'Cant.' : 'Qty'}</th>
                    <th className="py-2.5 px-3 text-right font-semibold">{lang === 'es' ? 'Precio Unit.' : 'Unit Price'}</th>
                    <th className="py-2.5 px-4 text-right font-semibold">{lang === 'es' ? 'Total' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {receipt.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-medium text-gray-800">{item.title}</td>
                      <td className="py-3 px-3 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-3 px-3 text-right text-gray-600">${item.price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="flex justify-end mb-6">
            <div className="w-full sm:w-64 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{lang === 'es' ? 'Subtotal' : 'Subtotal'}:</span>
                <span className="font-medium">${receipt.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{lang === 'es' ? 'Envío asegurado' : 'Shipping'}:</span>
                <span className="font-medium">{receipt.shipping === 0 ? (lang === 'es' ? 'GRATIS' : 'FREE') : `$${receipt.shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{lang === 'es' ? 'Impuestos (8%)' : 'Tax (8%)'}:</span>
                <span className="font-medium">${receipt.tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold text-gray-900">
                <span>{lang === 'es' ? 'Total Pagado' : 'Total Paid'}:</span>
                <span className="text-primary-600 text-lg">${receipt.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Cloud Native Notice Footer */}
          <div className="text-center pt-4 border-t border-dashed border-gray-200">
            <p className="text-xs text-gray-400">
              {lang === 'es'
                ? 'Comprobante electrónico emitido por Arcadia Comics • Microservicio ms-ventas (AWS EC2 / RDS MySQL)'
                : 'Electronic receipt issued by Arcadia Comics • ms-ventas microservice (AWS EC2 / RDS MySQL)'}
            </p>
            <p className="text-[11px] text-gray-300 font-mono mt-0.5">ID: {receipt.orderId}</p>
          </div>
        </div>

        {/* Modal Actions (Hidden in Print) */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row gap-3 justify-between items-center print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'es' ? 'Imprimir / Guardar en PDF' : 'Print / Save as PDF'}</span>
          </button>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleGoToProfile}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-50 text-primary-700 hover:bg-primary-100 font-semibold rounded-xl text-sm transition-all"
            >
              <span>{lang === 'es' ? 'Ver en Mi Perfil' : 'View in Profile'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-primary py-2.5 px-6 text-sm font-semibold rounded-xl"
            >
              {lang === 'es' ? 'Aceptar' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderReceiptModal;
