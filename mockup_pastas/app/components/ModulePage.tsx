import { Outlet, useLocation } from "react-router";

import { PlaceholderPage } from "~/components/PlaceholderPage";
import { NAV_SECTIONS } from "~/data/navigation";

export default function ModulePage({ sectionTo }: { sectionTo: string }) {
  const location = useLocation();
  const isModuleRoot = location.pathname === sectionTo;

  if (!isModuleRoot) {
    return <Outlet />;
  }

  const section = NAV_SECTIONS.find((s) => s.to === sectionTo);
  return (
    <PlaceholderPage
      title={section?.label ?? sectionTo}
      links={section?.items ?? []}
    />
  );
}