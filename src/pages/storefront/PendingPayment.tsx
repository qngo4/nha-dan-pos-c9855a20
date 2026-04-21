import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { formatVND, formatDateTime } from "@/lib/format";
import { Clock, CheckCircle, XCircle, AlertTriangle, ArrowLeft, Package, Copy, QrCode } from "lucide-react";
import { pendingOrders as pendingOrdersService, storeSettings, vietQr } from "@/services";
import { OrderTimeline } from "@/components/shared/OrderTimeline";
import type {
  PaymentMethod,
  PendingOrder,
  StorePaymentSettings,
  VietQrResult,
} from "@/services/types";
import { toast } from "sonner";

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản ngân hàng",
  momo: "Ví MoMo",
  zalopay: "ZaloPay",
};

export default function PendingPaymentPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [bank, setBank] = useState<StorePaymentSettings | null>(null);
  const [qr, setQr] = useState<VietQrResult | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  // Reload the order whenever:
  //  - the route id changes
  //  - another tab writes to localStorage (admin confirms in /admin/pending-orders)
  //  - the user returns to this tab (visibilitychange)
  //  - a 5s poll fires while the order is still pending
  useEffect(() => {
    if (!id) return;
    let alive = true;

    const fetchAll = async () => {
      const fromService = await pendingOrdersService.get(id);
      const settings = await storeSettings.getPaymentSettings();
      if (!alive) return;
      const prevStatus = order?.status;
      setOrder(fromService);
      setBank(settings);
      setLoading(false);

      if (fromService && prevStatus && prevStatus !== fromService.status) {
        if (fromService.status === "confirmed") {
          toast.success("Thanh toán đã được xác nhận!");
        } else if (fromService.status === "cancelled") {
          toast.error("Đơn hàng đã bị hủy");
        }
      }

      // For bank_transfer: generate dynamic VietQR (amount + content embedded).
      // For momo/zalopay: use the static QR image admin uploaded in Store Settings;
      // skip the VietQR API entirely so each method shows its own wallet QR.
      if (
        fromService &&
        fromService.paymentMethod === "bank_transfer" &&
        fromService.status === "pending_payment" &&
        settings?.qrEnabled &&
        !qr
      ) {
        try {
          const result = await vietQr.generate({
            amount: fromService.pricingBreakdownSnapshot.total,
            transferContent: fromService.paymentReference,
          });
          if (alive) setQr(result);
        } catch (e: any) {
          if (alive) setQrError(e?.message ?? "Không thể tạo mã QR");
        }
      }
    };

    void fetchAll();

    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.includes("pending_orders")) void fetchAll();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void fetchAll();
    };
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    const poll = window.setInterval(() => {
      // Stop polling once the order has resolved.
      setOrder((cur) => {
        if (cur && (cur.status === "confirmed" || cur.status === "cancelled")) return cur;
        void fetchAll();
        return cur;
      });
    }, 5000);

    return () => {
      alive = false;
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <div className="max-w-xl mx-auto px-4 py-16 text-center text-sm text-muted-foreground">Đang tải...</div>;
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mx-auto mb-3" />
        <h1 className="text-lg font-bold">Không tìm thấy đơn chờ thanh toán</h1>
        <Link to="/" className="mt-4 inline-flex items-center gap-2 text-primary text-sm font-medium">
          <ArrowLeft className="h-4 w-4" /> Quay lại trang chủ
        </Link>
      </div>
    );
  }

  const breakdown = order.pricingBreakdownSnapshot;
  const items = order.lines;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`Đã sao chép ${label}`));
  };

  const showBankPanel = order.paymentMethod !== "cash" && order.status === "pending_payment";
  const paymentLabelShort =
    order.paymentMethod === "bank_transfer" ? "chuyển khoản" :
    order.paymentMethod === "momo" ? "MoMo" :
    order.paymentMethod === "zalopay" ? "ZaloPay" : "tiền mặt";

  // Per-method QR readiness: locks the "Tôi đã thanh toán" button if admin
  // hasn't configured the static wallet QR (MoMo/ZaloPay) or VietQR (bank_transfer).
  const isWalletMethod = order.paymentMethod === "momo" || order.paymentMethod === "zalopay";
  const walletImageForMethod =
    order.paymentMethod === "momo" ? bank?.momoQrImage :
    order.paymentMethod === "zalopay" ? bank?.zalopayQrImage : "";
  const paymentReady = order.paymentMethod === "cash"
    ? true
    : isWalletMethod
      ? Boolean(walletImageForMethod)
      : Boolean(bank?.qrEnabled && bank?.accountNumber);

  const [confirming, setConfirming] = useState(false);
  const onCustomerConfirm = async () => {
    if (!order || !paymentReady) return;
    setConfirming(true);
    try {
      await pendingOrdersService.update(order.id, { status: "waiting_confirm" });
      toast.success("Đã ghi nhận. Cửa hàng sẽ kiểm tra và xác nhận.");
      const fresh = await pendingOrdersService.get(order.id);
      if (fresh) setOrder(fresh);
    } catch {
      toast.error("Không gửi được xác nhận, vui lòng thử lại");
    } finally {
      setConfirming(false);
    }
  };


  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        {order.status === "pending_payment" && <Clock className="h-12 w-12 text-warning mx-auto mb-3" />}
        {order.status === "waiting_confirm" && <Clock className="h-12 w-12 text-warning mx-auto mb-3" />}
        {order.status === "confirmed" && <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />}
        {order.status === "cancelled" && <XCircle className="h-12 w-12 text-danger mx-auto mb-3" />}
        <h1 className="text-xl font-bold">
          {order.status === "pending_payment" && "Đang chờ thanh toán"}
          {order.status === "waiting_confirm" && "Đang chờ xác nhận"}
          {order.status === "confirmed" && "Thanh toán đã được xác nhận"}
          {order.status === "cancelled" && "Đơn hàng đã bị hủy"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mã đơn: <span className="font-medium text-foreground">{order.code}</span> · {PAYMENT_LABEL[order.paymentMethod]}
        </p>
      </div>

      <div className="bg-card border rounded-lg p-4 mb-4">
        <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" /> Tiến trình đơn hàng
        </h2>
        <OrderTimeline
          paymentMethod={order.paymentMethod}
          status={order.status}
          createdAt={order.createdAt}
          expiresAt={order.expiresAt}
        />
      </div>

      {showBankPanel && (() => {
        const method = order.paymentMethod;
        const isWallet = method === "momo" || method === "zalopay";
        const walletImage = method === "momo" ? bank?.momoQrImage : method === "zalopay" ? bank?.zalopayQrImage : "";
        const walletHolder = method === "momo" ? bank?.momoAccountName : method === "zalopay" ? bank?.zalopayAccountName : "";
        const walletPhone = method === "momo" ? bank?.momoPhone : method === "zalopay" ? bank?.zalopayPhone : "";

        const hasBankCfg = bank?.qrEnabled && bank?.accountNumber;
        const hasWalletCfg = isWallet && walletImage;
        const configured = isWallet ? hasWalletCfg : hasBankCfg;

        return (
          <div className="bg-card rounded-lg border p-4 mb-4">
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <QrCode className="h-4 w-4 text-primary" /> Thông tin thanh toán ({paymentLabelShort})
            </h2>

            {!configured ? (
              <div className="p-3 bg-warning-soft rounded-md text-xs text-warning flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Cửa hàng chưa cấu hình QR cho phương thức này. Vào <strong>Cài đặt cửa hàng</strong> để bổ sung.
                </span>
              </div>
            ) : isWallet ? (
              <div className="grid sm:grid-cols-[244px_1fr] gap-4">
                <div className="flex justify-center">
                  <img src={walletImage!} alt={`QR ${paymentLabelShort}`} className="h-60 w-60 object-contain border rounded-md bg-white p-2" />
                </div>
                <div className="space-y-1.5 text-sm">
                  {[
                    { label: "Phương thức", value: PAYMENT_LABEL[method] },
                    ...(walletHolder ? [{ label: "Chủ tài khoản", value: walletHolder }] : []),
                    ...(walletPhone ? [{ label: "Số điện thoại", value: walletPhone }] : []),
                    { label: "Nội dung CK", value: order.paymentReference },
                    { label: "Số tiền", value: formatVND(breakdown.total) },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-1 border-b last:border-0">
                      <span className="text-muted-foreground text-xs">{row.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-xs">{row.value}</span>
                        <button onClick={() => copy(String(row.value), row.label)} className="text-muted-foreground hover:text-foreground">
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-[244px_1fr] gap-4">
                <div className="flex justify-center">
                  {qr ? (
                    <img src={qr.imageUrl} alt="VietQR" className="h-60 w-60 object-contain border rounded-md bg-white p-2" />
                  ) : qrError ? (
                    <div className="h-60 w-60 border rounded-md flex items-center justify-center text-xs text-danger text-center px-2">{qrError}</div>
                  ) : (
                    <div className="h-60 w-60 border rounded-md flex items-center justify-center text-xs text-muted-foreground">Đang tạo QR...</div>
                  )}
                </div>
                <div className="space-y-1.5 text-sm">
                  {[
                    { label: "Ngân hàng", value: bank!.bankName },
                    { label: "Số tài khoản", value: bank!.accountNumber },
                    { label: "Chủ tài khoản", value: bank!.accountName },
                    { label: "Nội dung CK", value: order.paymentReference },
                    { label: "Số tiền", value: formatVND(breakdown.total) },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-1 border-b last:border-0">
                      <span className="text-muted-foreground text-xs">{row.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-xs">{row.value}</span>
                        <button onClick={() => copy(String(row.value), row.label)} className="text-muted-foreground hover:text-foreground">
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order.expiresAt && (
              <div className="mt-4 p-2.5 bg-warning-soft rounded-md text-xs text-warning flex items-start gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Đơn hàng sẽ hết hạn lúc {formatDateTime(order.expiresAt)}. Vui lòng thanh toán trước thời hạn.</span>
              </div>
            )}
          </div>
        );
      })()}

      <div className="bg-card rounded-lg border p-4 mb-4">
        <h2 className="font-semibold text-sm mb-3">Chi tiết đơn hàng</h2>
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-muted rounded flex items-center justify-center shrink-0">
                    <Package className="h-3.5 w-3.5 text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">{item.productName}{item.variantName ? ` · ${item.variantName}` : ""}</p>
                    <p className="text-[11px] text-muted-foreground">x{item.qty}</p>
                  </div>
                </div>
                <span className="text-xs font-medium">{formatVND(item.lineSubtotal)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Không có sản phẩm.</p>
        )}

        {order.giftLinesSnapshot.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs font-medium text-success mb-1.5">Quà tặng kèm</p>
            {order.giftLinesSnapshot.map((g, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span>{g.productName} {g.variantName ? `· ${g.variantName}` : ""} x{g.qty}</span>
                <span className="text-success">Tặng</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 pt-3 border-t space-y-1.5 text-xs">
          <SummaryRow label="Tạm tính" value={formatVND(breakdown.subtotal)} />
          {breakdown.manualDiscount > 0 && <SummaryRow label="Giảm giá thủ công" value={`-${formatVND(breakdown.manualDiscount)}`} />}
          {breakdown.promotionDiscount > 0 && (
            <SummaryRow
              label={`Khuyến mãi${order.promotionSnapshot ? ` (${order.promotionSnapshot.name})` : ""}`}
              value={`-${formatVND(breakdown.promotionDiscount)}`}
            />
          )}
          {breakdown.voucherDiscount > 0 && (
            <SummaryRow
              label={`Voucher${order.voucherSnapshot ? ` (${order.voucherSnapshot.code})` : ""}`}
              value={`-${formatVND(breakdown.voucherDiscount)}`}
            />
          )}
          <SummaryRow
            label="Phí giao hàng"
            value={breakdown.shippingFee === 0 ? <span className="text-success">Miễn phí</span> : formatVND(breakdown.shippingFee)}
          />
          {breakdown.shippingDiscount > 0 && <SummaryRow label="Giảm phí giao hàng" value={`-${formatVND(breakdown.shippingDiscount)}`} />}
          {breakdown.vat > 0 && <SummaryRow label="VAT" value={formatVND(breakdown.vat)} />}
        </div>

        <div className="border-t mt-3 pt-2 flex justify-between font-bold">
          <span>Tổng cộng</span>
          <span className="text-primary">{formatVND(breakdown.total)}</span>
        </div>
      </div>

      {order.shippingAddress && (
        <div className="bg-card rounded-lg border p-4 mb-4 text-sm">
          <h2 className="font-semibold text-sm mb-2">Giao đến</h2>
          <p className="font-medium">{order.shippingAddress.receiverName} · {order.shippingAddress.phone}</p>
          <p className="text-muted-foreground text-xs mt-1">
            {[
              order.shippingAddress.street,
              order.shippingAddress.wardName,
              order.shippingAddress.districtName,
              order.shippingAddress.provinceName,
            ].filter(Boolean).join(", ")}
          </p>
          {order.shippingQuoteSnapshot?.etaDays && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Dự kiến giao trong {order.shippingQuoteSnapshot.etaDays.min}-{order.shippingQuoteSnapshot.etaDays.max} ngày
              {order.shippingQuoteSnapshot.zoneCode ? ` · ${order.shippingQuoteSnapshot.zoneCode}` : ""}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Link to="/" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" /> Quay lại mua sắm
        </Link>
        <Link to="/account" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors">
          Xem đơn hàng
        </Link>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
