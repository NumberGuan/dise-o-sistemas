import { useState } from "react";

export default function AuthPasswordField({ newPassword = false, invalid = false }: { newPassword?: boolean; invalid?: boolean }) {
  const [visible, setVisible] = useState(false);
  return <div className="auth-password"><input id="password" name="password" type={visible ? "text" : "password"} autoComplete={newPassword ? "new-password" : "current-password"} required minLength={newPassword ? 6 : undefined} maxLength={128} aria-invalid={invalid || undefined} aria-describedby={invalid ? "auth-error" : undefined} placeholder="Ingresá tu contraseña" /><button type="button" aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={visible} onClick={() => setVisible(value => !value)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{visible && <path d="m3 3 18 18" />}</svg></button></div>;
}
