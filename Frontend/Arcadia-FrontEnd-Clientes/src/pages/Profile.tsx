import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, ShoppingBag, Bookmark, Calendar, FileText, ArrowRight, RefreshCw, AlertCircle, LogOut } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../context/FavoritesContext';
import OrderReceiptModal, { ReceiptData } from '../components/OrderReceiptModal';

interface OrderHistoryItem {
  id: string;
  userId: string;
  totalAmount: number;
  status: string;
  items: {
    comicId: string;
    quantity: number;
  }[];
  createdAt: string;
}

const Profile: React.FC = () => {
  const { lang, t } = useLanguage();
  const { favorites } = useFavorites();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  // Obtener inicial para el avatar
  const displayName = user?.nombre || user?.email?.split('@')[0] || 'Cliente';
  const displayInitial = displayName.charAt(0).toUpperCase();

  const fetchOrders = async () => {
    if (!user) return;
    try {
      setLoadingOrders(true);
      setOrdersError(null);
      const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'https://67mry3gq69.execute-api.us-east-1.amazonaws.com';
      const userId = user.email || user.id || 'cliente@arcadiacomics.com';

      const response = await fetch(`${gatewayUrl}/orders/history/${encodeURIComponent(userId)}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudo obtener el historial de compras`);
      }
      const data: OrderHistoryItem[] = await response.json();
      // Ordenar por fecha descendente
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(data);
    } catch (err: any) {
      setOrdersError(err.message || 'Error al conectar con microservicio de ventas');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    const loginUrl = import.meta.env.VITE_LOGIN_URL || 'http://arcadia-login-arcadi.s3-website-us-east-1.amazonaws.com';
    window.location.href = loginUrl;
  };

  const handleGoToLogin = () => {
    const loginUrl = import.meta.env.VITE_LOGIN_URL || 'http://arcadia-login-arcadi.s3-website-us-east-1.amazonaws.com';
    window.location.href = loginUrl;
  };

  const handleViewReceipt = (order: OrderHistoryItem) => {
    const subtotal = order.totalAmount / 1.08;
    const tax = order.totalAmount - subtotal;
    const receipt: ReceiptData = {
      orderId: order.id,
      createdAt: order.createdAt,
      status: order.status,
      customerName: displayName,
      customerEmail: user?.email || 'cliente@arcadiacomics.com',
      shippingAddress: {
        address: 'Dirección registrada en pedido',
        city: 'Chile',
        phone: '+56 9 8765 4321',
      },
      items: order.items?.map((it, idx) => ({
        comicId: it.comicId,
        title: `Cómic #${it.comicId}`,
        quantity: it.quantity,
        price: order.totalAmount / (order.items.length || 1),
      })) || [],
      subtotal: Number(subtotal.toFixed(2)),
      shipping: 0,
      tax: Number(tax.toFixed(2)),
      total: order.totalAmount,
      last4Digits: '4444',
    };
    setSelectedReceipt(receipt);
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary-200">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {lang === 'es' ? 'Perfil de Cliente no disponible' : 'Client Profile not available'}
          </h2>
          <p className="text-gray-600 max-w-md mx-auto mb-6 text-sm">
            {lang === 'es'
              ? 'Para acceder a tus compras, tus cómics favoritos y tu historial de órdenes en la nube, por favor inicia sesión.'
              : 'To access your purchases, favorite comics, and order history in the cloud, please sign in.'}
          </p>
          <button
            onClick={handleGoToLogin}
            className="btn-primary py-2.5 px-6 text-sm font-semibold shadow-md"
          >
            {t('login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with initial or image */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary-600 flex items-center justify-center text-white text-3xl font-black shadow-lg ring-4 ring-primary-50 font-heading">
              {displayInitial}
            </div>
            <span className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-white text-[10px]" title="En línea">
              ✓
            </span>
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{displayName}</h1>
                <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{user.email}</span>
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors self-center sm:self-start"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('logout')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary-100 text-primary-700 rounded-lg">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  {lang === 'es' ? 'Órdenes Realizadas' : 'Total Orders'}
                </p>
                <p className="text-xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>

          <Link
            to="/wishlist"
            className="bg-gray-50 hover:bg-amber-50/50 transition-colors rounded-xl p-4 flex items-center justify-between group cursor-pointer border border-transparent hover:border-amber-100"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-600 rounded-lg">
                <Bookmark className="w-5 h-5 fill-amber-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  {lang === 'es' ? 'Lista de Deseos & Alertas' : 'Wishlist & Deals'}
                </p>
                <p className="text-xl font-bold text-gray-900">{favorites.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 group-hover:translate-x-0.5 transition-transform">
              <span>{lang === 'es' ? 'Ver lista' : 'View list'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </div>

      {/* Orders History Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary-600" />
              <span>{lang === 'es' ? 'Historial de Compras' : 'Purchase History'}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {lang === 'es'
                ? 'Revisa el estado y los detalles de tus pedidos'
                : 'Review the status and details of your past orders'}
            </p>
          </div>

          <button
            onClick={fetchOrders}
            disabled={loadingOrders}
            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title={lang === 'es' ? 'Recargar órdenes' : 'Refresh orders'}
          >
            <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin text-primary-600' : ''}`} />
          </button>
        </div>

        {/* Loading state */}
        {loadingOrders ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              {lang === 'es' ? 'Consultando tus compras en AWS...' : 'Fetching orders from AWS...'}
            </p>
          </div>
        ) : ordersError ? (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 text-sm text-rose-800">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">{lang === 'es' ? 'No se pudo sincronizar' : 'Could not synchronize'}</p>
              <p className="text-xs">{ordersError}</p>
            </div>
            <button
              onClick={fetchOrders}
              className="px-3 py-1 bg-white border border-rose-300 rounded text-xs font-semibold text-rose-700 hover:bg-rose-50"
            >
              {lang === 'es' ? 'Reintentar' : 'Retry'}
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800 mb-1">
              {lang === 'es' ? 'Aún no has realizado ninguna compra' : 'No purchases yet'}
            </h3>
            <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
              {lang === 'es'
                ? 'Explora el catálogo y completa tu primera orden para verla registrada aquí y descargar tu voucher.'
                : 'Browse our catalog and place your first order to see it tracked here and download your voucher.'}
            </p>
            <Link to="/" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 shadow-sm">
              <span>{t('shopNow')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleString(
                lang === 'es' ? 'es-ES' : 'en-US',
                {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }
              );
              const itemsCount = order.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || order.items?.length || 1;

              return (
                <div
                  key={order.id}
                  className="border border-gray-200 hover:border-primary-200 rounded-xl p-4 sm:p-5 hover:shadow-sm transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-gray-900">
                        #{order.id.substring(0, 8)}
                      </span>
                      <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {order.status === 'APPROVED' ? (lang === 'es' ? 'APROBADO' : 'APPROVED') : order.status}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{formattedDate}</span>
                    </p>

                    <p className="text-xs text-gray-600 font-medium">
                      {itemsCount} {itemsCount === 1 ? (lang === 'es' ? 'cómic' : 'comic') : (lang === 'es' ? 'cómics' : 'comics')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                        {lang === 'es' ? 'Total Pagado' : 'Total Paid'}
                      </p>
                      <p className="text-lg font-bold text-primary-600">
                        ${order.totalAmount.toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleViewReceipt(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-primary-50 text-gray-700 hover:text-primary-700 rounded-lg text-xs font-semibold transition-colors"
                      title={lang === 'es' ? 'Ver y descargar comprobante' : 'View & download receipt'}
                    >
                      <FileText className="w-4 h-4 text-primary-600" />
                      <span>{lang === 'es' ? 'Ver Voucher' : 'View Voucher'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Re-opening Order Receipt Modal if requested */}
      {selectedReceipt && (
        <OrderReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};

export default Profile;
