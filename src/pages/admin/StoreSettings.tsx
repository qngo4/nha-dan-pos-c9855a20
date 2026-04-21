import { useEffect, useRef, useState } from "react";
import { storeSettings } from "@/services";
import type { StorePaymentSettings, VietQrTemplate } from "@/services/types";
import { toast } from "sonner";
import { Building2, Save, QrCode, Upload, X, Wallet } from "lucide-react";
import { resizeImageFile, approxDataUrlBytes } from "@/lib/image-resize";

const VIETQR_BANKS: { code: string; name: string }[] = [
  { code: "VCB", name: "Vietcombank" },
  { code: "TCB", name: "Techcombank" },
  { code: "ACB", name: "ACB" },
  { code: "MB", name: "MB Bank" },
  { code: "BIDV", name: "BIDV" },
  { code: "VPB", name: "VPBank" },
  { code: "TPB", name: "TPBank" },
  { code: "STB", name: "Sacombank" },
  { code: "SHB", name: "SHB" },
  { code: "VIB", name: "VIB" },
  { code: "AGRIBANK", name: "Agribank" },
  { code: "OCB", name: "OCB" },
];

const TEMPLATES: { value: VietQrTemplate; label: string }[] = [
  { value: "compact2", label: "Compact 2 (khuyến nghị)" },
  { value: "compact", label: "Compact" },
  { value: "qr_only", label: "Chỉ QR" },
  { value: "print", label: "Bản in" },
];

const EMPTY: StorePaymentSettings = {
  shopName: "",
  qrEnabled: false,
  vietQrBankCode: "",
  bankName: "",
  accountNumber: "",
  accountName: "",
  branch: "",
  transferPrefix: "DH",
  qrTemplate: "compact2",
  momoQrImage: "",
  momoAccountName: "",
  momoPhone: "",
  zalopayQrImage: "",
  zalopayAccountName: "",
  zalopayPhone: "",
};

const MAX_QR_BYTES = 800 * 1024; // ~800KB safety cap for localStorage

export default function StoreSettingsPage() {
  const [form, setForm] = useState<StorePaymentSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    storeSettings.getPaymentSettings().then((s) => {
      if (s) setForm(s);
      setLoading(false);
    });
  }, []);

  const update = <K extends keyof StorePaymentSettings>(k: K, v: StorePaymentSettings[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleBankSelect = (code: string) => {
    const bank = VIETQR_BANKS.find((b) => b.code === code);
    setForm((f) => ({ ...f, vietQrBankCode: code, bankName: bank?.name ?? f.bankName }));
  };

  const onSave = async () => {
    if (form.qrEnabled) {
      if (!form.vietQrBankCode) return toast.error("Vui lòng chọn ngân hàng");
      if (!form.accountNumber.trim()) return toast.error("Vui lòng nhập số tài khoản");
      if (!form.accountName.trim()) return toast.error("Vui lòng nhập chủ tài khoản");
    }
    setSaving(true);
    try {
      await storeSettings.savePaymentSettings(form);
      toast.success("Đã lưu cài đặt cửa hàng");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Đang tải...</div>;
  }

  const qrPreview =
    form.qrEnabled && form.vietQrBankCode && form.accountNumber
      ? `https://img.vietqr.io/image/${form.vietQrBankCode}-${form.accountNumber}-${form.qrTemplate ?? "compact2"}.png?amount=100000&addInfo=DEMO&accountName=${encodeURIComponent(form.accountName)}`
      : null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" /> Cài đặt cửa hàng
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Thông tin thanh toán dùng cho VietQR ở mọi nơi (đơn chờ thanh toán, hóa đơn...).
        </p>
      </div>

      <div className="bg-card border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-sm">Thông tin chung</h2>
        <Field label="Tên cửa hàng">
          <input
            value={form.shopName}
            onChange={(e) => update("shopName", e.target.value)}
            className="input-base"
          />
        </Field>
      </div>

      <div className="bg-card border rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <QrCode className="h-4 w-4 text-primary" /> Thanh toán VietQR
          </h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.qrEnabled}
              onChange={(e) => update("qrEnabled", e.target.checked)}
            />
            Bật mã QR
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Ngân hàng">
            <select
              value={form.vietQrBankCode}
              onChange={(e) => handleBankSelect(e.target.value)}
              className="input-base"
              disabled={!form.qrEnabled}
            >
              <option value="">-- Chọn ngân hàng --</option>
              {VIETQR_BANKS.map((b) => (
                <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
              ))}
            </select>
          </Field>
          <Field label="Tên ngân hàng hiển thị">
            <input
              value={form.bankName}
              onChange={(e) => update("bankName", e.target.value)}
              className="input-base"
              disabled={!form.qrEnabled}
            />
          </Field>
          <Field label="Số tài khoản">
            <input
              value={form.accountNumber}
              onChange={(e) => update("accountNumber", e.target.value.replace(/\s/g, ""))}
              className="input-base"
              disabled={!form.qrEnabled}
            />
          </Field>
          <Field label="Chủ tài khoản (in hoa, không dấu khuyến nghị)">
            <input
              value={form.accountName}
              onChange={(e) => update("accountName", e.target.value)}
              className="input-base"
              disabled={!form.qrEnabled}
            />
          </Field>
          <Field label="Chi nhánh (tuỳ chọn)">
            <input
              value={form.branch ?? ""}
              onChange={(e) => update("branch", e.target.value)}
              className="input-base"
              disabled={!form.qrEnabled}
            />
          </Field>
          <Field label="Tiền tố nội dung CK (vd: DH)">
            <input
              value={form.transferPrefix ?? ""}
              onChange={(e) => update("transferPrefix", e.target.value)}
              className="input-base"
              disabled={!form.qrEnabled}
            />
          </Field>
          <Field label="Mẫu QR">
            <select
              value={form.qrTemplate ?? "compact2"}
              onChange={(e) => update("qrTemplate", e.target.value as VietQrTemplate)}
              className="input-base"
              disabled={!form.qrEnabled}
            >
              {TEMPLATES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
        </div>

        {qrPreview && (
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground mb-2">Xem trước (số tiền 100.000 đ, nội dung "DEMO"):</p>
            <img src={qrPreview} alt="VietQR preview" className="h-48 w-48 object-contain border rounded" />
          </div>
        )}
      </div>

      <EWalletQrSection
        title="Ví MoMo"
        color="text-[#A50064]"
        imageValue={form.momoQrImage ?? ""}
        accountName={form.momoAccountName ?? ""}
        phone={form.momoPhone ?? ""}
        onImage={(v) => update("momoQrImage", v)}
        onAccountName={(v) => update("momoAccountName", v)}
        onPhone={(v) => update("momoPhone", v)}
      />
      <EWalletQrSection
        title="ZaloPay"
        color="text-[#0068FF]"
        imageValue={form.zalopayQrImage ?? ""}
        accountName={form.zalopayAccountName ?? ""}
        phone={form.zalopayPhone ?? ""}
        onImage={(v) => update("zalopayQrImage", v)}
        onAccountName={(v) => update("zalopayAccountName", v)}
        onPhone={(v) => update("zalopayPhone", v)}
      />

      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {saving ? "Đang lưu..." : "Lưu cài đặt"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function EWalletQrSection(props: {
  title: string;
  color: string;
  imageValue: string;
  accountName: string;
  phone: string;
  onImage: (v: string) => void;
  onAccountName: (v: string) => void;
  onPhone: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Vui lòng chọn file ảnh");
    if (f.size > MAX_QR_BYTES) return toast.error("Ảnh quá lớn (tối đa ~800KB). Vui lòng nén trước khi tải lên.");
    const reader = new FileReader();
    reader.onload = () => props.onImage(String(reader.result ?? ""));
    reader.onerror = () => toast.error("Không đọc được file ảnh");
    reader.readAsDataURL(f);
  };

  return (
    <div className="bg-card border rounded-lg p-5 space-y-4">
      <h2 className={`font-semibold text-sm flex items-center gap-2 ${props.color}`}>
        <Wallet className="h-4 w-4" /> QR {props.title}
      </h2>
      <p className="text-xs text-muted-foreground">
        Tải ảnh mã QR tĩnh của ví {props.title}. Khi khách chọn phương thức này, trang thanh toán sẽ hiển thị ảnh QR bạn đã tải lên thay cho VietQR ngân hàng.
      </p>

      <div className="grid sm:grid-cols-[200px_1fr] gap-4 items-start">
        <div className="flex flex-col items-center gap-2">
          {props.imageValue ? (
            <div className="relative">
              <img src={props.imageValue} alt={`QR ${props.title}`} className="h-48 w-48 object-contain border rounded bg-white p-2" />
              <button
                type="button"
                onClick={() => props.onImage("")}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-danger text-danger-foreground flex items-center justify-center shadow"
                aria-label="Xoá ảnh QR"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="h-48 w-48 border-2 border-dashed rounded flex items-center justify-center text-xs text-muted-foreground text-center px-3">
              Chưa có ảnh QR
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border hover:bg-muted"
          >
            <Upload className="h-3.5 w-3.5" /> {props.imageValue ? "Thay ảnh" : "Tải ảnh QR"}
          </button>
        </div>

        <div className="space-y-3">
          <Field label={`Chủ tài khoản ${props.title}`}>
            <input
              value={props.accountName}
              onChange={(e) => props.onAccountName(e.target.value)}
              className="input-base"
              placeholder="VD: NGUYEN VAN A"
            />
          </Field>
          <Field label={`Số điện thoại ${props.title} (tuỳ chọn)`}>
            <input
              value={props.phone}
              onChange={(e) => props.onPhone(e.target.value.replace(/\s/g, ""))}
              className="input-base"
              placeholder="VD: 0901234567"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
