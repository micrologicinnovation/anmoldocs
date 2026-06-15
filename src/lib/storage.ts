import { supabase } from "@/integrations/supabase/client";

export const ACCEPTED_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
export const ACCEPT_ATTR = ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";

export function isAcceptedFile(file: File) {
  if (ACCEPTED_MIME.includes(file.type)) return true;
  const name = file.name.toLowerCase();
  return /\.(pdf|jpg|jpeg|png|webp)$/.test(name);
}

export async function uploadDocumentFile(file: File, folder: string) {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
  const path = `${folder}/${crypto.randomUUID()}${ext ? "." + ext : ""}`;
  const { error } = await supabase.storage.from("documents").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function getSignedUrl(path: string, opts?: { download?: string }) {
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(path, 3600, opts?.download ? { download: opts.download } : undefined);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteStorageFile(path: string) {
  await supabase.storage.from("documents").remove([path]);
}

export function formatDate(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}