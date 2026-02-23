import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="modern-bg min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
          قلاده هوشمند
        </h1>
        <p className="text-slate-600 text-lg">
          QR کد روی قلاده را اسکن کنید تا اطلاعات حیوان خانگی را ثبت یا مشاهده کنید.
        </p>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-500">
            اگر قلاده دارید، اسکن کنید یا برای تست یک شناسه وارد کنید:
          </p>
          <div className="flex gap-2">
            <Link href="/demo" className="flex-1">
              <Button variant="outline" className="w-full rounded-xl border-slate-200 hover:bg-white/80">
                صفحهٔ تست / دمو
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
