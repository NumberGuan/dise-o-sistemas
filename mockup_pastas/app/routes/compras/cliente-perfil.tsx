import { CatalogField } from "~/components/InlineCatalog";
import PhoneFields from "~/components/PhoneFields";
import ShopPageHero from "~/components/ShopPageHero";
import { validatePhones } from "~/data/phones";
import { getCatalogs } from "~/data/catalogs.server";
import { validCatalogValue, catalogAddressData } from "~/data/catalogs";
import { CatalogOptions, useCatalogs } from "~/components/CatalogProvider";
import ClientMonthlyAccount from "~/components/ClientMonthlyAccount";
import { getClientMonthlyAccount } from "~/data/billing";
import { useState } from "react";
import ClientAddressesEditor from "~/components/ClientAddressesEditor";
import { customerAsClient, mutateCustomer } from "~/data/customer.server";
import { getSalesData, preserveOrderAddresses } from "~/data/sales.server";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";

import { getClientAddresses, createFixedClientAddress, validateClientAddresses } from "~/data/sales";
import { requireUserAndRole } from "~/utils/session.server";
import type { Route } from "./+types/cliente-perfil";
export { default as ErrorBoundary } from "~/components/CustomerErrorBoundary";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await requireUserAndRole(request, ["Cliente"]);
  const sales = await getSalesData();
  const client = sales.clients.find(client => client.id === `customer-${user.id}`)!;
  return { account: getClientMonthlyAccount(client, sales.orders, sales.invoices, sales.receipts), profile: {
    name: user.name, email: user.email, phone: user.phone ?? "", additionalPhones: user.additionalPhones ?? [], address: user.address ?? "",
    type: user.customerData?.type ?? "Particular", documentType: user.customerData?.documentType ?? "DNI",
    cuitCuil: user.customerData?.cuitCuil ?? "", ivaType: user.customerData?.ivaType ?? "",
    floor: user.customerData?.floor ?? "", apartment: user.customerData?.apartment ?? "",
    locality: user.customerData?.locality ?? "", province: user.customerData?.province ?? "Buenos Aires",
    notes: user.customerData?.notes ?? "",
    addresses: getClientAddresses(customerAsClient(user)!),
  } };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await requireUserAndRole(request, ["Cliente"]);
  const data = await request.formData();
  const fields = ["name", "phone", "documentType", "cuitCuil", "ivaType", "notes"] as const;
  const values = Object.fromEntries(fields.map((field) => [field, data.get(field)]));
  if (fields.some((field) => typeof values[field] !== "string")) return { error: "Revisá los datos del formulario e intentá nuevamente." };
  const value = (field: typeof fields[number]) => (values[field] as string).trim();
  const name = value("name");
  if (name.length < 2 || name.length > 100) return { error: "El nombre o razón social debe tener entre 2 y 100 caracteres." };
  if (fields.some((field) => value(field).length > 180)) return { error: "Uno de los datos supera el máximo permitido." };
  const documentType = value("documentType");
  const ivaType = value("ivaType");
  const catalogs = await getCatalogs();
  if (!validCatalogValue(catalogs, "tipos-documento", documentType, user.customerData?.documentType ?? "DNI") || ivaType !== "" && !validCatalogValue(catalogs, "tipos-iva", ivaType, user.customerData?.ivaType)) {
    return { error: "Seleccioná un tipo de documento y condición IVA válidos." };
  }
  try {
    const phones = validatePhones(value("phone"), JSON.parse(String(data.get("additionalPhones") ?? JSON.stringify(user.additionalPhones ?? []))));
    const previousAddresses = getClientAddresses(customerAsClient(user)!);
    const savedAddresses = data.get("savedAddresses") ?? JSON.stringify(previousAddresses);
    const addressInput: unknown = JSON.parse(String(data.get("addresses") ?? "[]"));
    await mutateCustomer(user.id, (current) => {
      const currentAddresses = getClientAddresses(customerAsClient(current)!);
      if (savedAddresses !== JSON.stringify(currentAddresses)) {
        throw new Error("Las direcciones cambiaron desde otra pantalla. Revisá las direcciones actualizadas antes de guardar.");
      }
      const addresses = validateClientAddresses(addressInput, currentAddresses, catalogAddressData(catalogs));
      const primary = addresses[0];
      current.customerOrders = preserveOrderAddresses(current.customerOrders ?? [], customerAsClient(current)!);
      current.name = name;
      current.phone = phones.phone;
      current.additionalPhones = phones.additionalPhones;
      current.address = primary ? [primary.street, primary.streetNumber].join(" ") : "";
      current.customerData = { addresses, street: primary?.street ?? "", streetNumber: primary?.streetNumber ?? "", balance: current.customerData?.balance, type: current.customerData?.type ?? "Particular", documentType, cuitCuil: value("cuitCuil"), ivaType, floor: primary?.floor ?? "", apartment: primary?.apartment ?? "", locality: primary?.locality ?? "", province: primary?.province ?? "", notes: value("notes") };
    });
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No pudimos guardar tu perfil. Intentá nuevamente." };
  }
};

export default function ClientePerfil() {
  const { profile, account } = useLoaderData<typeof loader>();
  return <div className="shop-customer-page mx-auto max-w-3xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
    <div className="mb-6">
      <ShopPageHero title="Mi perfil" art="perfil" description="Estos datos se comparten con Ventas y se usan para asociar tus pedidos." />
    </div>
    {profile.type === "Comercio" && <ClientMonthlyAccount months={account} />}
    <CustomerProfileForm key={JSON.stringify(profile)} profile={profile} />
  </div>;
}

function CustomerProfileForm({ profile }: { profile: Awaited<ReturnType<typeof loader>>["profile"] }) {
  const [addresses, setAddresses] = useState(() => profile.addresses.length ? profile.addresses : [createFixedClientAddress()]);
  const [phone, setPhone] = useState(profile.phone);
  const [additionalPhones, setAdditionalPhones] = useState(profile.additionalPhones);
  const [documentType, setDocumentType] = useState(profile.documentType);
  const [ivaType, setIvaType] = useState(profile.ivaType);
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";
  const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-700";
  const labelClass = "block text-sm font-semibold text-gray-800";

  return <section className="shop-panel rounded-2xl border" aria-labelledby="profile-data-title"><Form noValidate method="post" className="space-y-6 p-5 sm:p-7" autoComplete="on">
      <h2 id="profile-data-title" className="shop-heading font-semibold">Datos del cliente</h2>
      {actionData?.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionData.error}</p>}
      {actionData?.success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Los datos del cliente se guardaron correctamente.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={labelClass}><span>Categoría de cliente</span><p className={`${inputClass} shop-readonly flex items-center`} aria-readonly="true">{profile.type}</p><span className="mt-1 block text-xs font-normal text-gray-500">Solo un administrador puede cambiar esta categoría.</span></div>
        <label className={labelClass}>Nombre o razón social<input name="name" required minLength={2} maxLength={100} defaultValue={profile.name} className={inputClass} /></label>
        <label className={labelClass}>Tipo de documento<CatalogField catalog="tipos-documento" onCreated={entry => setDocumentType(entry.value)} disabled={isSaving}><select name="documentType" value={documentType} onChange={event => setDocumentType(event.target.value)} className={inputClass}><CatalogOptions catalog="tipos-documento" retained={profile.documentType} /></select></CatalogField></label>
        <label className={labelClass}>CUIT/CUIL<input name="cuitCuil" maxLength={30} defaultValue={profile.cuitCuil} className={inputClass} /></label>
        <label className={labelClass}>Tipo IVA<CatalogField catalog="tipos-iva" onCreated={entry => setIvaType(entry.value)} disabled={isSaving}><select name="ivaType" value={ivaType} onChange={event => setIvaType(event.target.value)} className={inputClass}><option value="">Seleccionar</option><CatalogOptions catalog="tipos-iva" retained={profile.ivaType} /></select></CatalogField></label>
        <label className={labelClass}>Correo electrónico<input type="email" value={profile.email} readOnly aria-readonly="true" className={inputClass} /><span className="mt-1 block text-xs font-normal text-gray-500">El correo identifica tu cuenta y no se puede modificar desde el perfil.</span></label>
        <label className={`${labelClass} sm:col-span-2`}>Observaciones<textarea name="notes" rows={3} maxLength={180} defaultValue={profile.notes} className={inputClass} /></label>
      </div>
      <PhoneFields primary={phone} additional={additionalPhones} onChange={(primary, additional) => { setPhone(primary); setAdditionalPhones(additional); }} disabled={isSaving} />
      <input type="hidden" name="phone" value={phone} />
      <input type="hidden" name="additionalPhones" value={JSON.stringify(additionalPhones)} />
      <input type="hidden" name="savedAddresses" value={JSON.stringify(profile.addresses)} />
      <input type="hidden" name="addresses" value={JSON.stringify(addresses)} />
      <ClientAddressesEditor addresses={addresses} onChange={setAddresses} disabled={isSaving} />
      <div className="flex justify-end shop-rule border-t pt-5"><button type="submit" disabled={isSaving} className="inline-flex min-h-11 items-center justify-center shop-primary px-5 text-sm font-semibold text-white transition disabled:cursor-wait disabled:opacity-70">{isSaving ? "Guardando…" : "Guardar datos"}</button></div>
    </Form></section>;
}
