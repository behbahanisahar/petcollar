function getApiBase(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  // In dev with Vite proxy, or production without env: use same origin
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:8000";
}

export interface PetData {
  name: string;
  species: string;
  breed?: string;
  age?: string;
  color?: string;
  notes?: string;
  medical_notes?: string;
  owner_name?: string;
}

export interface CollarView {
  unique_id: string;
  is_claimed: boolean;
  pet_data: PetData | null;
  owner_contact: string | null;
}

export async function getCollar(uniqueId: string): Promise<CollarView> {
  const res = await fetch(`${getApiBase()}/api/collars/${uniqueId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "قلاده یافت نشد");
  }
  return res.json();
}

function extractError(json: unknown, fallback: string): string {
  if (!json || typeof json !== "object") return fallback;
  const d = (json as { detail?: unknown }).detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d) && d[0]?.msg) return (d as { msg: string }[]).map((x) => x.msg).join("؛ ");
  return fallback;
}

export async function setupCollar(
  uniqueId: string,
  data: { pet_data: PetData; pin: string; owner_contact?: string }
) {
  const res = await fetch(`${getApiBase()}/api/collars/${uniqueId}/setup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      res.status >= 500
        ? "سرور در دسترس نیست. بک‌اند را اجرا کنید (npm run dev)"
        : extractError(json, "خطا در ثبت");
    throw new Error(msg);
  }
  return json;
}

export async function updateCollar(
  uniqueId: string,
  data: { pet_data: PetData; pin: string }
) {
  const res = await fetch(`${getApiBase()}/api/collars/${uniqueId}/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.detail || "خطا در به‌روزرسانی");
  return json;
}

export async function verifyPin(
  uniqueId: string,
  pin: string
): Promise<{ valid: boolean }> {
  const res = await fetch(
    `${getApiBase()}/api/collars/${uniqueId}/verify-pin`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    }
  );
  return res.json();
}

// Admin API
export interface CollarAdminRow {
  unique_id: string;
  is_claimed: boolean;
  pet_name: string | null;
  owner_contact: string | null;
  created_at: string;
}

export async function listCollars(
  status: "all" | "claimed" | "unclaimed" = "all",
  search = "",
  limit = 20,
  offset = 0
): Promise<{
  collars: CollarAdminRow[];
  total: number;
  total_claimed?: number;
  total_unclaimed?: number;
}> {
  const params = new URLSearchParams({
    status,
    search: search.trim(),
    limit: String(limit),
    offset: String(offset),
  });
  const res = await fetch(`${getApiBase()}/api/admin/collars?${params}`);
  if (!res.ok) throw new Error("خطا در دریافت لیست");
  return res.json();
}

export async function deleteAllCollars(): Promise<void> {
  const res = await fetch(`${getApiBase()}/api/admin/collars`, { method: "DELETE" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.detail || "خطا در حذف");
}

export async function generateCollars(count: number): Promise<{
  ids: string[];
  base_url: string;
  urls: string[];
}> {
  const res = await fetch(`${getApiBase()}/api/admin/collars/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.detail || "خطا در تولید");
  return json;
}
