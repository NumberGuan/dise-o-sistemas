import { PlaceholderPage } from "~/components/PlaceholderPage";
import { NAV_SECTIONS } from "~/data/navigation";

export default function Ventas() {
  const section = NAV_SECTIONS.find((s) => s.to === "/ventas");
  return <PlaceholderPage title="Ventas" links={section?.items ?? []} />;
}