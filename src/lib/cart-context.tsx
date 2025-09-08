'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'

interface Product {
  _id: string
  nombre: string
  descripcion: string
  precio: number
  precioCompra: number
  stock: number
  stockMinimo: number
  categoria: string
  laboratorio: string
  codigo?: string
  codigoBarras?: string
  requiereReceta: boolean
  activo: boolean
  fechaCreacion: string
}

interface SaleItem {
  producto: string
  nombreProducto: string
  cantidad: number
  precioUnitario: number
  precioTotal: number
  tipoVenta: 'unidad' | 'caja'
  unidadesPorCaja?: number
}

interface Cliente {
  nombre: string
  cedula: string
  telefono: string
}

interface CartContextType {
  cart: SaleItem[]
  cliente: Cliente
  descuento: number
  metodoPago: string
  notas: string
  isCartOpen: boolean
  isScanning: boolean
  addToCart: (product: Product, tipoVenta?: 'unidad' | 'caja', unidadesPorCaja?: number) => void
  updateCartItem: (productId: string, newQuantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  setCliente: (cliente: Cliente) => void
  setDescuento: (descuento: number) => void
  setMetodoPago: (metodoPago: string) => void
  setNotas: (notas: string) => void
  setIsCartOpen: (isOpen: boolean) => void
  setIsScanning: (isScanning: boolean) => void
  calculateSubtotal: () => number
  calculateTotal: () => number
  scanBarcode: (barcode: string) => Promise<void>
  processSale: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<SaleItem[]>([])
  const [cliente, setCliente] = useState<Cliente>({
    nombre: '',
    cedula: '',
    telefono: ''
  })
  const [descuento, setDescuento] = useState(0)
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [notas, setNotas] = useState('')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)

  console.log('CartProvider render:', { cartLength: cart.length, isCartOpen });

  // Cargar carrito del localStorage al iniciar
  useEffect(() => {
    try {
      console.log('Loading cart from localStorage...');
      const savedCart = localStorage.getItem('saludDirecta_cart')
      const savedCliente = localStorage.getItem('saludDirecta_cliente')
      const savedDescuento = localStorage.getItem('saludDirecta_descuento')
      const savedMetodoPago = localStorage.getItem('saludDirecta_metodoPago')
      const savedNotas = localStorage.getItem('saludDirecta_notas')
      const savedIsCartOpen = localStorage.getItem('saludDirecta_isCartOpen')

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart)
        console.log('Loaded cart from localStorage:', parsedCart.length, 'items');
        setCart(parsedCart)
      }

      if (savedCliente) {
        const parsedCliente = JSON.parse(savedCliente)
        console.log('Loaded cliente from localStorage:', parsedCliente);
        setCliente(parsedCliente)
      }

      if (savedDescuento) {
        const parsedDescuento = Number(savedDescuento)
        console.log('Loaded descuento from localStorage:', parsedDescuento);
        setDescuento(parsedDescuento)
      }

      if (savedMetodoPago) {
        console.log('Loaded metodoPago from localStorage:', savedMetodoPago);
        setMetodoPago(savedMetodoPago)
      }

      if (savedNotas) {
        console.log('Loaded notas from localStorage:', savedNotas);
        setNotas(savedNotas)
      }

      if (savedIsCartOpen) {
        const parsedIsCartOpen = savedIsCartOpen === 'true'
        console.log('Loaded isCartOpen from localStorage:', parsedIsCartOpen);
        setIsCartOpen(parsedIsCartOpen)
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error)
      // Limpiar localStorage corrupto
      localStorage.removeItem('saludDirecta_cart')
      localStorage.removeItem('saludDirecta_cliente')
      localStorage.removeItem('saludDirecta_descuento')
      localStorage.removeItem('saludDirecta_metodoPago')
      localStorage.removeItem('saludDirecta_notas')
      localStorage.removeItem('saludDirecta_isCartOpen')
    }
  }, [])

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('saludDirecta_cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem('saludDirecta_cliente', JSON.stringify(cliente))
  }, [cliente])

  useEffect(() => {
    localStorage.setItem('saludDirecta_descuento', descuento.toString())
  }, [descuento])

  useEffect(() => {
    localStorage.setItem('saludDirecta_metodoPago', metodoPago)
  }, [metodoPago])

  useEffect(() => {
    localStorage.setItem('saludDirecta_notas', notas)
  }, [notas])

  useEffect(() => {
    localStorage.setItem('saludDirecta_isCartOpen', isCartOpen.toString())
  }, [isCartOpen])

  const addToCart = (product: Product, tipoVenta: 'unidad' | 'caja' = 'unidad', unidadesPorCaja: number = 1) => {
    const existingItem = cart.find(item => item.producto === product._id)

    if (existingItem) {
      // Si ya existe, incrementar cantidad
      const newQuantity = tipoVenta === 'caja' ? existingItem.cantidad + 1 : existingItem.cantidad + 1
      const maxStock = tipoVenta === 'caja' ? Math.floor(product.stock / unidadesPorCaja) : product.stock

      if (newQuantity > maxStock) {
        toast.error(`Stock insuficiente. Maximo disponible: ${maxStock} ${tipoVenta === 'caja' ? 'cajas' : 'unidades'}`)
        return
      }

      updateCartItem(existingItem.producto, newQuantity)
    } else {
      // Si no existe, agregar nuevo item
      const maxStock = tipoVenta === 'caja' ? Math.floor(product.stock / unidadesPorCaja) : product.stock

      if (1 > maxStock) {
        toast.error(`Stock insuficiente. Maximo disponible: ${maxStock} ${tipoVenta === 'caja' ? 'cajas' : 'unidades'}`)
        return
      }

      const newItem: SaleItem = {
        producto: product._id,
        nombreProducto: product.nombre,
        cantidad: 1,
        precioUnitario: product.precio,
        precioTotal: product.precio,
        tipoVenta,
        unidadesPorCaja: tipoVenta === 'caja' ? unidadesPorCaja : undefined
      }

      setCart([...cart, newItem])
      toast.success(`${product.nombre} agregado al carrito`)
    }
  }

  const updateCartItem = (productId: string, newQuantity: number) => {
    setCart(cart.map(item => {
      if (item.producto === productId) {
        const newTotal = item.precioUnitario * newQuantity
        return { ...item, cantidad: newQuantity, precioTotal: newTotal }
      }
      return item
    }))
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.producto !== productId))
  }

  const clearCart = () => {
    setCart([])
    setCliente({ nombre: '', cedula: '', telefono: '' })
    setDescuento(0)
    setMetodoPago('efectivo')
    setNotas('')
  }

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.precioTotal, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const discountAmount = (subtotal * descuento) / 100
    return subtotal - discountAmount
  }

  const scanBarcode = async (barcode: string) => {
    try {
      setIsScanning(true)

      // Buscar producto por codigo de barras
      const response = await fetch(`/api/products?codigoBarras=${barcode}`)

      if (response.ok) {
        const products = await response.json()
        const product = products.find((p: Product) => p.activo && p.stock > 0)

        if (product) {
          addToCart(product, 'unidad')
          toast.success(`Producto escaneado: ${product.nombre}`)
        } else {
          toast.error('Producto no encontrado o sin stock')
        }
      } else {
        toast.error('Error al buscar producto')
      }
    } catch (error) {
      console.error('Error scanning barcode:', error)
      toast.error('Error al escanear codigo de barras')
    } finally {
      setIsScanning(false)
    }
  }

  const processSale = async () => {
    if (cart.length === 0) {
      toast.error('Debe agregar al menos un producto al carrito')
      return
    }

    try {
      const saleData = {
        cliente: cliente.nombre ? cliente : undefined,
        items: cart.map(item => ({
          producto: item.producto,
          nombreProducto: item.nombreProducto,
          cantidad: item.tipoVenta === 'caja' ? item.cantidad * (item.unidadesPorCaja || 1) : item.cantidad,
          precioUnitario: item.precioUnitario,
          precioTotal: item.precioTotal
        })),
        descuento,
        metodoPago,
        notas
      }

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      })

      if (response.ok) {
        const newSale = await response.json()
        toast.success('Venta procesada exitosamente')
        clearCart()
        setIsCartOpen(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al procesar la venta')
      }
    } catch (error) {
      console.error('Error processing sale:', error)
      toast.error('Error de conexion')
    }
  }

  const value: CartContextType = {
    cart,
    cliente,
    descuento,
    metodoPago,
    notas,
    isCartOpen,
    isScanning,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    setCliente,
    setDescuento,
    setMetodoPago,
    setNotas,
    setIsCartOpen,
    setIsScanning,
    calculateSubtotal,
    calculateTotal,
    scanBarcode,
    processSale
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
