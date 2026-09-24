import { PlaceholderPage } from "~/components/PlaceholderPage";
import { NAV_SECTIONS } from "~/data/navigation";

export default function Compras() {
  const section = NAV_SECTIONS.find((s) => s.to === "/compras");
  return <PlaceholderPage title="Compras" links={section?.items ?? []} />;
}