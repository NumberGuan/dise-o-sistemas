import voucherStyles from "../components/print-voucher.css?raw";

export function voucherFileName(title: string, number: string) {
  const name = `${title}-${number}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${name || "comprobante"}.pdf`;
}

export async function generateVoucherPdf(source: HTMLElement, title: string, number: string): Promise<File> {
  const { default: html2pdf } = await import("html2pdf.js");
  const copy = source.cloneNode(true) as HTMLElement;
  copy.removeAttribute("id");
  copy.removeAttribute("data-print-voucher");
  copy.classList.remove("voucher-selected");
  copy.classList.add("voucher-export");
  const options = {
    margin: 15,
    filename: voucherFileName(title, number),
    image: { type: "jpeg" as const, quality: 0.98 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
    pagebreak: { mode: ["css", "legacy"], avoid: ["tr", ".voucher-header", ".voucher-recipient", ".voucher-totals", ".voucher-signatures"] },
    html2canvas: {
      scale: 2,
      backgroundColor: "#ffffff",
      // Isolate the printed document from application themes and unsupported
      // CSS color functions (Tailwind uses oklch). The live page is untouched.
      onclone: (clonedDocument: Document) => {
        clonedDocument.querySelectorAll("style, link[rel='stylesheet']").forEach(node => node.remove());
        const style = clonedDocument.createElement("style");
        style.textContent = `* { box-sizing: border-box; } body { margin: 0; } h1, h2, p, dl { margin: 0; } ${voucherStyles}`;
        clonedDocument.head.append(style);
      },
    },
  };
  const blob: Blob = await html2pdf().set(options).from(copy).outputPdf("blob");
  return new File([blob], voucherFileName(title, number), { type: "application/pdf" });
}
