'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Dashboard de SaludDirecta
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Bienvenido, {session?.user?.name}. Rol: {session?.user?.role}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Inventario</h2>
            <p className="text-gray-600">Gestionar medicamentos</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Ventas</h2>
            <p className="text-gray-600">Procesar ventas</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Reportes</h2>
            <p className="text-gray-600">Ver estadísticas</p>
          </div>
          {session?.user?.role === 'admin' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">Usuarios</h2>
              <p className="text-gray-600">Gestionar usuarios del sistema</p>
              <Button
                onClick={() => router.push('/admin/users')}
                className="mt-4"
                variant="outline"
              >
                Gestionar Usuarios
              </Button>
            </div>
          )}
        </div>
        <div className="mt-8">
          <Button onClick={() => signOut({ callbackUrl: '/login' })} variant="outline">
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
