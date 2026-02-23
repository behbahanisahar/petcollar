import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getCollar,
  setupCollar,
  updateCollar,
  verifyPin,
  type CollarView,
  type PetData,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
function normalizePin(v: string): string {
  let s = v;
  for (let i = 0; i <= 9; i++) {
    s = s.replace(new RegExp(PERSIAN_DIGITS[i], "g"), String(i));
    s = s.replace(new RegExp(ARABIC_DIGITS[i], "g"), String(i));
  }
  return s.replace(/\D/g, "");
}

const emptyPetData: PetData = {
  name: "",
  species: "",
  breed: "",
  age: "",
  color: "",
  notes: "",
  medical_notes: "",
  owner_name: "",
};

export default function Collar() {
  const { id } = useParams<{ id: string }>();
  const [collar, setCollar] = useState<CollarView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [pin, setPin] = useState("");
  const [pinVerified, setPinVerified] = useState(false);

  useEffect(() => {
    if (!id) return;
    getCollar(id)
      .then(setCollar)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleVerifyPin = async () => {
    if (!id || !pin) return;
    const { valid } = await verifyPin(id, pin);
    setPinVerified(valid);
    if (valid) setIsOwner(true);
  };

  if (loading) {
    return (
      <div className="modern-bg min-h-screen flex items-center justify-center">
        <p className="text-slate-600">در حال بارگذاری...</p>
      </div>
    );
  }

  if (error || !collar) {
    return (
      <div className="modern-bg min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <Card className="w-full max-w-md rounded-2xl glass-card border-0 shadow-xl">
          <CardHeader>
            <CardTitle>قلاده یافت نشد</CardTitle>
            <CardDescription>{error || "این QR کد معتبر نیست."}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!collar.is_claimed) {
    return (
      <SetupForm
        uniqueId={id!}
        onSuccess={() => getCollar(id!).then(setCollar)}
      />
    );
  }

  return (
    <ViewCollar
      collar={collar}
      isOwner={isOwner}
      pin={pin}
      pinVerified={pinVerified}
      onPinChange={setPin}
      onVerifyPin={handleVerifyPin}
      onUpdate={() => id && getCollar(id).then(setCollar)}
    />
  );
}

function SetupForm({
  uniqueId,
  onSuccess,
}: {
  uniqueId: string;
  onSuccess: () => void;
}) {
  const [pet, setPet] = useState<PetData>(emptyPetData);
  const [pin, setPin] = useState("");
  const [ownerContact, setOwnerContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await setupCollar(uniqueId, {
        pet_data: pet,
        pin,
        owner_contact: ownerContact || undefined,
      });
      onSuccess();
    } catch (e) {
      const msg = (e as Error).message;
      const isNetwork = /load failed|failed to fetch|network/i.test(msg);
      setErr(isNetwork ? "ارتباط با سرور برقرار نشد. بک‌اند را بررسی کنید و مطمئن شوید از همان شبکه هستید." : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modern-bg min-h-screen flex flex-col items-center p-6">
      <Card className="w-full max-w-lg rounded-2xl glass-card border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-900">راه‌اندازی قلاده</CardTitle>
          <CardDescription>
            اطلاعات حیوان خانگی خود را وارد کنید. پس از ثبت، فقط شما می‌توانید آن را ویرایش کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="name">نام حیوان *</Label>
              <Input
                id="name"
                value={pet.name}
                onChange={(e) => setPet({ ...pet, name: e.target.value })}
                required
                placeholder="مثلاً رکس"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="species">نوع حیوان *</Label>
              <Input
                id="species"
                value={pet.species}
                onChange={(e) => setPet({ ...pet, species: e.target.value })}
                required
                placeholder="سگ، گربه، ..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="breed">نژاد</Label>
                <Input
                  id="breed"
                  value={pet.breed || ""}
                  onChange={(e) => setPet({ ...pet, breed: e.target.value })}
                  placeholder="ژرمن شپرد"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="age">سن</Label>
                <Input
                  id="age"
                  value={pet.age || ""}
                  onChange={(e) => setPet({ ...pet, age: e.target.value })}
                  placeholder="۲ سال"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="color">رنگ</Label>
              <Input
                id="color"
                value={pet.color || ""}
                onChange={(e) => setPet({ ...pet, color: e.target.value })}
                placeholder="قهوه‌ای"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="owner_name">نام صاحب</Label>
              <Input
                id="owner_name"
                value={pet.owner_name || ""}
                onChange={(e) => setPet({ ...pet, owner_name: e.target.value })}
                placeholder="نام شما"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="owner_contact">شماره تماس یا ایمیل (برای یابنده)</Label>
              <Input
                id="owner_contact"
                value={ownerContact}
                onChange={(e) => setOwnerContact(e.target.value)}
                placeholder="۰۹۱۲۱۲۳۴۵۶۷"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="medical_notes">نکات پزشکی مهم</Label>
              <Textarea
                id="medical_notes"
                value={pet.medical_notes || ""}
                onChange={(e) => setPet({ ...pet, medical_notes: e.target.value })}
                placeholder="آلرژی، داروها، ..."
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">توضیحات</Label>
              <Textarea
                id="notes"
                value={pet.notes || ""}
                onChange={(e) => setPet({ ...pet, notes: e.target.value })}
                placeholder="سایر توضیحات"
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pin">رمز ۴ تا ۸ رقمی برای ویرایش *</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={(e) => setPin(normalizePin(e.target.value))}
                minLength={4}
                maxLength={8}
                required
                placeholder="۴ تا ۸ رقم"
              />
            </div>
            {err && (
              <p className="text-sm text-destructive">{err}</p>
            )}
            <Button type="submit" className="w-full rounded-xl bg-teal-600 hover:bg-teal-700" disabled={loading}>
              {loading ? "در حال ثبت..." : "ثبت و قفل کردن"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ViewCollar({
  collar,
  isOwner,
  pin,
  pinVerified,
  onPinChange,
  onVerifyPin,
  onUpdate,
}: {
  collar: CollarView;
  isOwner: boolean;
  pin: string;
  pinVerified: boolean;
  onPinChange: (v: string) => void;
  onVerifyPin: () => void;
  onUpdate: () => void;
}) {
  const pet = collar.pet_data;

  return (
    <div className="modern-bg min-h-screen flex flex-col items-center p-6">
      <Card className="w-full max-w-lg rounded-2xl glass-card border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <span>🐕</span>
                {pet?.name || "حیوان خانگی"}
              </CardTitle>
              <CardDescription>
                این حیوان گم شده؟ با صاحب تماس بگیرید.
              </CardDescription>
            </div>
            {collar.is_claimed && !isOwner && (
              <OwnerLoginDialog
                pin={pin}
                onPinChange={onPinChange}
                onVerifyPin={onVerifyPin}
                pinVerified={pinVerified}
              />
            )}
            {isOwner && (
              <EditCollarDialog
                uniqueId={collar.unique_id}
                initialPet={pet || emptyPetData}
                onSuccess={onUpdate}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow label="نوع" value={pet?.species} />
          <InfoRow label="نژاد" value={pet?.breed} />
          <InfoRow label="سن" value={pet?.age} />
          <InfoRow label="رنگ" value={pet?.color} />
          <InfoRow label="صاحب" value={pet?.owner_name} />
          {collar.owner_contact && (
            <div className="rounded-xl bg-teal-50 border border-teal-100 p-4">
              <p className="text-sm text-slate-500 mb-1">تماس با صاحب</p>
              <a
                href={collar.owner_contact.startsWith("09") ? `tel:${collar.owner_contact}` : `mailto:${collar.owner_contact}`}
                className="text-lg font-medium text-teal-600 hover:underline"
              >
                {collar.owner_contact}
              </a>
            </div>
          )}
          {pet?.medical_notes && (
            <InfoRow label="نکات پزشکی" value={pet.medical_notes} />
          )}
          {pet?.notes && (
            <InfoRow label="توضیحات" value={pet.notes} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OwnerLoginDialog({
  pin,
  onPinChange,
  onVerifyPin,
  pinVerified,
}: {
  pin: string;
  onPinChange: (v: string) => void;
  onVerifyPin: () => void;
  pinVerified: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">ورود صاحب</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ورود با رمز</DialogTitle>
          <DialogDescription>
            رمز خود را وارد کنید تا بتوانید اطلاعات را ویرایش کنید.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            type="password"
            inputMode="numeric"
            placeholder="رمز"
            value={pin}
            onChange={(e) => onPinChange(normalizePin(e.target.value))}
          />
          <Button onClick={onVerifyPin}>ورود</Button>
        </div>
        {pinVerified === false && pin && (
          <p className="text-sm text-destructive">رمز اشتباه است</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function EditCollarDialog({
  uniqueId,
  initialPet,
  onSuccess,
}: {
  uniqueId: string;
  initialPet: PetData;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pet, setPet] = useState<PetData>(initialPet);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await updateCollar(uniqueId, { pet_data: pet, pin });
      setOpen(false);
      onSuccess();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">ویرایش</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ویرایش اطلاعات</DialogTitle>
          <DialogDescription>اطلاعات حیوان خانگی خود را به‌روز کنید.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label>نام حیوان</Label>
            <Input
              value={pet.name}
              onChange={(e) => setPet({ ...pet, name: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>نوع حیوان</Label>
            <Input
              value={pet.species}
              onChange={(e) => setPet({ ...pet, species: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>نژاد</Label>
              <Input
                value={pet.breed || ""}
                onChange={(e) => setPet({ ...pet, breed: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>سن</Label>
              <Input
                value={pet.age || ""}
                onChange={(e) => setPet({ ...pet, age: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>رمز</Label>
            <Input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(normalizePin(e.target.value))}
              required
              minLength={4}
              maxLength={8}
            />
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
