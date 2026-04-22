import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatVND } from "@/lib/format";
import { CheckCircle2, XCircle, RefreshCw, Search } from "lucide-react";

interface LogRow {
  id: string;
  created_at: string;
  province_name: string | null;
  district_name: string | null;
  ward_name: string | null;
  weight_grams: number | null;
  subtotal: number | null;
  ok: boolean;
  fee: number | null;
  eta_min: number | null;
  eta_max: number | null;
  service_id: number | null;
  reason: string | null;
  message: string | null;
  latency_ms: number | null;
  order_code: string | null;
}

const PAGE_SIZE = 50;

export default function GhnQuoteLogsPage() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ok" | "fail">("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ghn_quote_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    if (!error && data) setRows(data as LogRow[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter === "ok" && !r.ok) return false;
      if (statusFilter === "fail" && r.ok) return false;
      if (!q) return true;
      const hay = [
        r.province_name, r.district_name, r.ward_name,
        r.order_code, r.reason, r.message,
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, statusFilter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const ok = rows.filter((r) => r.ok).length;
    const avgLatency = total
      ? Math.round(rows.reduce((s, r) => s + (r.latency_ms ?? 0), 0) / total)
      : 0;
    return { total, ok, fail: total - ok, avgLatency };
  }, [rows]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Nhật ký báo giá GHN"
        subtitle="Mỗi lần Checkout hỏi phí GHN sẽ được ghi lại đây để debug và đối soát"
        action={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Tổng request (50 gần nhất)" value={String(stats.total)} />
        <StatCard label="Thành công" value={String(stats.ok)} tone="success" />
        <StatCard label="Thất bại" value={String(stats.fail)} tone={stats.fail > 0 ? "danger" : "muted"} />
        <StatCard label="Độ trễ TB" value={`${stats.avgLatency} ms`} />
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo địa chỉ, mã đơn, lý do…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="ok">Thành công</SelectItem>
                <SelectItem value="fail">Thất bại</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead className="text-right">Cân (g)</TableHead>
                  <TableHead className="text-right">Phí</TableHead>
                  <TableHead className="text-right">Latency</TableHead>
                  <TableHead>Lý do / Mã đơn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Đang tải…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Chưa có log nào khớp bộ lọc.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {format(new Date(r.created_at), "dd/MM HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        {r.ok ? (
                          <Badge variant="outline" className="border-success text-success gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            OK
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-danger text-danger gap-1">
                            <XCircle className="h-3 w-3" />
                            FAIL
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs max-w-[260px] truncate">
                        {[r.ward_name, r.district_name, r.province_name].filter(Boolean).join(", ") || "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs">{r.weight_grams ?? "—"}</TableCell>
                      <TableCell className="text-right text-xs font-semibold">
                        {r.fee != null ? formatVND(r.fee) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {r.latency_ms != null ? `${r.latency_ms}ms` : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.order_code ? (
                          <Link
                            to={`/admin/pending-orders?code=${encodeURIComponent(r.order_code)}`}
                            className="text-primary hover:underline font-mono"
                          >
                            {r.order_code}
                          </Link>
                        ) : r.reason ? (
                          <div className="space-y-0.5">
                            <p className="font-mono text-danger">{r.reason}</p>
                            {r.message && (
                              <p className="text-muted-foreground text-[11px] truncate max-w-[260px]">
                                {r.message}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "danger" | "muted" }) {
  const toneCls =
    tone === "success" ? "text-success"
      : tone === "danger" ? "text-danger"
      : tone === "muted" ? "text-muted-foreground"
      : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold mt-1 ${toneCls}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
