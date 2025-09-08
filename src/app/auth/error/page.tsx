import { NextPage } from 'next';
import Link from 'next/link';

const AuthError: NextPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Error de Autenticación
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ha ocurrido un error durante la autenticación.
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error de configuración
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Por favor, contacta al administrador del sistema o intenta nuevamente más tarde.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <Link
              href="/login"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Volver al Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthError;
