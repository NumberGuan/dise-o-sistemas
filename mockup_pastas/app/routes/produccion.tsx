import { PlaceholderPage } from "~/components/PlaceholderPage";
import { NAV_SECTIONS } from "~/data/navigation";

export default function Produccion() {
  const section = NAV_SECTIONS.find((s) => s.to === "/produccion");
  return <PlaceholderPage title="Producción" links={section?.items ?? []} />;
}