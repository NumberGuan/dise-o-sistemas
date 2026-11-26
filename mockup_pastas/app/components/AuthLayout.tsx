import { Link, useSearchParams } from "react-router";
import AuthDialog, { type AuthMode } from "~/components/AuthDialog";

export default function AuthLayout({ mode }: { mode: AuthMode }) {
  const [params] = useSearchParams();
  const isOpen = mode === "register" || params.get("acceso") === "1";
  const redirectTo = params.get("redirectTo");
  const authParams = new URLSearchParams();
  if (redirectTo) authParams.set("redirectTo", redirectTo);
  const closeUrl = `/login${authParams.size ? `?${authParams}` : ""}`;
  authParams.set("acceso", "1");
  const loginUrl = `/login?${authParams}`;
  const registerUrl = `/register?${authParams}`;

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
    <AuthDialog mode={isOpen ? mode : null} loginUrl={loginUrl} registerUrl={registerUrl} closeUrl={closeUrl} redirectTo={redirectTo ?? undefined} />
  </main>;
}
