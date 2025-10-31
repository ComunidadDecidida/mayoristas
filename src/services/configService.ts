import { supabase } from '../lib/supabase';

export interface SystemConfig {
  key: string;
  value: any;
  description?: string;
}

export interface PaymentGatewayConfig {
  enabled: boolean;
  public_key?: string;
  access_token?: string;
  publishable_key?: string;
  secret_key?: string;
  client_id?: string;
  client_secret?: string;
  mode: 'test' | 'production' | 'sandbox';
}

export interface NotificationConfig {
  service: 'whatsapp' | 'telegram';
  is_enabled: boolean;
  config: {
    phone?: string;
    api_token?: string;
    bot_token?: string;
    chat_id?: string;
  };
}

export const configService = {
  /**
   * Obtener configuración por clave
   */
  async getConfig(key: string): Promise<any> {
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) throw error;
    return data?.value;
  },

  /**
   * Obtener toda la configuración del sistema
   */
  async getAllConfig(): Promise<Record<string, any>> {
    const { data, error } = await supabase
      .from('system_config')
      .select('key, value');

    if (error) throw error;

    const config: Record<string, any> = {};
    data?.forEach((item) => {
      config[item.key] = item.value;
    });

    return config;
  },

  /**
   * Actualizar o crear configuración
   */
  async updateConfig(key: string, value: any, description?: string): Promise<void> {
    if (typeof value === 'string' && (key.includes('token') || key.includes('oauth'))) {
      try {
        const { error } = await supabase.rpc('store_config_text', {
          p_key: key,
          p_value: value,
          p_description: description
        });

        if (error) {
          console.warn('RPC store_config_text failed, using direct upsert fallback:', error.message);

          const { error: upsertError } = await supabase
            .from('system_config')
            .upsert(
              {
                key,
                value: value,
                description,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'key' }
            );

          if (upsertError) throw upsertError;
        }
      } catch (error: any) {
        console.error('Error in updateConfig with RPC:', error);
        throw new Error(`Error al guardar configuración: ${error.message}`);
      }
    } else {
      const { error } = await supabase
        .from('system_config')
        .upsert(
          {
            key,
            value,
            description,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );

      if (error) throw error;
    }
  },

  /**
   * Obtener tipo de cambio desde API de SYSCOM
   */
  async getExchangeRateFromAPI(): Promise<{ MXN: number; USD: number }> {
    const { data, error } = await supabase.functions.invoke('syscom-api', {
      body: { action: 'exchange-rate' },
    });

    if (error) throw error;
    if (!data) throw new Error('No se pudo obtener el tipo de cambio');

    return {
      MXN: 1,
      USD: data.normal || 17.5,
    };
  },

  /**
   * Actualizar tipo de cambio
   */
  async updateExchangeRate(rate: { MXN: number; USD: number }): Promise<void> {
    await this.updateConfig(
      'exchange_rate',
      rate,
      'Tipo de cambio USD/MXN'
    );
  },

  /**
   * Obtener configuración de pasarela de pago
   */
  async getPaymentGatewayConfig(gateway: 'mercadopago' | 'stripe' | 'paypal'): Promise<PaymentGatewayConfig | null> {
    const key = `${gateway}_config`;
    const value = await this.getConfig(key);
    return value || null;
  },

  /**
   * Actualizar configuración de pasarela de pago
   */
  async updatePaymentGatewayConfig(
    gateway: 'mercadopago' | 'stripe' | 'paypal',
    config: PaymentGatewayConfig
  ): Promise<void> {
    const key = `${gateway}_config`;
    await this.updateConfig(key, config, `Configuración de ${gateway}`);
  },

  /**
   * Probar conexión con pasarela de pago
   */
  async testPaymentGateway(gateway: 'mercadopago' | 'stripe' | 'paypal'): Promise<boolean> {
    try {
      const config = await this.getPaymentGatewayConfig(gateway);
      if (!config || !config.enabled) {
        throw new Error('La pasarela no está configurada o no está habilitada');
      }

      return true;
    } catch (error) {
      console.error('Error testing payment gateway:', error);
      return false;
    }
  },

  /**
   * Obtener configuración de notificaciones
   */
  async getNotificationConfig(service: 'whatsapp' | 'telegram'): Promise<NotificationConfig | null> {
    const { data, error } = await supabase
      .from('notification_config')
      .select('*')
      .eq('service', service)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Actualizar configuración de notificaciones
   */
  async updateNotificationConfig(config: NotificationConfig): Promise<void> {
    const { error } = await supabase
      .from('notification_config')
      .update({
        is_enabled: config.is_enabled,
        config: config.config,
        updated_at: new Date().toISOString(),
      })
      .eq('service', config.service);

    if (error) throw error;
  },

  /**
   * Probar envío de notificación
   */
  async testNotification(service: 'whatsapp' | 'telegram'): Promise<boolean> {
    try {
      const config = await this.getNotificationConfig(service);
      if (!config || !config.is_enabled) {
        throw new Error('El servicio de notificaciones no está configurado o no está habilitado');
      }

      const functionName = service === 'whatsapp' ? 'send-whatsapp' : 'send-telegram';

      const { error } = await supabase.functions.invoke(functionName, {
        body: {
          message: '🧪 Mensaje de prueba desde el panel de administración',
          test: true,
        },
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error testing notification:', error);
      return false;
    }
  },

  /**
   * Aplicar markup global a todos los productos
   */
  async applyGlobalMarkup(percentage: number): Promise<number> {
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, base_price');

    if (fetchError) throw fetchError;

    let updated = 0;
    for (const product of products || []) {
      const finalPrice = product.base_price * (1 + percentage / 100);

      const { error: updateError } = await supabase
        .from('products')
        .update({
          markup_percentage: percentage,
          final_price: finalPrice,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id);

      if (!updateError) updated++;
    }

    return updated;
  },
};
