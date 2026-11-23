import ProductionDocument, { ProductionSection } from "~/components/ProductionDocument";
import { SortableList } from "~/components/SortableRows";
import { CatalogField } from "~/components/InlineCatalog";
import ModulePageHeader from "~/components/ModulePageHeader";
import FormalPageHeader from "~/components/FormalPageHeader";
import { useProductionCatalogs } from "~/components/CatalogProvider";
import RecordPage, { RecordNotFound } from "~/components/RecordPage";
import { useRecordScreen } from "~/utils/useRecordScreen";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { ProductForm } from "./productos";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "react-router";
import { SAMPLE_MACHINES } from "~/data/maintenance";
import {
  MATERIAS_PRIMAS_PRODUCCION, PRODUCTOS_PRODUCCION, RECETAS,
  codigo, getMateriaPrima, siguienteId, guardarRecetaConProducto, unidadesCompatibles,
  type DetalleMateriaPrima, type DetalleRecetaMaquina, type Receta, type Producto,
} from "~/data/produccion";
import { Collapse, rowMotion, toast } from "~/components/motion";
import { brandsForRawMaterial } from "~/data/catalogs";

const field = "mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100";
const labelClass = "block text-sm font-medium text-gray-700";
const filterClass = "h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100";

type MateriaPrimaRow = { key: string; idMateriaPrima: string; idUnidad: string; idMarca: string; cantidadNecesaria: string };
type MaquinaRow = DetalleRecetaMaquina & { key: string };

function formatTiempo(tiempo: string) {
  const [h, m] = tiempo.split(":").map(Number);
  return h ? `${h} h ${m} min` : `${m} min`;
}

function ProductCreateModal({ idReceta, nombre, product, onCancel, onSave }: { idReceta: number; nombre: string; product: Producto | null; onCancel: () => void; onSave: (p: Producto) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    return () => { element?.close(); document.body.style.overflow = overflow; };
  }, []);
  return createPortal(<dialog ref={dialog} aria-label="Crear producto para la receta" aria-modal="true"
    className="fixed m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%_-_2rem)] max-w-4xl overflow-y-auto rounded-xl bg-white p-0 backdrop:bg-gray-900/50"
    onCancel={e => { e.preventDefault(); e.stopPropagation(); }}
    onKeyDown={e => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); } }}>
    <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-3">
      <p className="text-sm text-gray-600">El producto se guardará junto con la receta. Los datos de la receta se conservan.</p>
      <button type="button" aria-label="Cerrar creación de producto" onClick={onCancel} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">✕</button>
    </div>
    <ProductForm product={product} recipeDraft={{ idReceta, nombre }} onCancel={onCancel} onSave={onSave} />
  </dialog>, document.body);
}

function RecipeForm({ recipe, onCancel, onSave }: { recipe: Receta | null; onCancel: () => void; onSave: (r: Receta, p: Producto) => void }) {
  const { catalogs, UNIDADES, formatCantidad } = useProductionCatalogs();
  const [id] = useState(recipe?.idReceta ?? siguienteId(RECETAS.map((r) => r.idReceta)));
  const original = (m: MateriaPrimaRow) => recipe?.materiasPrimas.find((d) => String(d.idMateriaPrima) === m.idMateriaPrima);
  const brandOptions = (m: MateriaPrimaRow) => m.idMateriaPrima ? brandsForRawMaterial(catalogs, Number(m.idMateriaPrima), original(m) && String(original(m)!.idMarca)) : [];
  const [nombre, setNombre] = useState(recipe?.nombre ?? "");
  const [procedimiento, setProcedimiento] = useState(recipe?.procedimiento ?? "");
  const [tiempo, setTiempo] = useState(recipe?.tiempoCoccion ?? "");
  const [temperatura, setTemperatura] = useState(recipe ? String(recipe.temperatura) : "");
  const [materias, setMaterias] = useState<MateriaPrimaRow[]>(() => (recipe?.materiasPrimas ?? []).map((d, i) => ({ key: `mp-${i}`, idMateriaPrima: String(d.idMateriaPrima), idUnidad: String(d.idUnidad), idMarca: String(d.idMarca), cantidadNecesaria: String(d.cantidadNecesaria) })));
  const [maquinas, setMaquinas] = useState<MaquinaRow[]>(() => (recipe?.maquinas ?? []).map((d, i) => ({ ...d, key: `maq-${i}` })));
  const [error, setError] = useState("");
  const [productoId, setProductoId] = useState(String(PRODUCTOS_PRODUCCION.find(p => p.idReceta === recipe?.idReceta)?.idProducto ?? ""));
  const [nuevoProducto, setNuevoProducto] = useState<Producto | null>(null);
  const [showProduct, setShowProduct] = useState(false);
  const productos = [...PRODUCTOS_PRODUCCION.filter(p => p.idReceta === id || !RECETAS.some(r => r.idReceta === p.idReceta)), ...(nuevoProducto ? [nuevoProducto] : [])];
  const producto = productos.find(p => String(p.idProducto) === productoId);

  const updateMateria = (index: number, key: keyof MateriaPrimaRow, value: string) => setMaterias(materias.map((m, i) => i === index ? { ...m, [key]: value } : m));
  const changeMateria = (index: number, idMateriaPrima: string) => setMaterias(materias.map((m, i) => {
    if (i !== index) return m;
    const next = { ...m, idMateriaPrima, idMarca: "", idUnidad: idMateriaPrima ? String(getMateriaPrima(Number(idMateriaPrima))?.idUnidad ?? "") : "" };
    const marcas = brandOptions(next);
    return { ...next, idMarca: marcas.length === 1 ? marcas[0].id : "" };
  }));
  const updateMaquina = (index: number, key: keyof MaquinaRow, value: string) => setMaquinas(maquinas.map((m, i) => i === index ? { ...m, [key]: value } : m));

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!producto) return setError("Seleccioná o creá un producto asociado a la receta.");
    if (!nombre.trim() || !procedimiento.trim()) return setError("Nombre y procedimiento son obligatorios.");
    if (!/^\d{2}:\d{2}$/.test(tiempo)) return setError("Ingresá un tiempo de cocción válido.");
    if (temperatura === "" || Number.isNaN(Number(temperatura))) return setError("Ingresá la temperatura de cocción.");
    if (materias.length === 0) return setError("Agregá al menos una materia prima.");
    if (materias.some((m) => !m.idMateriaPrima || !(Number(m.cantidadNecesaria) > 0))) return setError("Cada materia prima necesita una cantidad mayor a cero.");
    if (materias.some((m) => !m.idUnidad)) return setError("Seleccioná la unidad de cada materia prima.");
    if (materias.some(m => !unidadesCompatibles(getMateriaPrima(Number(m.idMateriaPrima))?.idUnidad ?? 0).includes(Number(m.idUnidad)))) return setError("Elegí unidades compatibles con cada materia prima.");
    const sinMarca = materias.find((m) => !brandOptions(m).some((b) => b.id === m.idMarca));
    if (sinMarca) {
      const nombreMp = getMateriaPrima(Number(sinMarca.idMateriaPrima))?.nombre ?? "la materia prima";
      return setError(brandOptions(sinMarca).length ? `Seleccioná la marca de ${nombreMp}.` : `${nombreMp} no tiene marcas asociadas. Asociala desde Gestión del sistema → Marcas.`);
    }
    if (new Set(materias.map((m) => m.idMateriaPrima)).size !== materias.length) return setError("Hay materias primas repetidas.");
    if (maquinas.some((m) => !m.idMaquina || !m.horaInicio || !m.horaFin)) return setError("Completá máquina, hora de inicio y hora de fin en cada fila.");
    if (maquinas.some((m) => m.horaFin <= m.horaInicio)) return setError("La hora de fin tiene que ser posterior a la de inicio.");
    if (new Set(maquinas.map((m) => m.idMaquina)).size !== maquinas.length) return setError("Hay máquinas repetidas.");

    const detalleMaterias: DetalleMateriaPrima[] = materias.map((m) => ({ idMateriaPrima: Number(m.idMateriaPrima), idUnidad: Number(m.idUnidad), idMarca: Number(m.idMarca), cantidadNecesaria: Number(m.cantidadNecesaria) }));
    const detalleMaquinas: DetalleRecetaMaquina[] = maquinas.map(({ idMaquina, horaInicio, horaFin }) => ({ idMaquina, horaInicio, horaFin }));
    try {
      onSave({ idReceta: id, nombre: nombre.trim(), procedimiento: procedimiento.trim(), tiempoCoccion: tiempo, temperatura: Number(temperatura), materiasPrimas: detalleMaterias, maquinas: detalleMaquinas }, producto);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo guardar la receta."); }
  }

  return (
    <><RecordPage onBack={onCancel}>
      <FormalPageHeader className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-800">Producción</p>
          <h1 className="text-2xl font-bold text-gray-900">{recipe ? "Editar receta" : "Formulario Nueva Receta"}</h1>
          <p className="mt-1 text-sm text-gray-500">{codigo("REC", id)}</p>
        </div>
      </FormalPageHeader>

      <form noValidate id="recipe-form" onSubmit={submit} className="flex-1 p-5 sm:p-6">
        {error && <p role="alert" className="mb-5 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={`${labelClass} sm:col-span-2`}>Nombre <span className="text-rose-600">*</span>
            <input autoFocus required value={nombre} onChange={(e) => setNombre(e.target.value)} className={field} />
          </label>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="recipe-product">Producto asociado <span className="text-rose-600">*</span></label>
            <div className="flex flex-wrap items-end gap-2">
              <select id="recipe-product" required value={productoId} onChange={e => setProductoId(e.target.value)} className={`${field} min-w-48 flex-1`}>
                <option value="">Seleccionar...</option>
                {productos.map(p => <option key={p.idProducto} value={p.idProducto}>{p.nombre}{p === nuevoProducto ? " (nuevo)" : ""}</option>)}
              </select>
              <button type="button" onClick={() => setShowProduct(true)} className="h-10 rounded-lg border border-amber-600 px-3 text-sm font-semibold text-amber-800 hover:bg-amber-50">{nuevoProducto ? "Editar producto nuevo" : "+ Crear producto"}</button>
            </div>
            <p className="mt-2 text-xs text-gray-500">Elegí un producto de esta receta o uno sin receta. Si todavía no existe, crealo aquí.</p>
            {producto && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">Rendimiento por tanda: {formatCantidad(1, producto.idUnidad)} de {producto.nombre}. Ingresá los ingredientes necesarios para esa cantidad.</p>}
          </div>
          <label className={labelClass}>Tiempo de cocción (hh:mm) <span className="text-rose-600">*</span>
            <input type="time" required value={tiempo} onChange={(e) => setTiempo(e.target.value)} className={field} />
          </label>
          <label className={labelClass}>Temperatura (°C) <span className="text-rose-600">*</span>
            <input type="number" step="0.1" required value={temperatura} onChange={(e) => setTemperatura(e.target.value)} className={field} />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>Procedimiento <span className="text-rose-600">*</span>
            <textarea rows={4} required value={procedimiento} onChange={(e) => setProcedimiento(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
          </label>
        </div>

        <div data-validation-message={materias.length ? "" : "Agregá al menos una materia prima."} className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Materias primas</h3>
            <button type="button" onClick={() => setMaterias([...materias, { key: `mp-${Date.now()}`, idMateriaPrima: "", idUnidad: "", idMarca: "", cantidadNecesaria: "" }])} className="text-sm font-semibold text-amber-700 hover:text-amber-800">+ Agregar materia prima</button>
          </div>
          <div className="mt-4">
            {materias.length === 0 && <p className="text-sm text-gray-500">Todavía no agregaste materias primas.</p>}
            <AnimatePresence initial={false}>
            {materias.map((m, idx) => {
              const marcas = brandOptions(m);
              return (
                <Collapse key={m.key} className="pb-3">
                <div className="relative rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <button type="button" onClick={() => setMaterias(materias.filter((_, i) => i !== idx))} className="absolute right-2 top-2 p-2 text-gray-400 hover:text-red-600" aria-label="Quitar materia prima">✕</button>
                  <div className="grid gap-4 pr-6 sm:grid-cols-2 lg:grid-cols-[2fr_1.5fr_1fr_1fr]">
                    <label className={labelClass}>Materia prima <span className="text-rose-600">*</span>
                      <select required value={m.idMateriaPrima} onChange={(e) => changeMateria(idx, e.target.value)} className={field}>
                        <option value="">Seleccionar...</option>
                        {MATERIAS_PRIMAS_PRODUCCION.map((x) => <option key={x.idMateriaPrima} value={x.idMateriaPrima}>{x.nombre}</option>)}
                      </select>
                    </label>
                    <label className={labelClass}>Marca <span className="text-rose-600">*</span>
                      <CatalogField catalog="marcas" disabled={!m.idMateriaPrima} initialMateriaPrima={Number(m.idMateriaPrima)} onCreated={entry => {
                        if (brandsForRawMaterial({ ...catalogs, marcas: [...catalogs.marcas, entry] }, Number(m.idMateriaPrima)).some(b => b.id === entry.id)) updateMateria(idx, "idMarca", entry.id);
                        else setError("La marca se creó. Asociá la materia prima para poder usarla en esta receta.");
                      }}><select required disabled={!m.idMateriaPrima} value={m.idMarca} onChange={(e) => updateMateria(idx, "idMarca", e.target.value)} className={`${field} disabled:bg-gray-100`}>
                        <option value="">{!m.idMateriaPrima ? "Elegí la materia prima" : marcas.length ? "Seleccionar..." : "Sin marcas asociadas"}</option>
                        {marcas.map((b) => <option key={b.id} value={b.id}>{b.name}{!b.active ? " (inactiva)" : ""}</option>)}
                      </select></CatalogField>
                    </label>
                    <label className={labelClass}>Cantidad necesaria <span className="text-rose-600">*</span>
                      <input type="number" min="0.001" step="any" required value={m.cantidadNecesaria} onChange={(e) => updateMateria(idx, "cantidadNecesaria", e.target.value)} className={field} />
                    </label>
                    <label className={labelClass}>Unidad <span className="text-rose-600">*</span>
                      <CatalogField catalog="unidades" disabled={!m.idMateriaPrima} onCreated={entry => {
                        if (unidadesCompatibles(getMateriaPrima(Number(m.idMateriaPrima))?.idUnidad ?? 0).includes(Number(entry.id))) updateMateria(idx, "idUnidad", entry.id);
                        else setError(`La unidad “${entry.name}” se creó y está disponible en productos y materias primas. Esta receta necesita una unidad compatible con el stock de la materia prima.`);
                      }}><select required value={m.idUnidad} onChange={(e) => updateMateria(idx, "idUnidad", e.target.value)} className={field}>
                        <option value="">Seleccionar...</option>
                        {UNIDADES.filter((u) => (u.active || String(u.idUnidad) === m.idUnidad) && unidadesCompatibles(getMateriaPrima(Number(m.idMateriaPrima))?.idUnidad ?? 0).includes(u.idUnidad)).map((u) => <option key={u.idUnidad} value={u.idUnidad}>{u.unidad}</option>)}
                      </select></CatalogField>
                    </label>
                  </div>
                  {m.idMateriaPrima && !marcas.length && <p className="mt-2 text-xs text-amber-800">Esta materia prima no tiene marcas asociadas. Usá el botón + junto a Marca para crear una y asociarla.</p>}
                </div>
                </Collapse>
              );
            })}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Máquinas</h3>
            <button type="button" onClick={() => setMaquinas([...maquinas, { key: `maq-${Date.now()}`, idMaquina: "", horaInicio: "", horaFin: "" }])} className="text-sm font-semibold text-amber-700 hover:text-amber-800">+ Agregar máquina</button>
          </div>
          <div className="mt-4">
            {maquinas.length === 0 && <p className="text-sm text-gray-500">La receta no tiene máquinas asignadas.</p>}
            <AnimatePresence initial={false}>
            {maquinas.map((m, idx) => (
              <Collapse key={m.key} className="pb-3">
              <div className="relative rounded-lg border border-gray-200 bg-gray-50 p-4">
                <button type="button" onClick={() => setMaquinas(maquinas.filter((_, i) => i !== idx))} className="absolute right-2 top-2 p-2 text-gray-400 hover:text-red-600" aria-label="Quitar máquina">✕</button>
                <div className="grid gap-4 pr-6 sm:grid-cols-[2fr_1fr_1fr]">
                  <label className={labelClass}>Máquina <span className="text-rose-600">*</span>
                    <select required value={m.idMaquina} onChange={(e) => updateMaquina(idx, "idMaquina", e.target.value)} className={field}>
                      <option value="">Seleccionar...</option>
                      {SAMPLE_MACHINES.map((x) => <option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}
                    </select>
                  </label>
                  <label className={labelClass}>Hora de inicio <span className="text-rose-600">*</span>
                    <input type="time" required value={m.horaInicio} onChange={(e) => updateMaquina(idx, "horaInicio", e.target.value)} className={field} />
                  </label>
                  <label className={labelClass}>Hora de fin <span className="text-rose-600">*</span>
                    <input type="time" required value={m.horaFin} onChange={(e) => updateMaquina(idx, "horaFin", e.target.value)} className={field} />
                  </label>
                </div>
              </div>
              </Collapse>
            ))}
            </AnimatePresence>
          </div>
        </div>
      </form>

      <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-amber-600">Cancelar</button>
        <button type="submit" form="recipe-form" className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">Guardar receta</button>
      </div>
    </RecordPage>
    {showProduct && <ProductCreateModal idReceta={id} nombre={nombre} product={nuevoProducto} onCancel={() => setShowProduct(false)} onSave={p => { setNuevoProducto(p); setProductoId(String(p.idProducto)); setShowProduct(false); }} />}
    </>
  );
}

function RecipeDetails({ recipe, onClose, onEdit }: { recipe: Receta; onClose: () => void; onEdit: () => void }) {
  const { formatCantidad, getMarca } = useProductionCatalogs();
  const productos = PRODUCTOS_PRODUCCION.filter((p) => p.idReceta === recipe.idReceta);

  return <ProductionDocument title="Ficha de elaboración" name={recipe.nombre} code={codigo("REC", recipe.idReceta)} onClose={onClose}
    actions={<button type="button" onClick={onEdit} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Editar receta</button>}
    metadata={[
      { label: "Tiempo de cocción", value: formatTiempo(recipe.tiempoCoccion) },
      { label: "Temperatura de cocción", value: `${recipe.temperatura} °C` },
      { label: "Materias primas", value: String(recipe.materiasPrimas.length) },
    ]}>
    <ProductionSection title="Rendimiento · Productos asociados">
      {productos.length ? <div className="production-document-table"><table><thead><tr><th scope="col">Código</th><th scope="col">Producto</th><th scope="col" className="numeric">Rendimiento por tanda</th></tr></thead><tbody>{productos.map(product => <tr key={product.idProducto}><td>{codigo("PRO", product.idProducto)}</td><td><Link to={`/produccion/productos?producto=${product.idProducto}`}>{product.nombre}</Link></td><td className="numeric">{formatCantidad(1, product.idUnidad)}</td></tr>)}</tbody></table></div> : <p>Ningún producto usa esta receta.</p>}
    </ProductionSection>
    <ProductionSection title="Composición · Materias primas por tanda">
      <div className="production-document-table"><table><thead><tr><th scope="col">Materia prima</th><th scope="col">Marca</th><th scope="col" className="numeric">Cantidad necesaria</th></tr></thead><tbody>{recipe.materiasPrimas.map(line => <tr key={line.idMateriaPrima}><td><Link to={`/produccion/materias-primas?materia=${line.idMateriaPrima}`}>{getMateriaPrima(line.idMateriaPrima)?.nombre ?? "Materia prima no disponible"}</Link></td><td>{getMarca(line.idMarca)}</td><td className="numeric">{formatCantidad(line.cantidadNecesaria, line.idUnidad)}</td></tr>)}</tbody></table></div>
    </ProductionSection>
    <ProductionSection title="Procedimiento de elaboración"><p className="production-document-procedure">{recipe.procedimiento || "Sin procedimiento registrado."}</p></ProductionSection>
    <ProductionSection title="Equipamiento · Programación de máquinas">
      {recipe.maquinas.length ? <div className="production-document-table"><table><thead><tr><th scope="col">Código / Máquina</th><th scope="col">Hora de inicio</th><th scope="col">Hora de fin</th></tr></thead><tbody>{recipe.maquinas.map(line => {
        const machine = SAMPLE_MACHINES.find(item => item.id === line.idMaquina);
        return <tr key={line.idMaquina}><td>{machine?.name ?? "Máquina no disponible"}<small>{machine?.code}</small></td><td>{line.horaInicio}</td><td>{line.horaFin}</td></tr>;
      })}</tbody></table></div> : <p>La receta no tiene máquinas asignadas.</p>}
    </ProductionSection>
  </ProductionDocument>;
}

export default function Recetas() {
  const [recipes, setRecipes] = useState(() => [...RECETAS]);
  const [search, setSearch] = useState("");
  const { editing, setEditing, selected, setSelected, closeScreen, missing, params } = useRecordScreen(recipes, item => item.idReceta, "receta");

  const filtered = useMemo(() => recipes.filter((r) => {
    const q = search.toLowerCase();
    return !q || [codigo("REC", r.idReceta), r.nombre].some((v) => v.toLowerCase().includes(q));
  }), [recipes, search]);

  useEffect(() => {
    if (editing === undefined && selected === null) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented && !document.querySelector("dialog[open]")) { closeScreen(); }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editing, selected]);

  function closeDetails() {
    setSelected(null);
  }

  function save(r: Receta, producto: Producto) {
    const i = RECETAS.findIndex((x) => x.idReceta === r.idReceta);
    guardarRecetaConProducto(r, producto);
    toast(`La receta ${r.nombre} se ${i >= 0 ? "actualizó" : "agregó"} correctamente.`);
    setRecipes([...RECETAS]);
    setSelected(r);
  }

  if (missing) return <RecordNotFound onBack={closeScreen} />;
  if (editing !== undefined) return <RecipeForm recipe={editing} onCancel={() => setEditing(undefined)} onSave={save} key={params.toString()} />;
  if (selected) return <RecipeDetails key={params.toString()} recipe={selected} onClose={closeDetails} onEdit={() => { setEditing(selected); }} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ModulePageHeader className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-700">Producción</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">Recetas</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Cómo se elabora cada producto: materias primas, máquinas y parámetros de cocción.</p>
        </div>
      </ModulePageHeader>
      <div className="mt-5 flex justify-end"><button type="button" onClick={() => setEditing(null)} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">＋ Nueva Receta</button></div>

      <section className="mt-7 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Listado de recetas</h2>
            <p className="mt-1 text-sm text-gray-500">{filtered.length} {filtered.length === 1 ? "receta" : "recetas"} encontradas</p>
          </div>
          <input aria-label="Buscar recetas" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código o nombre..." className={`${filterClass} w-full placeholder:text-gray-400 sm:w-64`} />
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div aria-hidden="true" className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500">⌕</div>
            <h3 className="mt-4 font-semibold text-gray-900">No se encontraron recetas</h3>
            <p className="mt-1 text-sm text-gray-500">Prueba con otro término.</p>
            <button type="button" onClick={() => setSearch("")} className="mt-4 text-sm font-semibold text-amber-700 hover:text-amber-800">Limpiar búsqueda</button>
          </div>
        ) : (
          <>
            <SortableList
              rows={filtered}
              headerClassName="flex flex-wrap lg:grid lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr] items-center gap-2 lg:gap-5 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500"
              actionClassName="hidden lg:block text-center"
              newest="Código"
              columns={[
                [["Código", row => row.idReceta], "min-w-0 text-left", [["Nombre", row => row.nombre]]],
                [["Cocción", row => row.tiempoCoccion.split(':').reduce((seconds, part) => seconds * 60 + Number(part), 0)], "min-w-0 text-left lg:text-center"],
                [["Temperatura", row => row.temperatura], "min-w-0 text-left lg:text-center"],
                [["Materias primas", row => row.materiasPrimas.length], "min-w-0 text-left lg:text-center"],
                [["Máquinas", row => row.maquinas.length], "min-w-0 text-left lg:text-center"],
                ["Acciones"],
              ]}
            >
              {mapRows => <div className="divide-y divide-gray-100">
                <AnimatePresence mode="popLayout">
                {mapRows((r, index) => (
                  <motion.article key={r.idReceta} {...rowMotion(index)} className="grid min-w-0 grid-cols-2 items-center gap-x-4 gap-y-3 p-4 transition hover:bg-amber-50/30 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr] lg:gap-5 lg:px-5">
                    <div className="col-span-2 min-w-0 text-left lg:col-span-1">
                      <p className="mb-1 text-xs font-medium text-gray-500">{codigo("REC", r.idReceta)}</p>
                      <h3 className="break-words font-semibold leading-5 text-gray-900">{r.nombre}</h3>
                    </div>
                    <div className="min-w-0 text-left lg:text-center">
                      <p className="text-xs font-medium text-gray-500 lg:hidden">Cocción</p>
                      <p className="mt-1 text-sm text-gray-900 lg:mt-0">{formatTiempo(r.tiempoCoccion)}</p>
                    </div>
                    <div className="min-w-0 text-left lg:text-center">
                      <p className="text-xs font-medium text-gray-500 lg:hidden">Temperatura</p>
                      <p className="mt-1 text-sm text-gray-900 lg:mt-0">{r.temperatura} °C</p>
                    </div>
                    <div className="min-w-0 text-left lg:text-center">
                      <p className="text-xs font-medium text-gray-500 lg:hidden">Materias primas</p>
                      <p className="mt-1 text-sm text-gray-900 lg:mt-0">{r.materiasPrimas.length}</p>
                    </div>
                    <div className="min-w-0 text-left lg:text-center">
                      <p className="text-xs font-medium text-gray-500 lg:hidden">Máquinas</p>
                      <p className="mt-1 text-sm text-gray-900 lg:mt-0">{r.maquinas.length}</p>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2 border-t border-gray-100 pt-2 lg:col-span-1 lg:justify-center lg:border-0 lg:pt-0">
                      <button type="button" onClick={() => setSelected(r)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-600">Ver detalle</button>
                      <button type="button" onClick={() => setEditing(r)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">Editar</button>
                    </div>
                  </motion.article>
                ))}
                </AnimatePresence>
              </div>}
            </SortableList>
          </>
        )}
      </section>
    </div>
  );
}
