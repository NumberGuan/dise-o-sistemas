import { PlaceholderPage } from "~/components/PlaceholderPage";
import { NAV_SECTIONS } from "~/data/navigation";

export default function Mantenimiento() {
  const section = NAV_SECTIONS.find((s) => s.to === "/mantenimiento");
  return <PlaceholderPage title="Mantenimiento" links={section?.items ?? []} />;
}