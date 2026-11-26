export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
export const ATTACHMENT_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";
export type PurchaseAttachment = { name: string; size: number; type: string };
export type PurchaseAttachmentResult = {
  attachment: PurchaseAttachment | null;
  error?: string;
  message?: string;
};
