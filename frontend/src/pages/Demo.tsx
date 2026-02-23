import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Demo() {
  const navigate = useNavigate();
  const [id, setId] = useState("");

  const handleGo = () => {
    const trimmed = id.trim();
    if (trimmed) navigate(`/p/${trimmed}`);
  };

  return (
    <div className="modern-bg min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold text-center text-slate-900">تست قلاده</h2>
        <p className="text-slate-600 text-center text-sm">
          شناسهٔ قلاده را وارد کنید (مثلاً یک ID تولیدشده توسط اسکریپت)
        </p>
        <div className="space-y-2">
          <Label htmlFor="id">شناسه قلاده</Label>
          <Input
            id="id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="ABC12XYZ"
            onKeyDown={(e) => e.key === "Enter" && handleGo()}
          />
        </div>
        <Button onClick={handleGo} className="w-full rounded-xl bg-teal-600 hover:bg-teal-700" disabled={!id.trim()}>
          باز کردن
        </Button>
      </div>
    </div>
  );
}
