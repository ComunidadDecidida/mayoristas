import { useState, useEffect } from 'react'
import { cartService } from '../services/cartService'

export interface CartItem {
  product_id: string
  sku: string
  title: string
  price: number
  quantity: number
  image: string
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [cartId, setCartId] = useState<string | null>(null)

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = async () => {
    try {
      setLoading(true)
      const existingCartId = localStorage.getItem('cartId')

      if (existingCartId) {
        const cart = await cartService.getCart(existingCartId)
        if (cart) {
          setItems(cart.items || [])
          setCartId(cart.id)
          return
        }
      }

      const cart = await cartService.getCart()
      if (cart) {
        setItems(cart.items || [])
        setCartId(cart.id)
        localStorage.setItem('cartId', cart.id)
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const addItem = async (productId: string, quantity: number = 1) => {
    try {
      const cart = await cartService.addItem(productId, quantity, cartId || undefined)
      setCartId(cart.id)
      localStorage.setItem('cartId', cart.id)
      await loadCart()
    } catch (error) {
      console.error('Error adding item to cart:', error)
      throw error
    }
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!cartId) return

    try {
      await cartService.updateItemQuantity(cartId, productId, quantity)
      await loadCart()
    } catch (error) {
      console.error('Error updating quantity:', error)
      throw error
    }
  }

  const removeItem = async (productId: string) => {
    if (!cartId) return

    try {
      await cartService.removeItem(cartId, productId)
      await loadCart()
    } catch (error) {
      console.error('Error removing item:', error)
      throw error
    }
  }

  const clearCart = async () => {
    if (!cartId) return

    try {
      await cartService.clearCart(cartId)
      setItems([])
      localStorage.removeItem('cartId')
      setCartId(null)
    } catch (error) {
      console.error('Error clearing cart:', error)
      throw error
    }
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => {
    const price = item.price || 0
    return sum + (price * item.quantity)
  }, 0)

  return {
    items,
    loading,
    itemCount,
    subtotal,
    cartId,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart: loadCart,
  }
}
