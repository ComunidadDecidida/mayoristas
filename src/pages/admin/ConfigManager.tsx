import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  Save,
  DollarSign,
  CreditCard,
  Bell,
  RefreshCw,
  Settings,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import { configService, PaymentGatewayConfig, NotificationConfig } from '../../services/configService';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Select } from '../../components/shared/Select';
import { Loading } from '../../components/shared/Loading';

export default function ConfigManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [globalMarkup, setGlobalMarkup] = useState(20);
  const [showIVA, setShowIVA] = useState(true);
  const [ivaPercentage, setIvaPercentage] = useState(16);
  const [cartExpirationDays, setCartExpirationDays] = useState(7);
  const [exchangeRate, setExchangeRate] = useState({ MXN: 1, USD: 17.5 });
  const [lastExchangeUpdate, setLastExchangeUpdate] = useState<string>('');

  const [mercadoPago, setMercadoPago] = useState<PaymentGatewayConfig>({
    enabled: false,
    public_key: '',
    access_token: '',
    mode: 'test',
  });

  const [stripe, setStripe] = useState<PaymentGatewayConfig>({
    enabled: false,
    publishable_key: '',
    secret_key: '',
    mode: 'test',
  });

  const [paypal, setPaypal] = useState<PaymentGatewayConfig>({
    enabled: false,
    client_id: '',
    client_secret: '',
    mode: 'sandbox',
  });

  const [whatsapp, setWhatsapp] = useState<NotificationConfig>({
    service: 'whatsapp',
    is_enabled: false,
    config: { phone: '', api_token: '' },
  });

  const [telegram, setTelegram] = useState<NotificationConfig>({
    service: 'telegram',
    is_enabled: false,
    config: { bot_token: '', chat_id: '' },
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const config = await configService.getAllConfig();

      if (config.global_markup_percentage) setGlobalMarkup(Number(config.global_markup_percentage));
      if (config.show_iva) setShowIVA(config.show_iva === true || config.show_iva === 'true');
      if (config.iva_percentage) setIvaPercentage(Number(config.iva_percentage));
      if (config.cart_expiration_days) setCartExpirationDays(Number(config.cart_expiration_days));
      if (config.exchange_rate) setExchangeRate(config.exchange_rate);

      const mpConfig = await configService.getPaymentGatewayConfig('mercadopago');
      if (mpConfig) setMercadoPago(mpConfig);

      const stripeConfig = await configService.getPaymentGatewayConfig('stripe');
      if (stripeConfig) setStripe(stripeConfig);

      const paypalConfig = await configService.getPaymentGatewayConfig('paypal');
      if (paypalConfig) setPaypal(paypalConfig);

      const whatsappConfig = await configService.getNotificationConfig('whatsapp');
      if (whatsappConfig) setWhatsapp(whatsappConfig);

      const telegramConfig = await configService.getNotificationConfig('telegram');
      if (telegramConfig) setTelegram(telegramConfig);
    } catch (error) {
      console.error('Error loading config:', error);
      alert('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await configService.updateConfig('global_markup_percentage', globalMarkup);
      await configService.updateConfig('show_iva', showIVA);
      await configService.updateConfig('iva_percentage', ivaPercentage);
      await configService.updateConfig('cart_expiration_days', cartExpirationDays);
      await configService.updateConfig('exchange_rate', exchangeRate);

      await configService.updatePaymentGatewayConfig('mercadopago', mercadoPago);
      await configService.updatePaymentGatewayConfig('stripe', stripe);
      await configService.updatePaymentGatewayConfig('paypal', paypal);

      await configService.updateNotificationConfig(whatsapp);
      await configService.updateNotificationConfig(telegram);

      alert('✅ Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyGlobalMarkup = async () => {
    if (!confirm(`¿Estás seguro de aplicar ${globalMarkup}% de ganancia a TODOS los productos? Esta acción no se puede deshacer.`)) {
      return;
    }

    setSaving(true);
    try {
      const updated = await configService.applyGlobalMarkup(globalMarkup);
      alert(`✅ Se actualizaron ${updated} productos exitosamente`);
    } catch (error) {
      console.error('Error applying markup:', error);
      alert('Error al aplicar el markup');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateExchangeRate = async () => {
    try {
      const rate = await configService.getExchangeRateFromAPI();
      setExchangeRate(rate);
      setLastExchangeUpdate(new Date().toLocaleString('es-MX'));
      alert(`✅ Tipo de cambio actualizado: $${rate.USD} MXN`);
    } catch (error) {
      console.error('Error updating exchange rate:', error);
      alert('Error al obtener el tipo de cambio');
    }
  };

  const handleTestNotification = async (service: 'whatsapp' | 'telegram') => {
    try {
      const success = await configService.testNotification(service);
      if (success) {
        alert(`✅ Mensaje de prueba enviado a ${service === 'whatsapp' ? 'WhatsApp' : 'Telegram'}`);
      } else {
        alert(`❌ Error al enviar mensaje de prueba a ${service === 'whatsapp' ? 'WhatsApp' : 'Telegram'}`);
      }
    } catch (error) {
      console.error('Error testing notification:', error);
      alert('Error al probar la notificación');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading text="Cargando configuración..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/admin" className="hover:text-gray-700">
              Admin
            </Link>
            <ChevronLeft className="h-4 w-4 rotate-180" />
            <span className="text-gray-900 font-medium">Configuración del Sistema</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
            <Button onClick={handleSaveAll} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Todo'}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Sección de Precios y Márgenes */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Precios y Márgenes</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Input
                  type="number"
                  label="Porcentaje de Ganancia Global (%)"
                  value={globalMarkup}
                  onChange={(e) => setGlobalMarkup(Number(e.target.value))}
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Este porcentaje se suma al precio base de los productos
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Ejemplo:</strong> Producto con precio base de $1,000 MXN
                </p>
                <p className="text-sm text-blue-700">
                  Precio final = $1,000 × (1 + {globalMarkup}%) = ${(1000 * (1 + globalMarkup / 100)).toFixed(2)} MXN
                </p>
              </div>

              <Button onClick={handleApplyGlobalMarkup} variant="secondary" disabled={saving}>
                Aplicar a Todos los Productos
              </Button>
            </div>
          </div>

          {/* Sección de IVA y Monedas */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">IVA y Monedas</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="show_iva"
                  checked={showIVA}
                  onChange={(e) => setShowIVA(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="show_iva" className="ml-2 block text-sm text-gray-900">
                  Mostrar precios con IVA incluido
                </label>
              </div>

              <Input
                type="number"
                label="Porcentaje de IVA (%)"
                value={ivaPercentage}
                onChange={(e) => setIvaPercentage(Number(e.target.value))}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>

          {/* Sección de Tipo de Cambio */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="h-5 w-5 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Tipo de Cambio</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MXN
                  </label>
                  <div className="text-2xl font-bold text-gray-900">${exchangeRate.MXN.toFixed(2)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    USD
                  </label>
                  <div className="text-2xl font-bold text-gray-900">${exchangeRate.USD.toFixed(2)}</div>
                </div>
              </div>

              {lastExchangeUpdate && (
                <p className="text-sm text-gray-500">
                  Última actualización: {lastExchangeUpdate}
                </p>
              )}

              <div className="flex gap-2">
                <Input
                  type="number"
                  label="Actualizar USD manualmente"
                  value={exchangeRate.USD}
                  onChange={(e) => setExchangeRate({ ...exchangeRate, USD: Number(e.target.value) })}
                  min="0"
                  step="0.01"
                />
                <div className="flex items-end">
                  <Button onClick={handleUpdateExchangeRate} variant="secondary">
                    Obtener desde SYSCOM
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Carrito */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="h-5 w-5 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">Carrito de Compras</h2>
            </div>

            <Input
              type="number"
              label="Días de Expiración del Carrito"
              value={cartExpirationDays}
              onChange={(e) => setCartExpirationDays(Number(e.target.value))}
              min="1"
              max="30"
            />
            <p className="text-sm text-gray-500 mt-1">
              Los carritos se eliminarán automáticamente después de este período
            </p>
          </div>

          {/* Sección de Pasarelas de Pago */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-yellow-600" />
              <h2 className="text-xl font-semibold text-gray-900">Pasarelas de Pago</h2>
            </div>

            <div className="space-y-6">
              {/* MercadoPago */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">MercadoPago</h3>
                  <input
                    type="checkbox"
                    checked={mercadoPago.enabled}
                    onChange={(e) => setMercadoPago({ ...mercadoPago, enabled: e.target.checked })}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="space-y-3">
                  <Input
                    label="Public Key"
                    value={mercadoPago.public_key || ''}
                    onChange={(e) => setMercadoPago({ ...mercadoPago, public_key: e.target.value })}
                    placeholder="APP_USR_..."
                    disabled={!mercadoPago.enabled}
                  />
                  <Input
                    label="Access Token"
                    type="password"
                    value={mercadoPago.access_token || ''}
                    onChange={(e) => setMercadoPago({ ...mercadoPago, access_token: e.target.value })}
                    placeholder="APP_USR_..."
                    disabled={!mercadoPago.enabled}
                  />
                  <Select
                    label="Modo"
                    value={mercadoPago.mode}
                    onChange={(e) => setMercadoPago({ ...mercadoPago, mode: e.target.value as 'test' | 'production' })}
                    options={[
                      { value: 'test', label: 'Pruebas (Test)' },
                      { value: 'production', label: 'Producción' },
                    ]}
                    disabled={!mercadoPago.enabled}
                  />
                </div>
              </div>

              {/* Stripe */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Stripe</h3>
                  <input
                    type="checkbox"
                    checked={stripe.enabled}
                    onChange={(e) => setStripe({ ...stripe, enabled: e.target.checked })}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="space-y-3">
                  <Input
                    label="Publishable Key"
                    value={stripe.publishable_key || ''}
                    onChange={(e) => setStripe({ ...stripe, publishable_key: e.target.value })}
                    placeholder="pk_test_... o pk_live_..."
                    disabled={!stripe.enabled}
                  />
                  <Input
                    label="Secret Key"
                    type="password"
                    value={stripe.secret_key || ''}
                    onChange={(e) => setStripe({ ...stripe, secret_key: e.target.value })}
                    placeholder="sk_test_... o sk_live_..."
                    disabled={!stripe.enabled}
                  />
                  <Select
                    label="Modo"
                    value={stripe.mode}
                    onChange={(e) => setStripe({ ...stripe, mode: e.target.value as 'test' | 'production' })}
                    options={[
                      { value: 'test', label: 'Pruebas (Test)' },
                      { value: 'production', label: 'Producción' },
                    ]}
                    disabled={!stripe.enabled}
                  />
                </div>
              </div>

              {/* PayPal */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">PayPal</h3>
                  <input
                    type="checkbox"
                    checked={paypal.enabled}
                    onChange={(e) => setPaypal({ ...paypal, enabled: e.target.checked })}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="space-y-3">
                  <Input
                    label="Client ID"
                    value={paypal.client_id || ''}
                    onChange={(e) => setPaypal({ ...paypal, client_id: e.target.value })}
                    placeholder="AYSq3RDGsmBLJE..."
                    disabled={!paypal.enabled}
                  />
                  <Input
                    label="Client Secret"
                    type="password"
                    value={paypal.client_secret || ''}
                    onChange={(e) => setPaypal({ ...paypal, client_secret: e.target.value })}
                    placeholder="EHuWW..."
                    disabled={!paypal.enabled}
                  />
                  <Select
                    label="Modo"
                    value={paypal.mode}
                    onChange={(e) => setPaypal({ ...paypal, mode: e.target.value as 'sandbox' | 'production' })}
                    options={[
                      { value: 'sandbox', label: 'Sandbox (Pruebas)' },
                      { value: 'production', label: 'Producción' },
                    ]}
                    disabled={!paypal.enabled}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Notificaciones */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-900">Notificaciones</h2>
            </div>

            <div className="space-y-6">
              {/* WhatsApp */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">WhatsApp</h3>
                  <input
                    type="checkbox"
                    checked={whatsapp.is_enabled}
                    onChange={(e) => setWhatsapp({ ...whatsapp, is_enabled: e.target.checked })}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="space-y-3">
                  <Input
                    label="Número de Teléfono"
                    value={whatsapp.config.phone || ''}
                    onChange={(e) => setWhatsapp({
                      ...whatsapp,
                      config: { ...whatsapp.config, phone: e.target.value }
                    })}
                    placeholder="+52..."
                    disabled={!whatsapp.is_enabled}
                  />
                  <Input
                    label="API Token"
                    type="password"
                    value={whatsapp.config.api_token || ''}
                    onChange={(e) => setWhatsapp({
                      ...whatsapp,
                      config: { ...whatsapp.config, api_token: e.target.value }
                    })}
                    placeholder="Token de WhatsApp Business API"
                    disabled={!whatsapp.is_enabled}
                  />
                  <Button
                    onClick={() => handleTestNotification('whatsapp')}
                    variant="secondary"
                    disabled={!whatsapp.is_enabled}
                  >
                    Enviar Mensaje de Prueba
                  </Button>
                </div>
              </div>

              {/* Telegram */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Telegram</h3>
                  <input
                    type="checkbox"
                    checked={telegram.is_enabled}
                    onChange={(e) => setTelegram({ ...telegram, is_enabled: e.target.checked })}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="space-y-3">
                  <Input
                    label="Bot Token"
                    type="password"
                    value={telegram.config.bot_token || ''}
                    onChange={(e) => setTelegram({
                      ...telegram,
                      config: { ...telegram.config, bot_token: e.target.value }
                    })}
                    placeholder="123456789:ABC..."
                    disabled={!telegram.is_enabled}
                  />
                  <Input
                    label="Chat ID"
                    value={telegram.config.chat_id || ''}
                    onChange={(e) => setTelegram({
                      ...telegram,
                      config: { ...telegram.config, chat_id: e.target.value }
                    })}
                    placeholder="-100..."
                    disabled={!telegram.is_enabled}
                  />
                  <Button
                    onClick={() => handleTestNotification('telegram')}
                    variant="secondary"
                    disabled={!telegram.is_enabled}
                  >
                    Enviar Mensaje de Prueba
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de Guardar */}
          <div className="flex justify-end">
            <Button onClick={handleSaveAll} disabled={saving} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Toda la Configuración'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
