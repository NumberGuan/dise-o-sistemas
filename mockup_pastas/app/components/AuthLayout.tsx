import { Link, useLocation } from "react-router";
import { Logo } from "~/components/icons";
import { ORDENES } from "~/data/ordenes";
import { PROVEEDORES } from "~/data/proveedores";

type AuthLayoutProps = {
  children: React.ReactNode;
  title: string;
  subtitle: string;
};

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const { pathname } = useLocation();
  const isLogin = pathname === "/login";

  return (
    <div className="min-h-screen flex w-full bg-white">
      {/* Left Column (Branding & Info) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-50 via-white to-amber-50 px-12 py-12 border-r border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-sm border border-amber-200">
              <Logo />
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-gray-900 tracking-tight">Fábrica de Pastas</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 border border-gray-200">PRO</span>
            </div>
          </div>
          <div className="mt-1 text-sm font-medium text-gray-500">
            ERP Industrial & Gestión Fabril
          </div>
        </div>

        <div className="my-16 max-w-lg">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 leading-tight">
            Precisión industrial con maestría artesanal.
          </h1>
          
          <div className="mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <img 
              src="/logo-pasta.png" 
              alt="Fábrica de Pastas" 
              className="h-full w-full object-cover opacity-90 mix-blend-multiply"
            />
          </div>

          <p className="mt-6 text-lg text-gray-600">
            Gestión integral de producción, recetas tradicionales, balance de masas y trazabilidad en planta en tiempo real.
          </p>

          <div className="mt-10 flex gap-4">
            <div className="flex-1 rounded-2xl bg-white p-5 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
              <p className="text-xs font-bold text-gray-500 tracking-wider uppercase">Abastecimiento</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{ORDENES.length} Órdenes</p>
              <p className="mt-1 text-sm text-amber-700 font-medium">De compra emitidas</p>
            </div>
            <div className="flex-1 rounded-2xl bg-white p-5 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
              <p className="text-xs font-bold text-gray-500 tracking-wider uppercase">Proveedores</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{PROVEEDORES.filter((p) => p.estado === "Activo").length} Activos</p>
              <p className="mt-1 text-sm text-rose-700 font-medium">En el sistema</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-medium text-gray-500">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 border border-gray-200">
              <Logo />
            </span>
            <span>Planta Industrial Central • San Telmo, Bs. As.</span>
          </div>
          <span className="text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-md">v2.4.1</span>
        </div>
      </div>

      {/* Right Column (Auth Form) */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          {/* Tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-10 shadow-inner">
            <Link
              to="/login"
              className={`flex-1 flex justify-center rounded-lg py-2.5 text-sm font-semibold transition-all ${
                isLogin
                  ? "bg-white text-amber-700 shadow border border-gray-200"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/register"
              className={`flex-1 flex justify-center rounded-lg py-2.5 text-sm font-semibold transition-all ${
                !isLogin
                  ? "bg-white text-amber-700 shadow border border-gray-200"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Registrarse
            </Link>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
            <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
          </div>

          <div className="mt-8">
            {children}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Servidores de Planta: Operativos
            </span>
            <span className="hidden sm:inline">|</span>
            <a href="#" className="hover:text-gray-600 transition">Soporte TI</a>
            <span className="hidden sm:inline">|</span>
            <a href="#" className="hover:text-gray-600 transition">Manual de Usuario</a>
          </div>
        </div>
      </div>
    </div>
  );
}
