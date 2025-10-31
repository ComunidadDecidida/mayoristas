import { supabase } from '../lib/supabase';

export interface PaymentMethod {
  id: string;
  name: string;
  enabled: boolean;
  logo: string;
}

export interface CreatePaymentRequest {
  order_id: string;
  items: any[];
  total: number;
  currency: string;
  customer_info: {
    name: string;
    email: string;
    phone?: string;
  };
}

export const paymentService = {
  /**
   * Obtener pasarelas de pago habilitadas
   */
  async getAvailablePaymentMethods(): Promise<PaymentMethod[]> {
    const methods: PaymentMethod[] = [];

    try {
      const { data: mercadoPagoConfig } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'mercadopago_config')
        .maybeSingle();

      if (mercadoPagoConfig?.value?.enabled) {
        methods.push({
          id: 'mercadopago',
          name: 'MercadoPago',
          enabled: true,
          logo: '/logos/mercadopago.png',
        });
      }

      const { data: stripeConfig } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'stripe_config')
        .maybeSingle();

      if (stripeConfig?.value?.enabled) {
        methods.push({
          id: 'stripe',
          name: 'Stripe',
          enabled: true,
          logo: '/logos/stripe.png',
        });
      }

      const { data: paypalConfig } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'paypal_config')
        .maybeSingle();

      if (paypalConfig?.value?.enabled) {
        methods.push({
          id: 'paypal',
          name: 'PayPal',
          enabled: true,
          logo: '/logos/paypal.png',
        });
      }

      return methods;
    } catch (error) {
      console.error('Error getting payment methods:', error);
      return [];
    }
  },

  /**
   * Crear pago con MercadoPago
   */
  async createMercadoPagoPayment(request: CreatePaymentRequest): Promise<{ success: boolean; init_point?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-payment', {
        body: request,
      });

      if (error) throw error;

      return {
        success: true,
        init_point: data.init_point,
      };
    } catch (error) {
      console.error('Error creating MercadoPago payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear pago',
      };
    }
  },

  /**
   * Crear pago con Stripe
   */
  async createStripePayment(request: CreatePaymentRequest): Promise<{ success: boolean; session_url?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-payment', {
        body: request,
      });

      if (error) throw error;

      return {
        success: true,
        session_url: data.session_url,
      };
    } catch (error) {
      console.error('Error creating Stripe payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear pago',
      };
    }
  },

  /**
   * Crear pago con PayPal
   */
  async createPayPalPayment(request: CreatePaymentRequest): Promise<{ success: boolean; approval_url?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('paypal-payment', {
        body: request,
      });

      if (error) throw error;

      return {
        success: true,
        approval_url: data.approval_url,
      };
    } catch (error) {
      console.error('Error creating PayPal payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear pago',
      };
    }
  },

  /**
   * Crear pago con la pasarela seleccionada
   */
  async createPayment(
    gateway: 'mercadopago' | 'stripe' | 'paypal',
    request: CreatePaymentRequest
  ): Promise<{ success: boolean; redirect_url?: string; error?: string }> {
    switch (gateway) {
      case 'mercadopago': {
        const result = await this.createMercadoPagoPayment(request);
        return {
          success: result.success,
          redirect_url: result.init_point,
          error: result.error,
        };
      }

      case 'stripe': {
        const result = await this.createStripePayment(request);
        return {
          success: result.success,
          redirect_url: result.session_url,
          error: result.error,
        };
      }

      case 'paypal': {
        const result = await this.createPayPalPayment(request);
        return {
          success: result.success,
          redirect_url: result.approval_url,
          error: result.error,
        };
      }

      default:
        return {
          success: false,
          error: 'Pasarela de pago no válida',
        };
    }
  },
};
