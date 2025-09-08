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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus, Search, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.laboratorio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.codigo && product.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.codigoBarras && product.codigoBarras.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.categoria === categoryFilter);
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

  const categories = [...new Set(products.map(p => p.categoria))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-8 w-8 text-blue-600" />
              Inventario
            </h1>
            <p className="text-gray-600 mt-1">Gestiona el stock y productos de la farmacia</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
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
                        <Label htmlFor="categoria" className="text-sm font-medium text-gray-700">
                          Categoría *
                        </Label>
                        <Input
                          id="categoria"
                          value={createForm.categoria}
                          onChange={(e) => setCreateForm({ ...createForm, categoria: e.target.value })}
                          placeholder="Ej: Analgésicos, Antibióticos"
                        />
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

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros y Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nombre, descripción o laboratorio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Productos ({filteredProducts.length})</CardTitle>
            <CardDescription>
              Lista completa de productos en inventario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Laboratorio</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Código de Barras</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product: Product) => {
                  const stockStatus = getStockStatus(product);
                  const StatusIcon = stockStatus.icon;

                  return (
                    <TableRow key={product._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.nombre}</div>
                          <div className="text-sm text-gray-500">{product.descripcion}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.categoria}</Badge>
                      </TableCell>
                      <TableCell>{product.laboratorio}</TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{product.codigo || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{product.codigoBarras || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            product.stock <= product.stockMinimo ? 'text-red-600' :
                            product.stock <= product.stockMinimo * 1.5 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {product.stock}
                          </span>
                          {product.stock <= product.stockMinimo && (
                            <StatusIcon className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">${product.precio.toLocaleString()}</div>
                          <div className="text-gray-500">${product.precioCompra.toLocaleString()}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Badge variant={stockStatus.color as "default" | "secondary" | "destructive" | "outline"}>
                            {product.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                          {product.requiereReceta && (
                            <Badge variant="destructive">Receta</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
