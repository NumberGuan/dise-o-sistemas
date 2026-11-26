import { Link, useLocation, useSearchParams } from "react-router";
import { useEffect, useRef, type ReactNode } from "react";
import "./auth-layout.css";

type AuthLayoutProps = { children: ReactNode; title: string; subtitle: string };

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const { pathname } = useLocation();
  const isLogin = pathname === "/login";
  const [params] = useSearchParams();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpen = !isLogin || params.get("acceso") === "1";
  const redirectTo = params.get("redirectTo");
  const authParams = new URLSearchParams();
  if (redirectTo) authParams.set("redirectTo", redirectTo);
  const closeUrl = `/login${authParams.size ? `?${authParams}` : ""}`;
  authParams.set("acceso", "1");
  const loginUrl = `/login?${authParams}`;
  const registerUrl = `/register?${authParams}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!isOpen) {
      dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      dialog.close();
    };
  }, [isOpen]);

  return <main className="auth-page">
    <img className="landing-background" src="/hero-pastas.jpg" alt="" fetchPriority="high" />
    <div className="landing-shade" aria-hidden="true" />
    <div className="landing-shell">
      <header className="landing-header">
        <Link to={closeUrl} className="landing-brand" aria-label="Pasta · Inicio">
          <img src="/logo-pasta.png" alt="Logo de Pasta" />
          <span>Fábrica de pastas<span>El sabor de compartir</span></span>
        </Link>
        <nav aria-label="Navegación principal" className="landing-nav">
          <Link to="/catalogo" className="landing-nav-catalog">Nuestro catálogo</Link>
          <Link to={loginUrl} className="landing-login">Iniciar sesión <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" /></svg></Link>
        </nav>
      </header>
      <section className="landing-content" aria-labelledby="landing-title">
        <p className="landing-eyebrow"><span aria-hidden="true" /> De nuestra cocina a tu mesa</p>
        <h1 id="landing-title">La buena pasta.<br />Los buenos<br /><em>momentos.</em></h1>
        <p className="landing-description">Hay sabores que nos reúnen. Encontrá tus pastas favoritas y llevá a tu mesa ese sabor que siempre invita a compartir.</p>
        <div className="landing-actions">
          <Link to="/catalogo" className="landing-primary">Explorar catálogo <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg></Link>
          <Link to={loginUrl} className="landing-secondary">Iniciar sesión</Link>
        </div>
        <p className="landing-invitation">Elegí lo que te gusta. Nosotros ponemos el sabor.</p>
      </section>
      <footer className="landing-footer"><p>Una mesa, muchas historias.</p><span>Pastas · Salsas · Momentos compartidos</span></footer>
    </div>
    <div className="landing-stamp" aria-hidden="true"><span>El sabor de</span><strong>estar<br />juntos.</strong><span>Fábrica de pastas</span></div>
    <dialog ref={dialogRef} className="auth-dialog" aria-labelledby="auth-title" aria-describedby="auth-subtitle" onCancel={event => event.preventDefault()}>
      <div className="auth-card">
        <div className="auth-modal-heading"><span>Tu lugar en nuestra mesa</span><Link to={closeUrl} className="auth-close" aria-label="Cerrar y volver al inicio"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></Link></div>
        <nav className="auth-tabs" aria-label="Acceso a tu cuenta"><Link to={loginUrl} aria-current={isLogin ? "page" : undefined}>Ingresar</Link><Link to={registerUrl} aria-current={!isLogin ? "page" : undefined}>Crear cuenta</Link></nav>
        <header className="auth-card-title"><p className="auth-eyebrow">{isLogin ? "Qué bueno tenerte de vuelta" : "Hay un lugar para vos en la mesa"}</p><h2 id="auth-title">{title}</h2><p id="auth-subtitle">{subtitle}</p></header>
        <div className="auth-form">{children}</div>
        <Link to="/catalogo" className="auth-catalog"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15" /></svg>Explorar catálogo</Link>
        <p className="auth-switch">{isLogin ? "¿Todavía no tenés una cuenta?" : "¿Ya tenés una cuenta?"} <Link to={isLogin ? registerUrl : loginUrl}>{isLogin ? "Creá una aquí." : "Ingresá aquí."}</Link></p>
      </div>
    </dialog>
  </main>;
}
