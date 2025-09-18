'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Package, Plus, Edit, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  _id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precioUnidad: number;
  precioCaja: number;
  precioCompra: number;
  precioCompraUnidad: number;
  precioCompraCaja: number;
  stockCajas: number;
  unidadesPorCaja: number;
  stockUnidadesSueltas: number;
  stock: number;
  stockMinimo: number;
  categoria: string;
  laboratorio: string;
  codigo?: string;
  codigoBarras?: string;
  requiereReceta: boolean;
  activo: boolean;
  fechaCreacion: string;
}

interface InventoryUpdateForm {
  stockCajas: string;
  unidadesPorCaja: string;
  stockUnidadesSueltas: string;
  precioCompra: string;
  precioCompraUnidad: string;
  precioCompraCaja: string;
  precio: string;
  precioUnidad: string;
  precioCaja: string;
}

export default function InventoryManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState<InventoryUpdateForm>({
    stockCajas: '',
    unidadesPorCaja: '',
    stockUnidadesSueltas: '',
    precioCompra: '',
    precioCompraUnidad: '',
    precioCompraCaja: '',
    precio: '',
    precioUnidad: '',
    precioCaja: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        toast.error('Error al cargar productos');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const openUpdateDialog = (product: Product) => {
    setSelectedProduct(product);
    setUpdateForm({
      stockCajas: product.stockCajas.toString(),
      unidadesPorCaja: product.unidadesPorCaja.toString(),
      stockUnidadesSueltas: product.stockUnidadesSueltas.toString(),
      precioCompra: product.precioCompra.toString(),
      precioCompraUnidad: (product.precioCompraUnidad || 0).toString(),
      precioCompraCaja: (product.precioCompraCaja || 0).toString(),
      precio: product.precio.toString(),
      precioUnidad: (product.precioUnidad || 0).toString(),
      precioCaja: (product.precioCaja || 0).toString()
    });
    setIsUpdateDialogOpen(true);
  };

  const updateInventory = async () => {
    if (!selectedProduct) return;

    try {
      const response = await fetch(`/api/products/${selectedProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockCajas: parseInt(updateForm.stockCajas) || 0,
          unidadesPorCaja: parseInt(updateForm.unidadesPorCaja) || 1,
          stockUnidadesSueltas: parseInt(updateForm.stockUnidadesSueltas) || 0,
          precioCompra: parseFloat(updateForm.precioCompra),
          precioCompraUnidad: parseFloat(updateForm.precioCompraUnidad) || 0,
          precioCompraCaja: parseFloat(updateForm.precioCompraCaja) || 0,
          precio: parseFloat(updateForm.precio),
          precioUnidad: parseFloat(updateForm.precioUnidad) || 0,
          precioCaja: parseFloat(updateForm.precioCaja) || 0
        }),
      });

      if (response.ok) {
        toast.success('Inventario actualizado exitosamente');
        setIsUpdateDialogOpen(false);
        setSelectedProduct(null);
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar inventario');
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast.error('Error de conexión');
    }
  };

  const addStock = (type: 'cajas' | 'unidades', amount: number) => {
    if (!selectedProduct) return;

    const currentCajas = parseInt(updateForm.stockCajas) || 0;
    const currentUnidades = parseInt(updateForm.stockUnidadesSueltas) || 0;
    const unidadesPorCaja = parseInt(updateForm.unidadesPorCaja) || 1;

    if (type === 'cajas') {
      setUpdateForm({
        ...updateForm,
        stockCajas: (currentCajas + amount).toString()
      });
    } else {
      setUpdateForm({
        ...updateForm,
        stockUnidadesSueltas: (currentUnidades + amount).toString()
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Inventario</h1>
        <p className="text-gray-600">Actualiza stock y precios de productos sin modificar su información básica</p>
      </div>

      {/* Barra de búsqueda */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">
                Buscar productos
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por nombre, código o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de productos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos ({filteredProducts.length})
          </CardTitle>
          <CardDescription>
            Selecciona un producto para actualizar su inventario y precios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Stock Actual</TableHead>
                <TableHead>Precio Venta</TableHead>
                <TableHead>Precio Compra</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product._id}>
                  <TableCell className="font-medium">{product.nombre}</TableCell>
                  <TableCell className="font-mono text-sm">{product.codigo}</TableCell>
                  <TableCell>{product.categoria}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-bold">{product.stock} total</div>
                      <div className="text-gray-500">
                        {product.stockCajas} cajas × {product.unidadesPorCaja} + {product.stockUnidadesSueltas} sueltas
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>${product.precio.toLocaleString()} (unidad)</div>
                      {product.precioCaja > 0 && (
                        <div className="text-gray-500">${product.precioCaja.toLocaleString()} (caja)</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>${product.precioCompra.toLocaleString()} (unidad)</div>
                      {product.precioCompraCaja > 0 && (
                        <div className="text-gray-500">${product.precioCompraCaja.toLocaleString()} (caja)</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUpdateDialog(product)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Actualizar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de actualización de inventario */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Actualizar Inventario - {selectedProduct?.nombre}
            </DialogTitle>
            <DialogDescription>
              Modifica el stock y precios del producto. Los cambios se aplicarán inmediatamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Sección de Stock */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Control de Stock</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="update-stockCajas" className="text-sm font-medium text-gray-700">
                    Cajas
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="update-stockCajas"
                      type="number"
                      value={updateForm.stockCajas}
                      onChange={(e) => setUpdateForm({ ...updateForm, stockCajas: e.target.value })}
                      placeholder="0"
                      className="text-right"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addStock('cajas', 1)}
                      className="px-3"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="update-unidadesPorCaja" className="text-sm font-medium text-gray-700">
                    Unidades por Caja
                  </Label>
                  <Input
                    id="update-unidadesPorCaja"
                    type="number"
                    value={updateForm.unidadesPorCaja}
                    onChange={(e) => setUpdateForm({ ...updateForm, unidadesPorCaja: e.target.value })}
                    placeholder="1"
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="update-stockUnidadesSueltas" className="text-sm font-medium text-gray-700">
                    Unidades Sueltas
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="update-stockUnidadesSueltas"
                      type="number"
                      value={updateForm.stockUnidadesSueltas}
                      onChange={(e) => setUpdateForm({ ...updateForm, stockUnidadesSueltas: e.target.value })}
                      placeholder="0"
                      className="text-right"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addStock('unidades', 1)}
                      className="px-3"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-md">
                <div className="text-sm text-blue-800">
                  <strong>Total estimado:</strong> {((parseInt(updateForm.stockCajas) || 0) * (parseInt(updateForm.unidadesPorCaja) || 1)) + (parseInt(updateForm.stockUnidadesSueltas) || 0)} unidades
                </div>
              </div>
            </div>

            {/* Sección de Precios de Compra */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Precios de Compra</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="update-precioCompra" className="text-sm font-medium text-gray-700">
                    Por Unidad *
                  </Label>
                  <Input
                    id="update-precioCompra"
                    type="number"
                    step="0.01"
                    value={updateForm.precioCompra}
                    onChange={(e) => setUpdateForm({ ...updateForm, precioCompra: e.target.value })}
                    placeholder="0.00"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="update-precioCompraCaja" className="text-sm font-medium text-gray-700">
                    Por Caja
                  </Label>
                  <Input
                    id="update-precioCompraCaja"
                    type="number"
                    step="0.01"
                    value={updateForm.precioCompraCaja}
                    onChange={(e) => setUpdateForm({ ...updateForm, precioCompraCaja: e.target.value })}
                    placeholder="0.00"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="update-precioCompraUnidad" className="text-sm font-medium text-gray-700">
                    Unidad en Caja
                  </Label>
                  <Input
                    id="update-precioCompraUnidad"
                    type="number"
                    step="0.01"
                    value={updateForm.precioCompraUnidad}
                    onChange={(e) => setUpdateForm({ ...updateForm, precioCompraUnidad: e.target.value })}
                    placeholder="0.00"
                    className="text-right"
                  />
                </div>
              </div>
            </div>

            {/* Sección de Precios de Venta */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Precios de Venta</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="update-precio" className="text-sm font-medium text-gray-700">
                    Por Unidad *
                  </Label>
                  <Input
                    id="update-precio"
                    type="number"
                    step="0.01"
                    value={updateForm.precio}
                    onChange={(e) => setUpdateForm({ ...updateForm, precio: e.target.value })}
                    placeholder="0.00"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="update-precioCaja" className="text-sm font-medium text-gray-700">
                    Por Caja
                  </Label>
                  <Input
                    id="update-precioCaja"
                    type="number"
                    step="0.01"
                    value={updateForm.precioCaja}
                    onChange={(e) => setUpdateForm({ ...updateForm, precioCaja: e.target.value })}
                    placeholder="0.00"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="update-precioUnidad" className="text-sm font-medium text-gray-700">
                    Unidad en Caja
                  </Label>
                  <Input
                    id="update-precioUnidad"
                    type="number"
                    step="0.01"
                    value={updateForm.precioUnidad}
                    onChange={(e) => setUpdateForm({ ...updateForm, precioUnidad: e.target.value })}
                    placeholder="0.00"
                    className="text-right"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={updateInventory} className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Actualizar Inventario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}