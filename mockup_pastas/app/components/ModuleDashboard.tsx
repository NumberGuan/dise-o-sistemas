import { Link } from "react-router";

import { AnimatedNumber } from "~/components/motion";

export type DashboardMetricTone = "neutral" | "success" | "info" | "warning";

export type DashboardMetric = {
  label: string;
  value: number | string;
  tone?: DashboardMetricTone;
};

export type DashboardDistributionItem = {
  label: string;
  value: number | string;
};

type ModuleDashboardProps = {
  moduleLabel: string;
  title: string;
  description: string;
  summaryTitle: string;
  summaryDescription: string;
  action?: {
    label: string;
    to: string;
  };
  metrics: readonly DashboardMetric[];
  distributionTitle: string;
  distributionDescription?: string;
  distribution: readonly DashboardDistributionItem[];
};

const METRIC_TONES: Record<DashboardMetricTone, string> = {
  neutral: "border-gray-200 bg-white text-gray-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
};

function metricGridClass(metricCount: number) {
  if (metricCount === 3) {
    return "sm:grid-cols-3";
  }

  if (metricCount === 2) {
    return "sm:grid-cols-2";
  }

  return "sm:grid-cols-2 xl:grid-cols-4";
}

export function DashboardEmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
      {message}
    </p>
  );
}

export default function ModuleDashboard({
  moduleLabel,
  title,
  description,
  summaryTitle,
  summaryDescription,
  action,
  metrics,
  distributionTitle,
  distributionDescription,
  distribution,
}: ModuleDashboardProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <p className="text-sm font-medium text-amber-700">{moduleLabel}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">{description}</p>
      </header>

      <section aria-labelledby={`dashboard-${moduleLabel}-summary`} className="mt-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 id={`dashboard-${moduleLabel}-summary`} className="text-lg font-semibold text-gray-900">
              {summaryTitle}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{summaryDescription}</p>
          </div>
          {action && (
            <Link
              to={action.to}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
            >
              {action.label}
            </Link>
          )}
        </div>

        {metrics.length > 0 ? (
          <dl className={`mt-5 grid gap-4 ${metricGridClass(metrics.length)}`}>
            {metrics.map((metric) => {
              const tone = metric.tone ?? "neutral";
              return (
                <div key={metric.label} className={`rounded-xl border p-5 shadow-sm ${METRIC_TONES[tone]}`}>
                  <dt className="text-sm font-medium opacity-80">{metric.label}</dt>
                  <dd className="mt-2 text-3xl font-bold tabular-nums">{typeof metric.value === "number" ? <AnimatedNumber value={metric.value} /> : metric.value}</dd>
                </div>
              );
            })}
          </dl>
        ) : (
          <div className="mt-5">
            <DashboardEmptyState message="No hay información disponible para resumir en este módulo." />
          </div>
        )}

        <section aria-labelledby={`dashboard-${moduleLabel}-distribution`} className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 id={`dashboard-${moduleLabel}-distribution`} className="font-semibold text-gray-900">
            {distributionTitle}
          </h3>
          {distributionDescription && <p className="mt-1 text-sm text-gray-500">{distributionDescription}</p>}
          {distribution.length > 0 ? (
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {distribution.map((item) => (
                <div key={item.label} className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-3">
                  <dt className="min-w-0 break-words text-sm text-gray-600">{item.label}</dt>
                  <dd className="shrink-0 font-semibold text-gray-900">{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="mt-4">
              <DashboardEmptyState message="Todavía no hay datos para esta distribución." />
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
