import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { FilterChip } from "@/components/shared/DataTableToolbar";
import { DateInput } from "@/components/shared/DateInput";
import { revenueData, revenueByProduct, revenueByCategory } from "@/lib/mock-data";
import { formatVND, formatNumber } from "@/lib/format";
import { TrendingUp, Download, ShoppingCart, BarChart3 } from "lucide-react";
import { toast } from "sonner";

type Group = "daily" | "weekly" | "monthly" | "yearly";

// Aggregate the daily revenueData mock into the chosen grouping.
function aggregate(group: Group) {
  const sorted = [...revenueData].slice().reverse(); // chronological
  if (group === "daily") {
    return sorted.map(r => ({ period: r.period, revenue: r.revenue, invoiceCount: r.invoiceCount, itemsSold: r.itemsSold }));
  }
  if (group === "weekly") {
    // Group every 7 entries into one bucket
    const bucket = sorted.reduce((acc, r) => { acc.revenue += r.revenue; acc.invoiceCount += r.invoiceCount; acc.itemsSold += r.itemsSold; return acc; }, { revenue: 0, invoiceCount: 0, itemsSold: 0 });
    return [{ period: "Tuần này (09–15/04)", ...bucket }];
  }
  if (group === "monthly") {
    const total = sorted.reduce((acc, r) => { acc.revenue += r.revenue; acc.invoiceCount += r.invoiceCount; acc.itemsSold += r.itemsSold; return acc; }, { revenue: 0, invoiceCount: 0, itemsSold: 0 });
    return [
      { period: "Tháng 03/2025", revenue: Math.round(total.revenue * 4.2), invoiceCount: Math.round(total.invoiceCount * 4.2), itemsSold: Math.round(total.itemsSold * 4.2) },
      { period: "Tháng 04/2025", ...total },
    ];
  }
  // yearly
  return [
    { period: "2024", revenue: 285000000, invoiceCount: 1820, itemsSold: 9450 },
    { period: "2025 (đến nay)", revenue: 78400000, invoiceCount: 540, itemsSold: 2780 },
  ];
}

const groupLabel: Record<Group, string> = { daily: "Ngày", weekly: "Tuần", monthly: "Tháng", yearly: "Năm" };

export default function AdminRevenueReport() {
  const [groupBy, setGroupBy] = useState<Group>("daily");
  const [from, setFrom] = useState("2025-04-09");
  const [to, setTo] = useState("2025-04-15");

  const rows = useMemo(() => aggregate(groupBy), [groupBy]);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalInvoices = rows.reduce((s, r) => s + r.invoiceCount, 0);
  const totalItems = rows.reduce((s, r) => s + r.itemsSold, 0);

  return (
    <div className="space-y-4 admin-dense">
      <PageHeader
        title="Doanh thu"
        description={`Báo cáo doanh thu — nhóm theo ${groupLabel[groupBy].toLowerCase()}`}
        actions={<button onClick={() => toast.success("Đã xuất báo cáo Excel")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted"><Download className="h-3.5 w-3.5" /> Xuất Excel</button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={TrendingUp} title="Tổng doanh thu" value={formatVND(totalRevenue)} variant="primary" />
        <StatCard icon={ShoppingCart} title="Hóa đơn" value={formatNumber(totalInvoices)} />
        <StatCard icon={BarChart3} title="SP đã bán" value={formatNumber(totalItems)} variant="success" />
        <StatCard icon={TrendingUp} title="TB/hóa đơn" value={totalInvoices ? formatVND(Math.round(totalRevenue / totalInvoices)) : "—"} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Nhóm theo:</span>
        {(["daily", "weekly", "monthly", "yearly"] as Group[]).map(g => (
          <FilterChip key={g} label={groupLabel[g]} active={groupBy === g} onClick={() => setGroupBy(g)} />
        ))}
        <div className="ml-auto flex items-center gap-2">
          <DateInput value={from} onChange={setFrom} />
          <span className="text-xs text-muted-foreground">—</span>
          <DateInput value={to} onChange={setTo} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-semibold text-sm mb-3">Doanh thu theo {groupLabel[groupBy].toLowerCase()}</h3>
          <div className="space-y-2">
            {rows.map((r, i) => {
              const maxRev = Math.max(...rows.map(x => x.revenue), 1);
              const pct = (r.revenue / maxRev) * 100;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-32 shrink-0 truncate">{r.period}</span>
                  <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-medium w-24 text-right shrink-0">{formatVND(r.revenue)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-semibold text-sm mb-3">Doanh thu theo danh mục</h3>
          <div className="space-y-2">
            {revenueByCategory.map((r, i) => {
              const maxRev = Math.max(...revenueByCategory.map(x => x.revenue));
              const pct = (r.revenue / maxRev) * 100;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs w-32 shrink-0 truncate">{r.name}</span>
                  <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-success rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-medium w-24 text-right shrink-0">{formatVND(r.revenue)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm">Chi tiết theo {groupLabel[groupBy].toLowerCase()}</h3>
          <span className="text-[11px] text-muted-foreground">{rows.length} dòng</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Kỳ</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Doanh thu</th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground">Hóa đơn</th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground">SP bán</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">TB/hóa đơn</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2.5 font-medium">{r.period}</td>
                <td className="px-3 py-2.5 text-right text-primary font-medium">{formatVND(r.revenue)}</td>
                <td className="px-3 py-2.5 text-center">{r.invoiceCount}</td>
                <td className="px-3 py-2.5 text-center">{r.itemsSold}</td>
                <td className="px-3 py-2.5 text-right text-muted-foreground">{r.invoiceCount ? formatVND(Math.round(r.revenue / r.invoiceCount)) : "—"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/50 font-bold">
              <td className="px-3 py-2">Tổng</td>
              <td className="px-3 py-2 text-right text-primary">{formatVND(totalRevenue)}</td>
              <td className="px-3 py-2 text-center">{totalInvoices}</td>
              <td className="px-3 py-2 text-center">{totalItems}</td>
              <td className="px-3 py-2 text-right">{totalInvoices ? formatVND(Math.round(totalRevenue / totalInvoices)) : "—"}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b"><h3 className="font-semibold text-sm">Sản phẩm bán chạy</h3></div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">#</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Sản phẩm</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">SL bán</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            {revenueByProduct.map((r, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                <td className="px-3 py-2 font-medium">{r.name}</td>
                <td className="px-3 py-2 text-right">{formatNumber(r.qty)}</td>
                <td className="px-3 py-2 text-right font-medium text-primary">{formatVND(r.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
