import { useState, type ReactNode } from "react";

type SortValue = string | number | null | undefined;
type SortKey<Row> = (row: Row, index: number) => SortValue;
type Field<Row> = [label: string, value: SortKey<Row>];
type Column<Row> = [heading: string | Field<Row>, className?: string, extraFields?: Field<Row>[]];
type Direction = "ascending" | "descending";
type Sort = { label: string; direction: Direction };
type MapRows<Row> = (render: (row: Row, originalIndex: number) => ReactNode) => ReactNode[];

type SortableProps<Row> = {
  rows: readonly Row[];
  columns: Column<Row>[];
  newest?: string;
  latestFirst?: SortKey<Row>;
  tieBreaker?: SortKey<Row>;
  children: (mapRows: MapRows<Row>) => ReactNode;
};

const collator = new Intl.Collator("es-AR", { numeric: true, sensitivity: "base" });

function isMissing(value: SortValue) {
  return value == null || value === "" || (typeof value === "number" && !Number.isFinite(value));
}

function compare(a: SortValue, b: SortValue, direction: Direction) {
  if (isMissing(a)) return isMissing(b) ? 0 : 1;
  if (isMissing(b)) return -1;
  const result = typeof a === "number" && typeof b === "number"
    ? a - b
    : collator.compare(String(a), String(b));
  return direction === "descending" ? -result : result;
}

function useSortedRows<Row>({ rows, columns, newest, latestFirst, tieBreaker }: SortableProps<Row>, editingOrder?: ReadonlyMap<number, number>) {
  const [selection, setSelection] = useState<Sort>();
  const sort = selection ?? (newest ? { label: newest, direction: "descending" } as const : undefined);
  const fields = columns.flatMap(([heading, , extraFields = []]) => typeof heading === "string" ? [] : [heading, ...extraFields]);
  const value = fields.find(([label]) => label === sort?.label)?.[1];
  const direction = sort?.direction ?? "descending";
  const sortKey = value ?? latestFirst;
  const ordered = rows.map((row, index) => ({
    row,
    index,
    value: sortKey?.(row, index),
    tie: tieBreaker?.(row, index),
  }));
  if (editingOrder) {
    ordered.sort((a, b) => (editingOrder.get(a.index) ?? a.index) - (editingOrder.get(b.index) ?? b.index));
  } else if (sortKey) {
    ordered.sort((a, b) => compare(a.value, b.value, direction) || compare(a.tie, b.tie, "descending"));
  }

  function changeSort(label: string) {
    setSelection(current => {
      const active = current ?? sort;
      return {
        label,
        direction: active?.label === label && active.direction === "ascending" ? "descending" : "ascending",
      };
    });
  }

  const mapRows: MapRows<Row> = render => ordered.map(({ row, index }) => render(row, index));
  return { sort, changeSort, mapRows, ordered };
}

function SortButton({ label, direction, onClick }: { label: string; direction?: Direction; onClick: () => void }) {
  const current = direction === "ascending" ? ", ascendente" : direction ? ", descendente" : "";
  return (
    <button
      type="button"
      className="inline-flex min-w-0 cursor-pointer items-center gap-1 rounded px-0.5 py-1 text-inherit hover:text-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
      aria-label={`Ordenar por ${label}${current}`}
      onClick={onClick}
    >
      {label}
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`size-3.5 shrink-0 ${direction ? "text-amber-800" : "text-gray-500"}`}>
        {direction !== "descending" && <path d="m5 6 3-3 3 3" />}
        {direction !== "ascending" && <path d="m5 10 3 3 3-3" />}
      </svg>
    </button>
  );
}

function renderHeading<Row>(heading: Column<Row>[0], extraFields: Field<Row>[], sort: Sort | undefined, changeSort: (label: string) => void, compact = false) {
  if (typeof heading === "string") return heading;
  return <div className={`inline-flex items-center ${compact ? "flex-nowrap gap-x-1 whitespace-nowrap" : "flex-wrap gap-x-2"}`}>
    {[heading, ...extraFields].map(([label]) => <SortButton key={label} label={label} direction={sort?.label === label ? sort.direction : undefined} onClick={() => changeSort(label)} />)}
  </div>;
}

export function SortableTable<Row>(props: SortableProps<Row> & {
  className?: string;
  headClassName?: string;
  headerRowClassName?: string;
  bodyClassName?: string;
  print?: boolean;
}) {
  const [editingOrder, setEditingOrder] = useState<ReadonlyMap<number, number>>();
  const { sort, changeSort, mapRows, ordered } = useSortedRows(props, editingOrder);
  return (
    <table className={props.className}>
      <thead className={props.headClassName}>
        <tr className={props.headerRowClassName}>
          {props.columns.map(([heading, className, extraFields = []], index) => (
            <th key={index} scope="col" className={className} aria-sort={typeof heading !== "string" && [heading, ...extraFields].some(([label]) => label === sort?.label) ? sort?.direction : undefined}>
              {props.print && typeof heading !== "string" ? [heading, ...extraFields].map(([label]) => label).join(" / ") : renderHeading(heading, extraFields, sort, label => {
                setEditingOrder(undefined);
                changeSort(label);
              })}
            </th>
          ))}
        </tr>
      </thead>
      <tbody
        className={props.bodyClassName}
        onFocus={event => {
          if (!editingOrder && event.target.matches("input, select, textarea")) {
            // Keep the active input in place while its value changes.
            setEditingOrder(new Map(ordered.map(({ index }, position) => [index, position])));
          }
        }}
        onBlur={event => {
          if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget) || !event.relatedTarget.matches("input, select, textarea")) {
            setEditingOrder(undefined);
          }
        }}
      >
        {props.children(mapRows)}
      </tbody>
    </table>
  );
}

export function SortableList<Row>(props: SortableProps<Row> & {
  headerClassName: string;
  actionClassName?: string;
  compactHeadings?: boolean;
}) {
  const { sort, changeSort, mapRows } = useSortedRows(props);
  return (
    <>
      <div className={props.headerClassName}>
        {props.columns.map(([heading, className, extraFields = []], index) => (
          <div key={index} className={typeof heading === "string" ? props.actionClassName : className}>
            {renderHeading(heading, extraFields, sort, changeSort, props.compactHeadings)}
          </div>
        ))}
      </div>
      {props.children(mapRows)}
    </>
  );
}
