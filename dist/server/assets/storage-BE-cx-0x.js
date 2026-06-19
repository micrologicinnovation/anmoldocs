import { t as supabase } from "./client-CLJYXxXG.js";
//#region src/lib/storage.ts
var ACCEPTED_MIME = [
	"application/pdf",
	"image/jpeg",
	"image/png",
	"image/webp"
];
var ACCEPT_ATTR = ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";
function isAcceptedFile(file) {
	if (ACCEPTED_MIME.includes(file.type)) return true;
	const name = file.name.toLowerCase();
	return /\.(pdf|jpg|jpeg|png|webp)$/.test(name);
}
async function uploadDocumentFile(file, folder) {
	const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
	const path = `${folder}/${crypto.randomUUID()}${ext ? "." + ext : ""}`;
	const { error } = await supabase.storage.from("documents").upload(path, file, {
		contentType: file.type,
		upsert: false
	});
	if (error) throw error;
	return path;
}
async function getSignedUrl(path, opts) {
	const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 3600, opts?.download ? { download: opts.download } : void 0);
	if (error) throw error;
	return data.signedUrl;
}
async function deleteStorageFile(path) {
	await supabase.storage.from("documents").remove([path]);
}
function formatDate(d) {
	return (typeof d === "string" ? new Date(d) : d).toLocaleDateString(void 0, {
		year: "numeric",
		month: "short",
		day: "numeric"
	});
}
//#endregion
export { isAcceptedFile as a, getSignedUrl as i, deleteStorageFile as n, uploadDocumentFile as o, formatDate as r, ACCEPT_ATTR as t };
