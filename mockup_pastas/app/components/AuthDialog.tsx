import { useEffect, useRef } from "react";
import { Form, Link, useActionData, useFetcher, useNavigate, useNavigation } from "react-router";
import AuthPasswordField from "~/components/AuthPasswordField";
import "./auth-layout.css";

export type AuthMode = "login" | "register";

type AuthDialogProps = {
  mode: AuthMode | null;
  loginUrl: string;
  registerUrl: string;
  closeUrl: string;
  redirectTo?: string;
  storefront?: boolean;
};

const inputClass = "block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm";
const labelClass = "block text-sm font-medium text-gray-700";

function AuthForm({ mode, redirectTo, storefront }: { mode: AuthMode; redirectTo?: string; storefront: boolean }) {
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const fetcher = useFetcher<{ error?: string }>();
  const isRegister = mode === "register";
  const error = (storefront ? fetcher.data : actionData)?.error;
  const isSubmitting = storefront ? fetcher.state !== "idle" : navigation.state !== "idle" && navigation.formMethod === "POST";
  const AuthFormElement = storefront ? fetcher.Form : Form;

  return (
    <AuthFormElement noValidate method="post" action={storefront ? `/${mode}?acceso=1` : undefined} preventScrollReset className="space-y-6">
      <input type="hidden" name="redirectTo" value={redirectTo ?? ""} />
      <div className="space-y-4">
        {isRegister && (
          <div>
            <label htmlFor="name" className={labelClass}>Nombre completo</label>
            <input id="name" name="name" type="text" required minLength={2} maxLength={100} autoComplete="name" placeholder="Juan Pérez" className={`mt-1 ${inputClass}`} />
          </div>
        )}
        <div>
          <label htmlFor="email" className={labelClass}>Correo electrónico</label>
          <input id="email" name="email" type="email" required autoComplete="email" placeholder="nombre@correo.com" className={`mt-1 ${inputClass}`} />
        </div>
        <div>
          <label htmlFor="password" className={labelClass}>{isRegister ? "Contraseña (mínimo 6 caracteres)" : "Contraseña"}</label>
          <AuthPasswordField newPassword={isRegister} invalid={Boolean(error)} />
        </div>
        {isRegister && <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">Las cuentas creadas desde este formulario tienen acceso de Cliente.</p>}
      </div>
      {error && <p id="auth-error" role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-amber-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-800 disabled:opacity-70">
        {isRegister ? (isSubmitting ? "Creando cuenta…" : "Crear cuenta") : (isSubmitting ? "Ingresando…" : "Ingresar al Sistema")}
      </button>
    </AuthFormElement>
  );
}

export default function AuthDialog({ mode, loginUrl, registerUrl, closeUrl, redirectTo, storefront = false }: AuthDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const isOpen = mode !== null;
  const isLogin = mode === "login";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen) return;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      dialog.close();
    };
  }, [isOpen]);

  return (
    <dialog ref={dialogRef} className="auth-dialog" aria-labelledby="auth-title" aria-describedby="auth-subtitle" onCancel={event => {
      event.preventDefault();
      void navigate(closeUrl, { replace: true, preventScrollReset: true });
    }}>
      {mode && <div className="auth-card">
        <div className="auth-modal-heading">
          <span>Tu lugar en nuestra mesa</span>
          <Link to={closeUrl} replace preventScrollReset className="auth-close" aria-label={storefront ? "Cerrar acceso a tu cuenta" : "Cerrar y volver al inicio"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </Link>
        </div>
        <nav className="auth-tabs" aria-label="Acceso a tu cuenta">
          <Link to={loginUrl} replace preventScrollReset aria-current={isLogin ? "page" : undefined}>Ingresar</Link>
          <Link to={registerUrl} replace preventScrollReset aria-current={!isLogin ? "page" : undefined}>Crear cuenta</Link>
        </nav>
        <header className="auth-card-title">
          <p className="auth-eyebrow">{isLogin ? "Qué bueno tenerte de vuelta" : "Hay un lugar para vos en la mesa"}</p>
          <h2 id="auth-title">{isLogin ? "Iniciar sesión" : "Crear cuenta de cliente"}</h2>
          <p id="auth-subtitle">{isLogin ? "Ingresá para comprar, guardar favoritos y consultar tus pedidos." : "Creá tu cuenta para confirmar pedidos y guardar favoritos."}</p>
        </header>
        <div className="auth-form"><AuthForm key={mode} mode={mode} redirectTo={redirectTo} storefront={storefront} /></div>
        {!storefront && <Link to="/catalogo" className="auth-catalog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15" /></svg>
          Explorar catálogo
        </Link>}
        <p className="auth-switch">{isLogin ? "¿Todavía no tenés una cuenta?" : "¿Ya tenés una cuenta?"} <Link to={isLogin ? registerUrl : loginUrl} replace preventScrollReset>{isLogin ? "Creá una aquí." : "Ingresá aquí."}</Link></p>
      </div>}
    </dialog>
  );
}
