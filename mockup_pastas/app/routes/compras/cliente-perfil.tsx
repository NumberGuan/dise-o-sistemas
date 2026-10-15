import { Form, useActionData, useLoaderData, useNavigation } from "react-router";

import { CLIENT_DOCUMENT_TYPES, CLIENT_IVA_TYPES, splitClientAddress } from "~/data/sales";
import { mutateUser } from "~/utils/db.server";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/cliente-perfil";
export { default as ErrorBoundary } from "~/components/CustomerErrorBoundary";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await requireUserAndRole(request, ["Cliente"]);
  return { profile: {
    name: user.name, email: user.email, phone: user.phone ?? "", address: user.address ?? "",
    type: user.customerData?.type ?? "Particular", documentType: user.customerData?.documentType ?? "DNI",
    cuitCuil: user.customerData?.cuitCuil ?? "", ivaType: user.customerData?.ivaType ?? "",
    floor: user.customerData?.floor ?? "", apartment: user.customerData?.apartment ?? "",
    locality: user.customerData?.locality ?? "", province: user.customerData?.province ?? "Buenos Aires",
    notes: user.customerData?.notes ?? "",
  } };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await requireUserAndRole(request, ["Cliente"]);
  const data = await request.formData();
  const fields = ["name", "phone", "address", "documentType", "cuitCuil", "ivaType", "floor", "apartment", "locality", "province", "notes"] as const;
  const values = Object.fromEntries(fields.map((field) => [field, data.get(field)]));
  if (fields.some((field) => typeof values[field] !== "string")) return { error: "Revisá los datos del formulario e intentá nuevamente." };
  const value = (field: typeof fields[number]) => (values[field] as string).trim();
  const name = value("name");
  if (name.length < 2 || name.length > 100) return { error: "El nombre o razón social debe tener entre 2 y 100 caracteres." };
  if (!value("address")) return { error: "Completá el domicilio para poder confirmar pedidos." };
  if (!value("locality")) return { error: "Completá la localidad para poder confirmar pedidos." };
  if (fields.some((field) => value(field).length > 180)) return { error: "Uno de los datos supera el máximo permitido." };
  const documentType = value("documentType");
  const ivaType = value("ivaType");
  if (!(CLIENT_DOCUMENT_TYPES as readonly string[]).includes(documentType) || !(CLIENT_IVA_TYPES as readonly string[]).includes(ivaType) && ivaType !== "") {
    return { error: "Seleccioná un tipo de documento y condición IVA válidos." };
  }
  try {
    await mutateUser(user.id, (current) => {
      current.name = name;
      current.phone = value("phone");
      current.address = value("address");
      current.customerData = { ...splitClientAddress(value("address")), balance: current.customerData?.balance, type: current.customerData?.type ?? "Particular", documentType: documentType as typeof CLIENT_DOCUMENT_TYPES[number], cuitCuil: value("cuitCuil"), ivaType: ivaType as typeof CLIENT_IVA_TYPES[number] | "", floor: value("floor"), apartment: value("apartment"), locality: value("locality"), province: value("province"), notes: value("notes") };
    });
    return { success: true };
  } catch {
    return { error: "No pudimos guardar tu perfil. Intentá nuevamente." };
  }
};

export default function ClientePerfil() {
  const { profile } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";
  const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-[#e5d9cb] bg-white px-3 text-sm text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-700";
  const labelClass = "block text-sm font-semibold text-gray-800";

  return <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
    <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">Tu cuenta</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Mi perfil</h1><p className="mt-2 text-sm text-gray-600">Estos datos se comparten con Ventas y se usan para asociar tus pedidos.</p></div>
    <section className="overflow-hidden rounded-2xl border border-[#eadfd3] bg-white shadow-sm"><Form key={JSON.stringify(profile)} method="post" className="space-y-6 p-5 sm:p-7" autoComplete="on">
      {actionData?.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionData.error}</p>}
      {actionData?.success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Los datos del cliente se guardaron correctamente.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={labelClass}><span>Categoría de cliente</span><p className={`${inputClass} flex items-center bg-gray-50 text-gray-700`} aria-readonly="true">{profile.type}</p><span className="mt-1 block text-xs font-normal text-gray-500">Solo un administrador puede cambiar esta categoría.</span></div>
        <label className={labelClass}>Nombre o razón social<input name="name" required minLength={2} maxLength={100} defaultValue={profile.name} className={inputClass} /></label>
        <label className={labelClass}>Tipo de documento<select name="documentType" defaultValue={profile.documentType} className={inputClass}>{CLIENT_DOCUMENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
        <label className={labelClass}>CUIT/CUIL<input name="cuitCuil" maxLength={30} defaultValue={profile.cuitCuil} className={inputClass} /></label>
        <label className={labelClass}>Tipo IVA<select name="ivaType" defaultValue={profile.ivaType} className={inputClass}><option value="">Seleccionar</option>{CLIENT_IVA_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
        <label className={labelClass}>Correo electrónico<input type="email" value={profile.email} readOnly aria-readonly="true" className={`${inputClass} bg-gray-50 text-gray-600`} /><span className="mt-1 block text-xs font-normal text-gray-500">El correo identifica tu cuenta y no se puede modificar desde el perfil.</span></label>
        <label className={labelClass}>Teléfono<input name="phone" type="tel" maxLength={40} defaultValue={profile.phone} className={inputClass} /></label>
        <label className={labelClass}>Domicilio<input name="address" required maxLength={180} defaultValue={profile.address} className={inputClass} placeholder="Calle y altura" /></label>
        <label className={labelClass}>Piso<input name="floor" maxLength={20} defaultValue={profile.floor} className={inputClass} /></label>
        <label className={labelClass}>Departamento<input name="apartment" maxLength={20} defaultValue={profile.apartment} className={inputClass} /></label>
        <label className={labelClass}>Localidad<input name="locality" required maxLength={100} defaultValue={profile.locality} className={inputClass} /></label>
        <label className={labelClass}>Provincia<input name="province" maxLength={100} defaultValue={profile.province} className={inputClass} /></label>
        <label className={`${labelClass} sm:col-span-2`}>Observaciones<textarea name="notes" rows={3} maxLength={180} defaultValue={profile.notes} className={inputClass} /></label>
      </div>
      <div className="flex justify-end border-t border-[#f0e7dd] pt-5"><button type="submit" disabled={isSaving} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-800 px-5 text-sm font-semibold text-white transition hover:bg-amber-900 disabled:cursor-wait disabled:opacity-70">{isSaving ? "Guardando…" : "Guardar datos"}</button></div>
    </Form></section>
  </div>;
}
