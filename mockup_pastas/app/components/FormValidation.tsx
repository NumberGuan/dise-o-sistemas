import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router";

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type FieldError = { field: HTMLElement; message: string };

function isControl(field: HTMLElement): field is Control {
  return field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement;
}

function errorMessage(field: HTMLElement): string {
  if (!field.isConnected) return "";
  if (!isControl(field)) return field.dataset.validationMessage ?? "";
  if (!field.willValidate || field.hasAttribute("data-validation-skip")) return "";
  const { validity } = field;
  if (validity.valueMissing || (field.required && !field.value.trim())) {
    return field instanceof HTMLSelectElement ? "Seleccioná una opción." : "Completá este campo.";
  }
  if (validity.typeMismatch) return field.type === "email" ? "Ingresá un correo electrónico válido." : "Ingresá un valor válido.";
  if (validity.badInput) return "Ingresá un número válido.";
  if (validity.rangeUnderflow) return `El valor mínimo es ${field.getAttribute("min")}.`;
  if (validity.rangeOverflow) return `El valor máximo es ${field.getAttribute("max")}.`;
  if (validity.stepMismatch) return "Revisá el valor y los decimales permitidos.";
  if (validity.patternMismatch) return field.title || "Revisá el formato de este campo.";
  if (!(field instanceof HTMLSelectElement) && field.value && field.minLength > 0 && field.value.length < field.minLength) return `Ingresá al menos ${field.minLength} caracteres.`;
  if (validity.tooLong) return "El texto supera la cantidad de caracteres permitida.";
  return validity.valid ? "" : "Revisá este campo.";
}

function Feedback({ field, message }: FieldError) {
  const id = useId();
  const container = isControl(field) ? field.closest("label") ?? field.parentElement : field;
  useEffect(() => {
    const previousInvalid = field.getAttribute("aria-invalid");
    const previousDescription = field.getAttribute("aria-describedby");
    field.setAttribute("aria-invalid", "true");
    field.setAttribute("aria-describedby", [previousDescription, id].filter(Boolean).join(" "));
    return () => {
      if (previousInvalid === null) field.removeAttribute("aria-invalid");
      else field.setAttribute("aria-invalid", previousInvalid);
      if (previousDescription === null) field.removeAttribute("aria-describedby");
      else field.setAttribute("aria-describedby", previousDescription);
    };
  }, [field, id]);
  return container ? createPortal(<span id={id} role="alert" className="form-field-error">{message}</span>, container) : null;
}

/** Shared feedback for native forms, router forms and buttons that save locally. */
export default function FormValidation({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [focusRequest, setFocusRequest] = useState<{ field: HTMLElement } | null>(null);
  const fieldKeys = useRef(new WeakMap<HTMLElement, number>());
  const nextKey = useRef(0);

  useEffect(() => { setErrors([]); setFocusRequest(null); }, [location.key]);
  useEffect(() => {
    if (!focusRequest) return;
    const frame = requestAnimationFrame(() => {
      const field = focusRequest.field;
      if (!field.isConnected) return;
      const target = isControl(field) ? field : field.querySelector<HTMLElement>("input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])");
      target?.focus({ preventScroll: true });
      (target ?? field).scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center", inline: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, [focusRequest]);

  function validate(form: HTMLFormElement, complete = false) {
    const next = Array.from(form.querySelectorAll<HTMLElement>("input, select, textarea, [data-validation-message]"))
      .filter(field => complete || !field.hasAttribute("data-validation-complete"))
      .map(field => ({ field, message: errorMessage(field) })).filter(error => error.message);
    setErrors(next);
    if (next[0]) setFocusRequest({ field: next[0].field });
    return next.length === 0;
  }

  function refresh() {
    if (!errors.length) return;
    // Wait for controlled fields and conditional rows to reflect the user's edit.
    requestAnimationFrame(() => setErrors(current => current.map(error => ({ ...error, message: errorMessage(error.field) })).filter(error => error.message)));
  }

  return <div className="contents"
    onInvalidCapture={event => {
      const field = event.target;
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
        event.preventDefault();
        if (field.form) validate(field.form);
      }
    }}
    onSubmitCapture={event => {
      if (event.target instanceof HTMLFormElement && !validate(event.target)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }}
    onClickCapture={event => {
      const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("button[data-validate-form]") : null;
      if (button?.form && !validate(button.form, button.hasAttribute("data-validate-complete"))) {
        event.preventDefault();
        event.stopPropagation();
      } else if (errors.length) refresh();
    }}
    onInputCapture={refresh} onChangeCapture={refresh} onResetCapture={() => setErrors([])}>
    {children}
    {errors.map(error => {
      if (!fieldKeys.current.has(error.field)) fieldKeys.current.set(error.field, nextKey.current++);
      return <Feedback key={fieldKeys.current.get(error.field)} {...error} />;
    })}
  </div>;
}
