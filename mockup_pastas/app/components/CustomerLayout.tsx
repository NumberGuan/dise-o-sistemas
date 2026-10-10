import { useEffect, useRef, useState } from "react";
import { Form, Link, NavLink, useLocation } from "react-router";

import { Logo } from "~/components/icons";
import type { PublicUser } from "~/utils/db.server";

const customerLinks = [
  { label: "Catálogo", to: "/compras/catalogo" },
  { label: "Favoritos", to: "/compras/favoritos" },
  { label: "Mis pedidos", to: "/compras/pedidos" },
  { label: "Carrito", to: "/compras/carrito" },
  { label: "Mi Perfil", to: "/compras/perfil" },
];

export default function CustomerLayout({ user, children }: { user: PublicUser; children: React.ReactNode }) {
  const location = useLocation();
  const [query, setQuery] = useState(() => location.pathname === "/compras/catalogo" ? new URLSearchParams(location.search).get("q") ?? "" : "");
  const [menuOpen, setMenuOpen] = useState(false);
  const wasMenuOpenRef = useRef(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const cartCount = (user.cart ?? []).reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    setQuery(location.pathname === "/compras/catalogo" ? new URLSearchParams(location.search).get("q") ?? "" : "");
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (wasMenuOpenRef.current && !menuOpen && window.matchMedia("(max-width: 767px)").matches) {
      menuButtonRef.current?.focus();
    }
    wasMenuOpenRef.current = menuOpen;
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("a")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const items = drawerRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    function handleBreakpointChange(event: MediaQueryListEvent) {
      if (!event.matches) setMenuOpen(false);
    }
    mobileQuery.addEventListener("change", handleBreakpointChange);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      mobileQuery.removeEventListener("change", handleBreakpointChange);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  function renderLinks() {
    return customerLinks.map((item) => (
      <li key={item.to}>
        <NavLink
          to={item.to}
          className={({ isActive }) => `flex min-h-11 items-center justify-between rounded-xl px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 ${isActive ? "bg-amber-100 text-amber-950" : "text-gray-700 hover:bg-amber-50 hover:text-gray-950"}`}
        >
          {item.label}
          {item.to === "/compras/carrito" && <span className="min-w-6 rounded-full bg-white px-1.5 py-0.5 text-center text-xs text-amber-900" aria-label={`${cartCount} productos`}>{cartCount}</span>}
        </NavLink>
      </li>
    ));
  }

  function renderLogout() {
    return (
      <Form action="/logout" method="post">
        <button type="submit" className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-gray-600 transition hover:bg-amber-50 hover:text-gray-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true"><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M14 8l4 4-4 4M18 12H8" /></svg>
          Cerrar sesión
        </button>
      </Form>
    );
  }

  function renderProfile() {
    return (
      <div
        className="flex min-w-0 items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-3"
        role="group"
        aria-label={`Usuario ${user.name}, perfil ${user.role}`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-900">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-amber-800">Perfil activo</span>
          <span className="mt-1 block truncate text-sm font-semibold text-gray-900">{user.name}</span>
          <span className="mt-0.5 block truncate text-xs text-gray-600">{user.role}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf8f3] text-gray-900">
      <a href="#contenido" className="sr-only z-50 rounded bg-white p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">
        Ir al contenido
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[#eadfd3] bg-[#fffdfa] px-4 py-5 md:flex">
        <Link to="/compras/catalogo" className="mb-8 flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-700">
          <Logo />
          <span className="leading-tight"><span className="block text-sm font-bold tracking-tight text-gray-900">Fábrica de Pastas</span><span className="block text-xs text-gray-500">Tienda</span></span>
        </Link>
        <nav aria-label="Navegación de compras" className="flex min-h-0 flex-1 flex-col">
          <ul className="flex-1 space-y-1 overflow-y-auto">{renderLinks()}</ul>
          <div className="mt-4 space-y-3 border-t border-[#f0e7dd] pt-4">{renderProfile()}{renderLogout()}</div>
        </nav>
      </aside>
      {menuOpen && <div className="fixed inset-0 z-50 md:hidden">
        <button type="button" aria-label="Cerrar menú" className="absolute inset-0 bg-gray-950/40" onClick={() => setMenuOpen(false)} />
        <aside ref={drawerRef} role="dialog" aria-modal="true" aria-label="Menú de compras" className="relative flex h-dvh w-72 max-w-[85vw] flex-col bg-[#fffdfa] px-4 py-5 shadow-xl">
          <div className="mb-8 flex items-center justify-between">
            <Link to="/compras/catalogo" className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-700"><Logo /><span className="leading-tight"><span className="block text-sm font-bold tracking-tight text-gray-900">Fábrica de Pastas</span><span className="block text-xs text-gray-500">Tienda</span></span></Link>
            <button type="button" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-700"><span aria-hidden="true" className="text-2xl leading-none">×</span></button>
          </div>
          <nav aria-label="Navegación de compras" className="flex min-h-0 flex-1 flex-col">
            <ul className="flex-1 space-y-1 overflow-y-auto">{renderLinks()}</ul>
            <div className="mt-4 space-y-3 border-t border-[#f0e7dd] pt-4">
              {renderProfile()}
              {renderLogout()}
            </div>
          </nav>
        </aside>
      </div>}
      <div className="md:ml-64" inert={menuOpen}>
      <header className="sticky top-0 z-30 border-b border-[#eadfd3] bg-[#fffdfa]/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:px-8">
          <button ref={menuButtonRef} type="button" aria-label="Abrir menú lateral" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e8ddd0] text-gray-700 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 md:hidden">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-5 w-5" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <Link to="/compras/catalogo" className="flex min-w-0 shrink-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-700 md:hidden">
            <Logo />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-bold tracking-tight text-gray-900 sm:text-base">Fábrica de Pastas</span>
              <span className="block text-xs text-gray-500">Tienda</span>
            </span>
          </Link>

          <Form action="/compras/catalogo" method="get" role="search" className="order-3 flex w-full items-center gap-2 rounded-xl border border-[#e8ddd0] bg-white px-3 py-2 focus-within:border-amber-600 focus-within:ring-2 focus-within:ring-amber-100 lg:order-none lg:mx-5 lg:flex-1 lg:max-w-xl">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>
            <label htmlFor="customer-search" className="sr-only">Buscar productos</label>
            <input id="customer-search" type="search" name="q" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar en el catálogo" className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-gray-400 focus:ring-0" />
            <button type="submit" className="hidden rounded-lg px-2.5 py-1 text-sm font-medium text-amber-800 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 sm:inline-flex">Buscar</button>
          </Form>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <Link to="/compras/carrito" aria-label={`Ver carrito, ${cartCount} ${cartCount === 1 ? "producto" : "productos"}`} className="relative inline-flex h-10 items-center gap-2 rounded-xl border border-[#e8ddd0] bg-white px-3 text-sm font-semibold text-gray-800 transition hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true"><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.5a2 2 0 0 0 1.9-1.4L20 8H6" /><circle cx="9.5" cy="19" r="1.2" /><circle cx="17" cy="19" r="1.2" /></svg>
              <span className="hidden sm:inline">Carrito</span>
              <span className="min-w-5 rounded-full bg-amber-700 px-1.5 py-0.5 text-center text-xs font-bold text-white" aria-hidden="true">{cartCount}</span>
            </Link>
          </div>
        </div>
      </header>
      <main id="contenido" className="min-h-[calc(100vh-11rem)]">{children}</main>
      <footer className="border-t border-[#eadfd3] bg-[#fffdfa] px-4 py-6 text-center text-xs text-gray-500">
        Fábrica de Pastas · Compras
      </footer>
      </div>
    </div>
  );
}
