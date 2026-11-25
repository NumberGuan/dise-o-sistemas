import { useEffect, useState } from "react";
import { useNavigation } from "react-router";
import LoadingScreen from "./LoadingScreen";

const LOADING_DELAY_MS = 180;
const PURCHASE_VOUCHER_DETAIL = /^\/compras\/(?:presupuesto-proveedor|remito-proveedor|factura-proveedor|recibo-pago-proveedor)\/[^/]+\/?$/;

export default function NavigationLoading() {
  const navigation = useNavigation();
  const isLogin = navigation.formMethod === "POST" && navigation.formAction?.split("?")[0] === "/login";
  const pending = navigation.state !== "idle" && !isLogin;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!pending) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), LOADING_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pending]);

  if (isLogin) return <LoadingScreen message="Iniciando sesión…" fullScreen />;
  if (!pending || !visible) return null;

  const { pathname, search } = navigation.location;
  const params = new URLSearchParams(search);
  let message = "Cargando datos…";

  if (navigation.formMethod && navigation.formMethod !== "GET") {
    message = "Procesando solicitud…";
  } else if (
    PURCHASE_VOUCHER_DETAIL.test(pathname) ||
    (pathname === "/ventas/comprobantes" && params.has("comprobante")) ||
    (pathname === "/ventas/remitos" && params.has("remito"))
  ) {
    message = "Cargando comprobante…";
  }

  return <LoadingScreen message={message} fullScreen />;
}
