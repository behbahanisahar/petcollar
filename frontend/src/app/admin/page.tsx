"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  listCollars,
  generateCollars,
  deleteAllCollars,
  type CollarAdminRow,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZES = [10, 20, 50, 100];
const DEFAULT_BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:5040";

export default function AdminPage() {
  const [collars, setCollars] = useState<CollarAdminRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalClaimed, setTotalClaimed] = useState<number | null>(null);
  const [totalUnclaimed, setTotalUnclaimed] = useState<number | null>(null);
  const [status, setStatus] = useState<"all" | "claimed" | "unclaimed">("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [generateCount, setGenerateCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newIds, setNewIds] = useState<string[] | null>(null);
  const [qrBaseUrl, setQrBaseUrl] = useState(DEFAULT_BASE_URL);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listCollars(status, search, pageSize, page * pageSize);
      setCollars(res.collars);
      setTotal(res.total);
      setTotalClaimed(res.total_claimed ?? null);
      setTotalUnclaimed(res.total_unclaimed ?? null);
    } catch {
      setCollars([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [status, search, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = () => setSearch(searchInput.trim());

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleGenerate = async () => {
    if (generateCount < 1 || generateCount > 500) return;
    setGenerating(true);
    setNewIds(null);
    try {
      const res = await generateCollars(generateCount);
      setNewIds(res.ids);
      setPage(0);
      load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      await deleteAllCollars();
      setNewIds(null);
      setPage(0);
      setDeleteDialogOpen(false);
      load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const downloadZip = async () => {
    if (!newIds || newIds.length === 0) return;
    const zip = new JSZip();
    for (const id of newIds) {
      const canvas = document.getElementById(`qr-${id}`) as HTMLCanvasElement;
      if (canvas) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/png")
        );
        if (blob) zip.file(`${id}.png`, blob);
      }
    }
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `pet-collar-qr-${newIds.length}.zip`);
  };

  const claimed = status === "claimed" ? total : totalClaimed ?? null;
  const unclaimed = status === "unclaimed" ? total : totalUnclaimed ?? null;

  return (
    <div className="admin-bg min-h-screen p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            پنل مدیریت
          </h1>
          <p className="text-slate-600 mt-1 text-sm md:text-base">
            تولید و مدیریت QR قلاده‌ها
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
                حذف همه
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>حذف همهٔ قلاده‌ها</DialogTitle>
                <DialogDescription>
                  همهٔ رکوردها از دیتابیس حذف می‌شوند. این عمل قابل بازگشت نیست.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  انصراف
                </Button>
                <Button variant="destructive" onClick={handleDeleteAll} disabled={deleting}>
                  {deleting ? "در حال حذف..." : "حذف همه"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Link href="/">
            <Button variant="outline" className="rounded-xl">
              بازگشت
            </Button>
          </Link>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm font-medium text-slate-500">کل قلاده‌ها</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{total}</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm font-medium text-slate-500">ثبت‌شده</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{claimed ?? "—"}</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm font-medium text-slate-500">آزاد</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{unclaimed ?? "—"}</p>
        </div>
      </div>

      {/* Generate */}
      <div className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">تولید QR جدید</h2>
          <p className="text-sm text-slate-600 mt-0.5">
            شناسه‌ها در دیتابیس ذخیره می‌شوند
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label className="text-slate-700">تعداد</Label>
            <Input
              type="number"
              min={1}
              max={500}
              value={generateCount}
              onChange={(e) =>
                setGenerateCount(Math.min(500, Math.max(1, +e.target.value || 1)))
              }
              className="rounded-xl border-slate-200"
            />
          </div>
          <div className="space-y-2 flex-1 min-w-[200px]">
            <Label className="text-slate-700">آدرس پایه QR</Label>
            <Input
              value={qrBaseUrl}
              onChange={(e) => setQrBaseUrl(e.target.value)}
              placeholder="https://example.com"
              className="rounded-xl border-slate-200"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-xl px-6 bg-teal-600 hover:bg-teal-700"
          >
            {generating ? "در حال تولید..." : "تولید"}
          </Button>
        </div>

        {newIds && newIds.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white/60 p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" onClick={downloadZip} className="rounded-lg bg-teal-600 hover:bg-teal-700">
                دانلود ZIP
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => {
                  navigator.clipboard.writeText(newIds.join("\n"));
                  alert("کپی شد");
                }}
              >
                کپی شناسه‌ها
              </Button>
              <span className="text-sm text-slate-500">{newIds.length} قلاده</span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3 max-h-64 overflow-y-auto">
              {newIds.map((id) => (
                <div
                  key={id}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow transition-shadow"
                >
                  <QRCodeCanvas
                    id={`qr-${id}`}
                    value={`${(qrBaseUrl || DEFAULT_BASE_URL).replace(/\/$/, "")}/p/${id}`}
                    size={64}
                    level="M"
                  />
                  <span className="text-[10px] font-mono text-slate-600 truncate w-full text-center">
                    {id}
                  </span>
                  <Link
                    href={`/p/${id}`}
                    target="_blank"
                    className="text-[10px] text-teal-600 hover:underline"
                  >
                    باز کردن
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-900">لیست قلاده‌ها</h2>
          <p className="text-sm text-slate-600 mt-0.5">جستجو، فیلتر و صفحه‌بندی</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="جستجو..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="rounded-xl border-slate-200"
              />
              <Button variant="secondary" onClick={handleSearch} className="rounded-xl shrink-0">
                جستجو
              </Button>
            </div>
            <div className="flex gap-2 shrink-0">
              {(["all", "claimed", "unclaimed"] as const).map((s) => (
                <Button
                  key={s}
                  variant={status === s ? "default" : "outline"}
                  size="sm"
                  className={status === s ? "rounded-xl bg-teal-600 hover:bg-teal-700" : "rounded-xl"}
                  onClick={() => {
                    setStatus(s);
                    setPage(0);
                  }}
                >
                  {s === "all" ? "همه" : s === "claimed" ? "ثبت‌شده" : "آزاد"}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500">در حال بارگذاری...</div>
          ) : collars.length === 0 ? (
            <div className="py-16 text-center text-slate-500">نتیجه‌ای یافت نشد</div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className="text-slate-600 font-medium">شناسه</TableHead>
                      <TableHead className="text-slate-600 font-medium">وضعیت</TableHead>
                      <TableHead className="text-slate-600 font-medium">نام حیوان</TableHead>
                      <TableHead className="text-slate-600 font-medium">تماس صاحب</TableHead>
                      <TableHead className="text-slate-600 font-medium">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collars.map((c) => (
                      <TableRow key={c.unique_id} className="border-slate-100">
                        <TableCell className="font-mono text-sm text-slate-800">
                          {c.unique_id}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              c.is_claimed
                                ? "bg-emerald-100 text-emerald-700 border-0"
                                : "bg-amber-100 text-amber-700 border-0"
                            }
                          >
                            {c.is_claimed ? "ثبت‌شده" : "آزاد"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-700">{c.pet_name || "—"}</TableCell>
                        <TableCell className="text-slate-700">{c.owner_contact || "—"}</TableCell>
                        <TableCell>
                          <Link href={`/p/${c.unique_id}`} target="_blank">
                            <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                              مشاهده
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">در هر صفحه:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(0);
                    }}
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                  >
                    {PAGE_SIZES.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">
                    {total} مورد · صفحه {page + 1} از {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      قبلی
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      بعدی
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
