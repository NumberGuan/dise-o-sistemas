import { Link, useLocation } from "react-router";
import { Logo } from "~/components/icons";

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
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-orange-50 via-white to-amber-50 px-12 py-12 border-r border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-sm border border-amber-200">
              <Logo />
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-gray-900 tracking-tight">Fábrica de Pastas</span>
            </div>
          </div>
        </div>

        <div className="my-16 max-w-lg">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 leading-tight">
            Tus pastas y pedidos, en un solo lugar.
          </h1>
          
          <div className="mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <img
              src="/hero-pastas.jpg"
              alt="Pastas frescas"
              className="h-full w-full object-cover"
            />
          </div>

          <p className="mt-6 text-lg text-gray-600">
            Iniciá sesión para consultar el catálogo, guardar favoritos y revisar tus pedidos.
          </p>
        </div>

        <div className="flex items-center text-xs font-medium text-gray-500">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 border border-gray-200">
              <Logo />
            </span>
            <span>Fábrica de Pastas</span>
          </div>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <div className="flex rounded-xl bg-gray-100 p-1 mb-10 shadow-inner">
            <Link
              to="/login"
              className={`flex-1 flex justify-center rounded-lg py-2.5 text-sm font-semibold transition-all ${
                isLogin
                  ? "bg-white text-amber-700 shadow border border-gray-200"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Ingresar
            </Link>
            <Link
              to="/register"
              className={`flex-1 flex justify-center rounded-lg py-2.5 text-sm font-semibold transition-all ${
                !isLogin
                  ? "bg-white text-amber-700 shadow border border-gray-200"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Crear cuenta
            </Link>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
            <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
          </div>

          <div className="mt-8">
            {children}
          </div>

        </div>
      </div>
    </div>
  );
}
