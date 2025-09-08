'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus, Search, ArrowLeft, AlertTriangle, CheckCircle, Tag, Pill, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  _id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precioCompra: number;
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

export default function InventoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availableCategories, setAvailableCategories] = useState<{ _id: string; nombre: string; activo: boolean }[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [createForm, setCreateForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    precioCompra: '',
    stock: '',
    stockMinimo: '',
    categoria: '',
    laboratorio: '',
    codigo: '',
    codigoBarras: '',
    requiereReceta: false
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || !session.user) {
      router.push('/login');
      return;
    }

    fetchProducts();
    fetchCategories();
  }, [session, status, router]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter]);

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

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setAvailableCategories(data.filter((cat: any) => cat.activo));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const normalizeText = (text: string): string => {
    if (!text) return '';
    return text
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' '); // Normalize spaces
  };

  const categoryOptions = availableCategories.map(cat => cat.nombre);

  const filterProducts = () => {
    let filtered = products;

    // Primero filtrar por categoría (si no es "all")
    if (categoryFilter !== 'all') {
      const normalizedFilter = normalizeText(categoryFilter);
      filtered = filtered.filter(product => {
        const productCategory = product.categoria || '';
        const normalizedProductCategory = normalizeText(productCategory);
        return normalizedProductCategory === normalizedFilter;
      });
    }

    // Luego filtrar por búsqueda dentro de la categoría seleccionada
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.laboratorio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.codigo && product.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.codigoBarras && product.codigoBarras.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredProducts(filtered);
  };

  const createProduct = async () => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createForm,
          precio: parseFloat(createForm.precio),
          precioCompra: parseFloat(createForm.precioCompra),
          stock: parseInt(createForm.stock),
          stockMinimo: parseInt(createForm.stockMinimo)
        }),
      });

      if (response.ok) {
        toast.success('Producto creado exitosamente');
        setIsCreateDialogOpen(false);
        setCreateForm({
          nombre: '',
          descripcion: '',
          precio: '',
          precioCompra: '',
          stock: '',
          stockMinimo: '',
          categoria: '',
          laboratorio: '',
          codigo: '',
          codigoBarras: '',
          requiereReceta: false
        });
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear producto');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Error de conexión');
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setCreateForm({
      nombre: product.nombre,
      descripcion: product.descripcion,
      precio: product.precio.toString(),
      precioCompra: product.precioCompra.toString(),
      stock: product.stock.toString(),
      stockMinimo: product.stockMinimo.toString(),
      categoria: product.categoria,
      laboratorio: product.laboratorio,
      codigo: product.codigo || '',
      codigoBarras: product.codigoBarras || '',
      requiereReceta: product.requiereReceta
    });
    setIsEditDialogOpen(true);
  };

  const updateProduct = async () => {
    if (!editingProduct) return;

    try {
      const response = await fetch(`/api/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createForm,
          precio: parseFloat(createForm.precio),
          precioCompra: parseFloat(createForm.precioCompra),
          stock: parseInt(createForm.stock),
          stockMinimo: parseInt(createForm.stockMinimo)
        }),
      });

      if (response.ok) {
        toast.success('Producto actualizado exitosamente');
        setIsEditDialogOpen(false);
        setEditingProduct(null);
        setCreateForm({
          nombre: '',
          descripcion: '',
          precio: '',
          precioCompra: '',
          stock: '',
          stockMinimo: '',
          categoria: '',
          laboratorio: '',
          codigo: '',
          codigoBarras: '',
          requiereReceta: false
        });
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar producto');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Error de conexión');
    }
  };

  const openDeleteDialog = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const deleteProduct = async () => {
    if (!productToDelete) return;

    try {
      const response = await fetch(`/api/products/${productToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Producto eliminado exitosamente');
        setIsDeleteDialogOpen(false);
        setProductToDelete(null);
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al eliminar producto');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error de conexión');
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stock <= product.stockMinimo) {
      return { status: 'low', color: 'destructive' as const, icon: AlertTriangle };
    }
    if (product.stock <= product.stockMinimo * 1.5) {
      return { status: 'warning', color: 'secondary' as const, icon: AlertTriangle };
    }
    return { status: 'good', color: 'default' as const, icon: CheckCircle };
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || !session.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 -z-10" />

      <div className="container mx-auto px-6 py-8 relative">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Inventario
                  </h1>
                  <p className="text-gray-600 text-lg">Gestión inteligente de productos farmacéuticos</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="flex items-center gap-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
              <Button
                onClick={() => router.push('/inventory/categories')}
                variant="outline"
                className="flex items-center gap-2 border-purple-300 text-purple-700 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 shadow-sm"
              >
                <Tag className="h-4 w-4" />
                Categorías
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                    <Plus className="h-4 w-4" />
                    Nuevo Producto
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-4">
                  <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    Crear Nuevo Producto
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Complete la información del producto para agregarlo al inventario
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Sección de Identificación */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Identificación del Producto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="codigo" className="text-sm font-medium text-gray-700">
                          Código Interno *
                        </Label>
                        <Input
                          id="codigo"
                          value={createForm.codigo}
                          onChange={(e) => setCreateForm({ ...createForm, codigo: e.target.value })}
                          placeholder="Ej: PROD-001"
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="codigoBarras" className="text-sm font-medium text-gray-700">
                          Código de Barras
                        </Label>
                        <Input
                          id="codigoBarras"
                          value={createForm.codigoBarras}
                          onChange={(e) => setCreateForm({ ...createForm, codigoBarras: e.target.value })}
                          placeholder="Escanee o ingrese el código"
                          className="font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sección de Información Básica */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Información Básica</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombre" className="text-sm font-medium text-gray-700">
                          Nombre del Producto *
                        </Label>
                        <Input
                          id="nombre"
                          value={createForm.nombre}
                          onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
                          placeholder="Ingrese el nombre completo del producto"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="descripcion" className="text-sm font-medium text-gray-700">
                          Descripción
                        </Label>
                        <Input
                          id="descripcion"
                          value={createForm.descripcion}
                          onChange={(e) => setCreateForm({ ...createForm, descripcion: e.target.value })}
                          placeholder="Descripción detallada del producto"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sección de Precios */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Precios</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="precioCompra" className="text-sm font-medium text-gray-700">
                          Precio de Compra *
                        </Label>
                        <Input
                          id="precioCompra"
                          type="number"
                          step="0.01"
                          value={createForm.precioCompra}
                          onChange={(e) => setCreateForm({ ...createForm, precioCompra: e.target.value })}
                          placeholder="0.00"
                          className="text-right"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="precio" className="text-sm font-medium text-gray-700">
                          Precio de Venta *
                        </Label>
                        <Input
                          id="precio"
                          type="number"
                          step="0.01"
                          value={createForm.precio}
                          onChange={(e) => setCreateForm({ ...createForm, precio: e.target.value })}
                          placeholder="0.00"
                          className="text-right"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sección de Inventario */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Control de Inventario</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="stock" className="text-sm font-medium text-gray-700">
                          Stock Inicial *
                        </Label>
                        <Input
                          id="stock"
                          type="number"
                          value={createForm.stock}
                          onChange={(e) => setCreateForm({ ...createForm, stock: e.target.value })}
                          placeholder="0"
                          className="text-right"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stockMinimo" className="text-sm font-medium text-gray-700">
                          Stock Mínimo *
                        </Label>
                        <Input
                          id="stockMinimo"
                          type="number"
                          value={createForm.stockMinimo}
                          onChange={(e) => setCreateForm({ ...createForm, stockMinimo: e.target.value })}
                          placeholder="0"
                          className="text-right"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sección de Clasificación */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Clasificación</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="categoria" className="text-sm font-medium text-gray-700">
                            Categoría *
                          </Label>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => router.push('/inventory/categories')}
                            className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                          >
                            Gestionar categorías
                          </Button>
                        </div>
                        <Select
                          value={createForm.categoria}
                          onValueChange={(value) => setCreateForm({ ...createForm, categoria: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCategories.map((category) => (
                              <SelectItem key={category._id} value={category.nombre}>
                                {category.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="laboratorio" className="text-sm font-medium text-gray-700">
                          Laboratorio *
                        </Label>
                        <Input
                          id="laboratorio"
                          value={createForm.laboratorio}
                          onChange={(e) => setCreateForm({ ...createForm, laboratorio: e.target.value })}
                          placeholder="Nombre del laboratorio fabricante"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sección de Configuración */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Configuración</h3>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="requiereReceta"
                        checked={createForm.requiereReceta}
                        onChange={(e) => setCreateForm({ ...createForm, requiereReceta: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="requiereReceta" className="text-sm font-medium text-gray-700">
                        Requiere receta médica
                      </Label>
                    </div>
                  </div>
                </div>

                <DialogFooter className="border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="mr-2"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    onClick={createProduct}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Producto
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Edit Product Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                Editar Producto
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Modifique la información del producto según sea necesario
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Sección de Identificación */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Identificación del Producto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-codigo" className="text-sm font-medium text-gray-700">
                      Código Interno
                    </Label>
                    <Input
                      id="edit-codigo"
                      value={createForm.codigo}
                      onChange={(e) => setCreateForm({ ...createForm, codigo: e.target.value })}
                      placeholder="Ej: PROD-001"
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-codigoBarras" className="text-sm font-medium text-gray-700">
                      Código de Barras
                    </Label>
                    <Input
                      id="edit-codigoBarras"
                      value={createForm.codigoBarras}
                      onChange={(e) => setCreateForm({ ...createForm, codigoBarras: e.target.value })}
                      placeholder="Escanee o ingrese el código"
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Sección de Información Básica */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Información Básica</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-nombre" className="text-sm font-medium text-gray-700">
                      Nombre del Producto *
                    </Label>
                    <Input
                      id="edit-nombre"
                      value={createForm.nombre}
                      onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
                      placeholder="Ingrese el nombre completo del producto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-descripcion" className="text-sm font-medium text-gray-700">
                      Descripción
                    </Label>
                    <Input
                      id="edit-descripcion"
                      value={createForm.descripcion}
                      onChange={(e) => setCreateForm({ ...createForm, descripcion: e.target.value })}
                      placeholder="Descripción detallada del producto"
                    />
                  </div>
                </div>
              </div>

              {/* Sección de Precios */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Precios</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-precioCompra" className="text-sm font-medium text-gray-700">
                      Precio de Compra *
                    </Label>
                    <Input
                      id="edit-precioCompra"
                      type="number"
                      step="0.01"
                      value={createForm.precioCompra}
                      onChange={(e) => setCreateForm({ ...createForm, precioCompra: e.target.value })}
                      placeholder="0.00"
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-precio" className="text-sm font-medium text-gray-700">
                      Precio de Venta *
                    </Label>
                    <Input
                      id="edit-precio"
                      type="number"
                      step="0.01"
                      value={createForm.precio}
                      onChange={(e) => setCreateForm({ ...createForm, precio: e.target.value })}
                      placeholder="0.00"
                      className="text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Sección de Inventario */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Control de Inventario</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-stock" className="text-sm font-medium text-gray-700">
                      Stock Actual *
                    </Label>
                    <Input
                      id="edit-stock"
                      type="number"
                      value={createForm.stock}
                      onChange={(e) => setCreateForm({ ...createForm, stock: e.target.value })}
                      placeholder="0"
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-stockMinimo" className="text-sm font-medium text-gray-700">
                      Stock Mínimo *
                    </Label>
                    <Input
                      id="edit-stockMinimo"
                      type="number"
                      value={createForm.stockMinimo}
                      onChange={(e) => setCreateForm({ ...createForm, stockMinimo: e.target.value })}
                      placeholder="0"
                      className="text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Sección de Clasificación */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Clasificación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="edit-categoria" className="text-sm font-medium text-gray-700">
                        Categoría *
                      </Label>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => router.push('/inventory/categories')}
                        className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                      >
                        Gestionar categorías
                      </Button>
                    </div>
                    <Select
                      value={createForm.categoria}
                      onValueChange={(value) => setCreateForm({ ...createForm, categoria: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.map((category) => (
                          <SelectItem key={category._id} value={category.nombre}>
                            {category.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-laboratorio" className="text-sm font-medium text-gray-700">
                      Laboratorio *
                    </Label>
                    <Input
                      id="edit-laboratorio"
                      value={createForm.laboratorio}
                      onChange={(e) => setCreateForm({ ...createForm, laboratorio: e.target.value })}
                      placeholder="Nombre del laboratorio fabricante"
                    />
                  </div>
                </div>
              </div>

              {/* Sección de Configuración */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Configuración</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-requiereReceta"
                    checked={createForm.requiereReceta}
                    onChange={(e) => setCreateForm({ ...createForm, requiereReceta: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="edit-requiereReceta" className="text-sm font-medium text-gray-700">
                    Requiere receta médica
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="mr-2"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                onClick={updateProduct}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                <Edit className="h-4 w-4 mr-2" />
                Actualizar Producto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>

        {/* Modern Filters Section */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Search className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Filtros y Búsqueda</h3>
                <p className="text-sm text-gray-600">Encuentra rápidamente tus productos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Buscar por nombre, código, descripción o laboratorio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-12 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="rounded-lg">Todas las categorías</SelectItem>
                    {categoryOptions.map((categoryName) => (
                      <SelectItem key={categoryName} value={categoryName} className="rounded-lg">
                        {categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Products Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl shadow-blue-500/10">
          <CardHeader className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-b border-gray-100/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Productos ({filteredProducts.length})</CardTitle>
                <CardDescription className="text-gray-600">
                  Lista completa de productos en inventario con información detallada
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-blue-50/30 hover:from-gray-50 hover:to-blue-50/50 transition-all duration-200">
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Producto</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Categoría</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Laboratorio</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Código</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Código de Barras</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Stock</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Precio</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Estado</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product: Product) => {
                    const stockStatus = getStockStatus(product);
                    const StatusIcon = stockStatus.icon;

                    return (
                      <TableRow
                        key={product._id}
                        className="border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 transition-all duration-200 group"
                      >
                        <TableCell className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                              {product.nombre}
                            </div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {product.descripcion}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge
                            variant="outline"
                            className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700 font-medium shadow-sm"
                          >
                            {product.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="text-gray-700 font-medium">{product.laboratorio}</span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded-md text-gray-700">
                            {product.codigo || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded-md text-gray-700">
                            {product.codigoBarras || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-lg ${
                              product.stock <= product.stockMinimo ? 'text-red-600' :
                              product.stock <= product.stockMinimo * 1.5 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {product.stock}
                            </span>
                            {product.stock <= product.stockMinimo && (
                              <StatusIcon className="h-5 w-5 text-red-500 animate-pulse" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="font-bold text-gray-900 text-lg">
                              ${product.precio.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              Compra: ${product.precioCompra.toLocaleString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant={stockStatus.color as "default" | "secondary" | "destructive" | "outline"}
                              className={`font-medium shadow-sm ${
                                stockStatus.color === 'default' ? 'bg-green-100 text-green-800 border-green-200' :
                                stockStatus.color === 'destructive' ? 'bg-red-100 text-red-800 border-red-200' :
                                'bg-gray-100 text-gray-800 border-gray-200'
                              }`}
                            >
                              {product.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                            {product.requiereReceta && (
                              <Badge
                                variant="destructive"
                                className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium shadow-sm"
                              >
                                <Pill className="h-3 w-3 mr-1" />
                                Receta
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => openEditDialog(product)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 border-blue-200 text-blue-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </Button>
                            <Button
                              onClick={() => openDeleteDialog(product)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50 transition-all duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Eliminar Producto
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea eliminar el producto <strong>&quot;{productToDelete?.nombre}&quot;</strong>?
              <br />
              <span className="text-red-600 font-medium">
                Esta acción no se puede deshacer.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteProduct}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}