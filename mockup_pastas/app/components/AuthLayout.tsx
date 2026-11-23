import { Link, useLocation, useSearchParams } from "react-router";
import type { ReactNode } from "react";
import "./auth-layout.css";

type AuthLayoutProps = { children: ReactNode; title: string; subtitle: string };

function BenefitIcon({ kind }: { kind: "cart" | "heart" | "box" }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind === "cart" ? <><path d="M3 3h2l2.5 12h11L21 7H6M8 19h.01M18 19h.01" /><circle cx="8" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></> : kind === "heart" ? <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /> : <><path d="m12 3 9 5-9 5-9-5 9-5ZM3 8v10l9 5 9-5V8M12 13v10M7.5 5.5l9 5" /></>}</svg>;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const { pathname } = useLocation();
  const isLogin = pathname === "/login";
  const [params] = useSearchParams();
  const authQuery = params.get("redirectTo") ? `?${new URLSearchParams({ redirectTo: params.get("redirectTo")! })}` : "";
  return <main className="auth-page">
    <div className="auth-scene" aria-hidden="true" />
    <div className="auth-container">
      <section className="auth-story" aria-labelledby="auth-welcome">
        <Link to="/catalogo" className="auth-brand" aria-label="Fábrica de Pastas · Ir al catálogo"><img src="/logo-pasta.png" alt="" /><span>Fábrica<br />de Pastas</span></Link>
        <div className="auth-story-copy"><p className="auth-eyebrow">De nuestra cocina a tu mesa</p><h1 id="auth-welcome">Tus pastas y pedidos,<br className="auth-desktop-break" /> en un solo lugar.</h1><p className="auth-description">Explorá nuestro catálogo, armá tu carrito y guardá tus favoritos. Todo listo para tu próxima mesa compartida.</p>
          <ul className="auth-benefits">{([{ kind: "cart", text: <>Comprá fácil<br />y rápido</> }, { kind: "heart", text: <>Guardá tus<br />favoritos</> }, { kind: "box", text: <>Seguí tus<br />pedidos</> }] as const).map(item => <li key={item.kind}><span><BenefitIcon kind={item.kind} /></span><p>{item.text}</p></li>)}</ul>
        </div>
        <div className="auth-photo"><img src="/hero-pastas.jpg" alt="Ravioles y cintas de pasta fresca sobre una mesa de cocina" fetchPriority="high" /><div className="auth-photo-caption"><span>El sabor de lo hecho en casa.</span><p>Un encuentro empieza con un buen plato.</p></div><div className="auth-seal" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M11 30C3 15 23 7 31 7c1 12-2 29-20 23Zm0 0L29 9M16 24l-1-9m7 3 8 1" /></svg><span>Pastas<br />para compartir</span></div></div>
      </section>
      <section className="auth-access" aria-label={title}>
        <p className="auth-motto">Pastas que<br /><span>inspiran momentos</span></p>
        <div className="auth-card">
          <nav className="auth-tabs" aria-label="Acceso a tu cuenta"><Link to={`/login${authQuery}`} aria-current={isLogin ? "page" : undefined}>Ingresar</Link><Link to={`/register${authQuery}`} aria-current={!isLogin ? "page" : undefined}>Crear cuenta</Link></nav>
          <header className="auth-card-title"><p className="auth-eyebrow">{isLogin ? "Qué bueno tenerte de vuelta" : "Hay un lugar para vos en la mesa"}</p><h2>{title}</h2><p>{subtitle}</p></header>
          <div className="auth-form">{children}</div>
          <Link to="/catalogo" className="auth-catalog"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15" /></svg>Explorar catálogo</Link>
          <p className="auth-switch">{isLogin ? "¿Todavía no tenés una cuenta?" : "¿Ya tenés una cuenta?"} <Link to={`${isLogin ? "/register" : "/login"}${authQuery}`}>{isLogin ? "Creá una aquí." : "Ingresá aquí."}</Link></p>
        </div>
        <p className="auth-access-note">El catálogo siempre está abierto. Exploralo a tu gusto.</p>
      </section>
    </div>
  </main>;
}
