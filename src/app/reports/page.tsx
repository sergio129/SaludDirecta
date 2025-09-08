'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, ArrowLeft, TrendingUp, Package, ShoppingCart, Users, DollarSign } from 'lucide-react';

interface Stats {
  totalProductos: { value: string; change: number; changeType: string };
  ventasHoy: { value: string; change: number; changeType: string };
  usuariosActivos: { value: string; change: number; changeType: string };
  pedidosPendientes: { value: string; change: number; changeType: string };
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || !session.user) {
      router.push('/login');
      return;
    }

    fetchStats();
  }, [session, status, router, period]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              Reportes y Estadísticas
            </h1>
            <p className="text-gray-600 mt-1">Análisis completo del rendimiento de la farmacia</p>
          </div>
          <div className="flex gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
                <SelectItem value="year">Este año</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Productos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats ? stats.totalProductos.value : '0'}
                  </p>
                  <p className={`text-sm font-medium ${
                    stats?.totalProductos.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats ? `${stats.totalProductos.change >= 0 ? '+' : ''}${stats.totalProductos.change}%` : '0%'} vs período anterior
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 bg-opacity-10">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Ventas del Período</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats ? stats.ventasHoy.value : '$0'}
                  </p>
                  <p className={`text-sm font-medium ${
                    stats?.ventasHoy.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats ? `${stats.ventasHoy.change >= 0 ? '+' : ''}${stats.ventasHoy.change}%` : '0%'} vs período anterior
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-green-600 bg-opacity-10">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Usuarios Activos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats ? stats.usuariosActivos.value : '0'}
                  </p>
                  <p className={`text-sm font-medium ${
                    stats?.usuariosActivos.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats ? `${stats.usuariosActivos.change >= 0 ? '+' : ''}${stats.usuariosActivos.change}%` : '0%'} vs período anterior
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 bg-opacity-10">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pedidos Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats ? stats.pedidosPendientes.value : '0'}
                  </p>
                  <p className={`text-sm font-medium ${
                    stats?.pedidosPendientes.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats ? `${stats.pedidosPendientes.change >= 0 ? '+' : ''}${stats.pedidosPendientes.change}%` : '0%'} vs período anterior
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 bg-opacity-10">
                  <ShoppingCart className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Tendencias de Ventas
              </CardTitle>
              <CardDescription>
                Análisis de ventas por período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Gráfico de tendencias próximamente disponible</p>
                  <p className="text-sm">Se implementará con datos históricos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                Productos Más Vendidos
              </CardTitle>
              <CardDescription>
                Ranking de productos por volumen de ventas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Ranking de productos próximamente disponible</p>
                  <p className="text-sm">Se implementará con datos de ventas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Reports */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
            <CardHeader>
              <CardTitle className="text-lg">Reporte de Inventario</CardTitle>
              <CardDescription>
                Estado actual del stock y productos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push('/inventory')}
              >
                Ver Inventario
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
            <CardHeader>
              <CardTitle className="text-lg">Historial de Ventas</CardTitle>
              <CardDescription>
                Registro completo de transacciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => router.push('/sales')}
              >
                Ver Ventas
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
            <CardHeader>
              <CardTitle className="text-lg">Gestión de Usuarios</CardTitle>
              <CardDescription>
                Administrar usuarios del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => router.push('/admin/users')}
              >
                Ver Usuarios
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
