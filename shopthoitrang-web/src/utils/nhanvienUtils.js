// src/utils/nhanvienUtils.js
export function formatDate(v) {
  if (!v) return "N/A";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleDateString("vi-VN");
  } catch {
    return String(v);
  }
}
