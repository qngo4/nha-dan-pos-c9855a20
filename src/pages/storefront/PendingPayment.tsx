import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { formatVND, formatDateTime } from "@/lib/format";
import { Clock, CheckCircle, XCircle, AlertTriangle, ArrowLeft, Package, Copy, QrCode, RefreshCw, Bug, Loader2 } from "lucide-react";
import { pendingOrders as pendingOrdersService, storeSettings, vietQr } from "@/services";
import { OrderTimeline } from "@/components/shared/OrderTimeline";
import { supabase } from "@/integrations/supabase/client";
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
  const [qrAttempt, setQrAttempt] = useState(0);
  const [confirming, setConfirming] = useState(false);
  // Bumping this re-mounts the wallet <img> so a failed/missing static QR
  // can be re-attempted without leaving the page.
  const [walletQrAttempt, setWalletQrAttempt] = useState(0);
  const [walletImgFailed, setWalletImgFailed] = useState(false);
  const [changingMethod, setChangingMethod] = useState(false);

  // Reload the order whenever:
  //  - the route id changes
  //  - the user returns to this tab (visibilitychange)
  //  - Supabase Realtime pushes an UPDATE on this row (payment matched by webhook trigger)
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
        if (fromService.status === "confirmed" || fromService.status === "paid_auto") {
          toast.success("Đã nhận thanh toán tự động qua webhook ngân hàng");
        } else if (fromService.status === "cancelled") {
          toast.error("Đơn hàng đã bị hủy");
        }
      }

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
            cacheKey: `${fromService.id}-${fromService.code}-${fromService.pricingBreakdownSnapshot.total}-${qrAttempt}`,
          });
          if (alive) setQr(result);
        } catch (e: any) {
          if (alive) setQrError(e?.message ?? "Không thể tạo mã QR");
        }
      }
    };

    void fetchAll();

    const onVisible = () => {
      if (document.visibilityState === "visible") void fetchAll();
    };
    document.addEventListener("visibilitychange", onVisible);

    // Supabase Realtime: trigger apply_payment_event() updates this row's
    // status/paid_amount the moment Casso webhook posts a matching transfer.
    const filter = /^[0-9a-f]{8}-/i.test(id) ? `id=eq.${id}` : `code=eq.${id}`;
    const channel = supabase
      .channel(`pending_order_${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pending_orders", filter },
        () => { void fetchAll(); }
      )
      .subscribe();

    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, qrAttempt]);


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
  const insufficientEvent = null as null | { amount: number };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`Đã sao chép ${label}`));
  };

  const showBankPanel = order.paymentMethod !== "cash" && order.status === "pending_payment";
  const paymentLabelShort =
    order.paymentMethod === "bank_transfer" ? "chuyển khoản" :
    order.paymentMethod === "momo" ? "MoMo" :
    order.paymentMethod === "zalopay" ? "ZaloPay" : "tiền mặt";

  const isWalletMethod = order.paymentMethod === "momo" || order.paymentMethod === "zalopay";
  const walletImageForMethod =
    order.paymentMethod === "momo" ? bank?.momoQrImage :
    order.paymentMethod === "zalopay" ? bank?.zalopayQrImage : "";
  const paymentReady = order.paymentMethod === "cash"
    ? true
    : isWalletMethod
      ? Boolean(walletImageForMethod)
      : Boolean(bank?.qrEnabled && bank?.accountNumber);

  // Most VN banks reject 24/7 transfers below 10.000đ with a "minimum amount"
  // popup. Surface this clearly so customers don't blame the QR.
  const BANK_MIN_TRANSFER = 10_000;
  const showMinTransferWarning =
    order.paymentMethod === "bank_transfer" &&
    order.status === "pending_payment" &&
    breakdown.total < BANK_MIN_TRANSFER;

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

            {showMinTransferWarning && (
              <div className="mb-3 p-3 bg-warning-soft rounded-md text-xs text-warning flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Số tiền <strong>{formatVND(breakdown.total)}</strong> thấp hơn mức tối thiểu (10.000đ)
                  mà nhiều ngân hàng cho phép chuyển khoản 24/7. Nếu app báo "số tiền giao dịch tối thiểu",
                  vui lòng đổi sang <strong>tiền mặt</strong> hoặc liên hệ cửa hàng.
                </span>
              </div>
            )}

            {!configured ? (
              <div className="p-3 bg-warning-soft rounded-md text-xs text-warning flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Cửa hàng chưa cấu hình QR cho phương thức này. Vào <strong>Cài đặt cửa hàng</strong> để bổ sung.
                </span>
              </div>
            ) : isWallet ? (
              <div className="grid sm:grid-cols-[244px_1fr] gap-4">
                <div className="flex flex-col items-center gap-2">
                  {!bank ? (
                    // Settings still loading: show skeleton.
                    <div className="h-60 w-60 rounded-md border bg-muted animate-pulse" />
                  ) : walletImgFailed ? (
                    <div className="h-60 w-60 border rounded-md flex flex-col items-center justify-center gap-2 text-xs text-danger text-center px-3">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Không tải được ảnh QR.</span>
                      <button
                        onClick={() => { setWalletImgFailed(false); setWalletQrAttempt((n) => n + 1); }}
                        className="px-2.5 py-1 rounded border border-danger/50 text-danger text-[11px] hover:bg-danger/5"
                      >
                        Thử lại
                      </button>
                    </div>
                  ) : (
                    <img
                      key={`wallet-qr-${walletQrAttempt}`}
                      src={walletImage!}
                      alt={`QR ${paymentLabelShort}`}
                      onError={() => setWalletImgFailed(true)}
                      onLoad={() => setWalletImgFailed(false)}
                      className="h-60 w-60 object-contain border rounded-md bg-white p-2"
                    />
                  )}
                  <button
                    onClick={() => { setWalletImgFailed(false); setWalletQrAttempt((n) => n + 1); }}
                    className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                  >
                    Tải lại mã QR
                  </button>
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
                <div className="flex flex-col items-center gap-2">
                  {qr ? (
                    <>
                      <img
                        key={`bank-qr-${qrAttempt}`}
                        src={qr.scanImageUrl}
                        alt="VietQR"
                        className="h-60 w-60 object-contain border rounded-md bg-white p-2"
                      />
                      <button
                        onClick={() => {
                          setQr(null);
                          setQrError(null);
                          setQrAttempt((n) => n + 1);
                        }}
                        className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                      >
                        Tải lại mã QR
                      </button>
                    </>
                  ) : qrError ? (
                    <div className="h-60 w-60 border rounded-md flex flex-col items-center justify-center gap-2 text-xs text-danger text-center px-3">
                      <AlertTriangle className="h-5 w-5" />
                      <span>{qrError}</span>
                      <button
                        onClick={async () => {
                          if (!order) return;
                          setQr(null);
                          setQrError(null);
                          try {
                            const result = await vietQr.generate({
                              amount: order.pricingBreakdownSnapshot.total,
                              transferContent: order.paymentReference,
                              cacheKey: `${order.id}-${Date.now()}-${qrAttempt + 1}`,
                            });
                            setQr(result);
                            setQrAttempt((n) => n + 1);
                          } catch (e: any) {
                            setQrError(e?.message ?? "Không thể tạo mã QR");
                          }
                        }}
                        className="px-2.5 py-1 rounded border border-danger/50 text-danger text-[11px] hover:bg-danger/5"
                      >
                        Thử lại
                      </button>
                    </div>
                  ) : (
                    // Real skeleton instead of plain text while VietQR is generating.
                    <div className="h-60 w-60 rounded-md border bg-muted animate-pulse" />
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

            {/* Method switcher: lets the customer pick another payment method
                without losing the order — useful when the wallet QR is missing
                or won't load and they need a working alternative. */}
            <MethodSwitcher
              currentMethod={method}
              busy={changingMethod}
              onChange={async (next) => {
                if (!order || next === order.paymentMethod) return;
                setChangingMethod(true);
                try {
                  await pendingOrdersService.update(order.id, { paymentMethod: next });
                  const fresh = await pendingOrdersService.get(order.id);
                  if (fresh) setOrder(fresh);
                  setQr(null);
                  setQrError(null);
                  setQrAttempt(0);
                  setWalletImgFailed(false);
                  toast.success(`Đã chuyển sang ${PAYMENT_LABEL[next]}`);
                } catch {
                  toast.error("Không đổi được phương thức, thử lại sau");
                } finally {
                  setChangingMethod(false);
                }
              }}
            />

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

      {order.status === "pending_payment" && order.paymentMethod !== "cash" && (
        <div className="mb-3 space-y-2">
          {insufficientEvent && (
            <div className="p-3 rounded-md border border-warning/40 bg-warning-soft text-xs text-warning flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Hệ thống đã nhận giao dịch <strong>{formatVND(insufficientEvent.amount)}</strong> nhưng chưa đủ số tiền đơn hàng (<strong>{formatVND(breakdown.total)}</strong>). Vui lòng chuyển bù phần còn thiếu hoặc liên hệ cửa hàng.
              </span>
            </div>
          )}
          {!paymentReady && (
            <div className="p-3 rounded-md border border-warning/40 bg-warning-soft text-xs text-warning flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                {isWalletMethod
                  ? `Cửa hàng chưa cấu hình QR ${paymentLabelShort}. Vui lòng liên hệ cửa hàng hoặc chọn phương thức khác — nút xác nhận sẽ mở khi QR sẵn sàng.`
                  : "Cửa hàng chưa bật VietQR. Vui lòng liên hệ cửa hàng để được hướng dẫn chuyển khoản."}
              </span>
            </div>
          )}
          <button
            onClick={onCustomerConfirm}
            disabled={!paymentReady || confirming}
            className="w-full py-2.5 rounded-md bg-success text-success-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirming ? "Đang gửi..." : "Tôi đã thanh toán — gửi xác nhận"}
          </button>
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

// Inline switcher used by the bank/wallet panel so the customer can recover
// from a missing or broken QR without abandoning the order.
function MethodSwitcher({
  currentMethod,
  busy,
  onChange,
}: {
  currentMethod: PaymentMethod;
  busy: boolean;
  onChange: (next: PaymentMethod) => void;
}) {
  const options: PaymentMethod[] = ["bank_transfer", "momo", "zalopay"];
  return (
    <div className="mt-4 pt-3 border-t">
      <p className="text-[11px] font-medium text-muted-foreground mb-2">
        Không quét được QR? Đổi phương thức thanh toán:
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((m) => {
          const active = m === currentMethod;
          return (
            <button
              key={m}
              type="button"
              disabled={busy || active}
              onClick={() => onChange(m)}
              className={
                "text-xs px-3 py-1.5 rounded-full border transition-colors " +
                (active
                  ? "bg-primary text-primary-foreground border-primary cursor-default"
                  : "bg-background hover:bg-muted border-input disabled:opacity-50")
              }
            >
              {PAYMENT_LABEL[m]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
