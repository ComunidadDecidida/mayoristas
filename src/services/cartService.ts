import { supabase } from '../lib/supabase'
import type { Cart, CartItem } from '../types/database'

function getSessionId(): string {
  let sessionId = localStorage.getItem('cart_session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('cart_session_id', sessionId)
  }
  return sessionId
}

function calculateTax(subtotal: number, ivaPercentage: number): number {
  return subtotal * (ivaPercentage / 100)
}

export const cartService = {
  async getCart(cartId?: string): Promise<Cart | null> {
    try {
      if (cartId) {
        const { data, error } = await supabase
          .from('carts')
          .select('*')
          .eq('id', cartId)
          .maybeSingle()

        if (error) throw error
        return data as Cart | null
      }

      const sessionId = getSessionId()

      const { data, error } = await supabase
        .from('carts')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle()

      if (error) throw error
      return data as Cart | null
    } catch (error) {
      console.error('Error getting cart:', error)
      return null
    }
  },

  async createCart(expirationDays: number = 7): Promise<Cart> {
    const sessionId = getSessionId()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expirationDays)

    const { data, error } = await supabase
      .from('carts')
      .insert({
        session_id: sessionId,
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        currency: 'MXN',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (error) throw error

    localStorage.setItem('cartId', data.id)
    return data as Cart
  },

  async addItem(productId: string, quantity: number = 1, cartId?: string): Promise<Cart> {
    try {
      let cart: Cart | null = null

      if (cartId) {
        cart = await this.getCart(cartId)
      } else {
        cart = await this.getCart()
      }

      if (!cart) {
        cart = await this.createCart()
      }

      let product: any = null

      const { data: regularProduct } = await supabase
        .from('products')
        .select('id, sku, title, final_price, images, stock')
        .eq('id', productId)
        .maybeSingle()

      if (regularProduct) {
        product = regularProduct
      } else {
        const { data: syscomProduct } = await supabase
          .from('syscom_products')
          .select('id, modelo, titulo, final_price, imagenes, total_existencia, img_portada')
          .eq('id', productId)
          .maybeSingle()

        if (syscomProduct) {
          const images: string[] = []
          if (syscomProduct.img_portada) {
            images.push(syscomProduct.img_portada)
          }
          if (Array.isArray(syscomProduct.imagenes)) {
            syscomProduct.imagenes.forEach((img: any) => {
              if (img && img.imagen && !images.includes(img.imagen)) {
                images.push(img.imagen)
              }
            })
          }

          product = {
            id: syscomProduct.id,
            sku: syscomProduct.modelo,
            title: syscomProduct.titulo,
            final_price: syscomProduct.final_price,
            images: images,
            stock: syscomProduct.total_existencia
          }
        }
      }

      if (!product) throw new Error('Producto no encontrado')

      if (!product.stock || product.stock < quantity) {
        throw new Error('Stock insuficiente')
      }

      const items = Array.isArray(cart.items) ? [...cart.items as CartItem[]] : []
      const existingItemIndex = items.findIndex(item => item.product_id === productId)

      const images = Array.isArray(product.images) ? product.images : []

      if (existingItemIndex >= 0) {
        const newQuantity = items[existingItemIndex].quantity + quantity
        if (newQuantity > product.stock) {
          throw new Error('Stock insuficiente')
        }
        items[existingItemIndex].quantity = newQuantity
      } else {
        items.push({
          product_id: product.id,
          sku: product.sku,
          title: product.title,
          price: parseFloat(product.final_price.toString()),
          quantity,
          image: images[0] || ''
        })
      }

      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      const { data: configData } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'iva_percentage')
        .maybeSingle()

      const ivaPercentage = configData?.value ? parseFloat(configData.value as string) : 16
      const tax = calculateTax(subtotal, ivaPercentage)
      const total = subtotal + tax

      const { data, error } = await supabase
        .from('carts')
        .update({
          items,
          subtotal,
          tax,
          total,
          updated_at: new Date().toISOString()
        })
        .eq('id', cart.id)
        .select()
        .single()

      if (error) throw error
      return data as Cart
    } catch (error) {
      console.error('Error in addItem:', error)
      throw error
    }
  },

  async updateItemQuantity(cartId: string, productId: string, quantity: number): Promise<Cart> {
    try {
      const cart = await this.getCart(cartId)
      if (!cart) throw new Error('Carrito no encontrado')

      const items = Array.isArray(cart.items) ? [...cart.items as CartItem[]] : []
      const itemIndex = items.findIndex(item => item.product_id === productId)

      if (itemIndex === -1) {
        throw new Error('Producto no encontrado en el carrito')
      }

      if (quantity <= 0) {
        items.splice(itemIndex, 1)
      } else {
        const { data: regularProduct } = await supabase
          .from('products')
          .select('stock')
          .eq('id', productId)
          .maybeSingle()

        const { data: syscomProduct } = await supabase
          .from('syscom_products')
          .select('total_existencia')
          .eq('id', productId)
          .maybeSingle()

        const stock = regularProduct?.stock || syscomProduct?.total_existencia || 0

        if (quantity > stock) {
          throw new Error('Stock insuficiente')
        }

        items[itemIndex].quantity = quantity
      }

      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      const { data: configData } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'iva_percentage')
        .maybeSingle()

      const ivaPercentage = configData?.value ? parseFloat(configData.value as string) : 16
      const tax = calculateTax(subtotal, ivaPercentage)
      const total = subtotal + tax

      const { data, error } = await supabase
        .from('carts')
        .update({
          items,
          subtotal,
          tax,
          total,
          updated_at: new Date().toISOString()
        })
        .eq('id', cart.id)
        .select()
        .single()

      if (error) throw error
      return data as Cart
    } catch (error) {
      console.error('Error updating item quantity:', error)
      throw error
    }
  },

  async removeItem(cartId: string, productId: string): Promise<Cart> {
    return this.updateItemQuantity(cartId, productId, 0)
  },

  async clearCart(cartId?: string): Promise<void> {
    try {
      const cart = await this.getCart(cartId)
      if (!cart) return

      const { error } = await supabase
        .from('carts')
        .update({
          items: [],
          subtotal: 0,
          tax: 0,
          total: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', cart.id)

      if (error) throw error
    } catch (error) {
      console.error('Error clearing cart:', error)
      throw error
    }
  }
}
