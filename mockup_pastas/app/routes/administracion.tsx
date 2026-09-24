import { PlaceholderPage } from "~/components/PlaceholderPage";
import { NAV_SECTIONS } from "~/data/navigation";

export default function Administracion() {
  const section = NAV_SECTIONS.find((s) => s.to === "/administracion");
  return <PlaceholderPage title="Administración" links={section?.items ?? []} />;
}