import { useId, type ReactNode } from "react";

const heroImages = {
  catalogo: "/hero-pastas.jpg",
  carrito: "/hero-carrito.webp",
  favoritos: "/hero-favoritos.webp",
  pedidos: "/hero-pedidos.webp",
  perfil: "/hero-perfil.webp",
};

type ShopPageHeroProps = {
  title: string;
  description?: string;
  art: keyof typeof heroImages;
  label?: string;
  children?: ReactNode;
};

export default function ShopPageHero({ title, description, art, label = "Compras", children }: ShopPageHeroProps) {
  const titleId = useId();
  const isCatalog = art === "catalogo";

  return (
    <header aria-labelledby={titleId} className={`relative isolate overflow-hidden rounded-3xl border border-[#eadfd3] bg-[#fffaf4] shadow-sm${isCatalog ? " catalog-hero" : ""}`}>
      <img
        src={heroImages[art]}
        alt=""
        fetchPriority={isCatalog ? "high" : undefined}
        className={isCatalog
          ? "catalog-hero-image absolute inset-0 -z-20 h-full w-full object-cover"
          : "absolute inset-y-0 right-0 -z-20 h-full w-[60%] object-contain object-right opacity-60 sm:right-4 sm:w-[44%] sm:opacity-95 lg:right-8"}
      />
      <div aria-hidden="true" className={isCatalog
        ? "catalog-hero-shade absolute inset-0 -z-10"
        : "absolute inset-0 -z-10 bg-gradient-to-r from-[#fffaf4] via-[#fffaf4]/90 to-[#fffaf4]/10 sm:via-[#fffaf4]/55 sm:to-transparent"}
      />
      <div className={isCatalog
        ? "max-w-3xl px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16"
        : "px-6 py-7 sm:max-w-[65%] sm:px-10 sm:py-9 lg:px-14 lg:py-11"}>
        <span className={isCatalog ? "catalog-hero-label" : "inline-flex rounded-full border border-amber-800/15 bg-white/75 px-3 py-1 text-xs font-semibold tracking-wide text-amber-900"}>{label}</span>
        <h1 id={titleId} className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-lg text-sm leading-6 text-gray-700 sm:text-base">{description}</p>}
        {children && <div className="mt-4 flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </header>
  );
}
