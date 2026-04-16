import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { FilterChip } from "@/components/shared/DataTableToolbar";
import { revenueData, revenueByProduct, revenueByCategory } from "@/lib/mock-data";
import { formatVND, formatNumber } from "@/lib/format";
import { TrendingUp, Download, ShoppingCart, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminRevenueReport() {
  const [groupBy, setGroupBy] = useState('daily');
  const totalRevenue = revenueData.reduce((s, r) => s + r.revenue, 0);
  const totalInvoices = revenueData.reduce((s, r) => s + r.invoiceCount, 0);
  const totalItems = revenueData.reduce((s, r) => s + r.itemsSold, 0);

  return (
    <div className="space-y-4 admin-dense">
      <PageHeader
        title="Doanh thu"
        description="Báo cáo doanh thu bán hàng"
        actions={<button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted"><Download className="h-3.5 w-3.5" /> Xuất Excel</button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={TrendingUp} title="Tổng doanh thu" value={formatVND(totalRevenue)} variant="primary" />
        <StatCard icon={ShoppingCart} title="Hóa đơn" value={formatNumber(totalInvoices)} />
        <StatCard icon={BarChart3} title="SP đã bán" value={formatNumber(totalItems)} variant="success" />
        <StatCard icon={TrendingUp} title="TB/hóa đơn" value={formatVND(Math.round(totalRevenue / totalInvoices))} />
      </div>

      {/* Grouping */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Nhóm theo:</span>
        {['daily', 'weekly', 'monthly', 'yearly'].map(g => (
          <FilterChip key={g} label={{ daily: 'Ngày', weekly: 'Tuần', monthly: 'Tháng', yearly: 'Năm' }[g]!} active={groupBy === g} onClick={() => setGroupBy(g)} />
        ))}
        <div className="ml-auto flex gap-2">
          <input type="date" defaultValue="2025-04-09" className="h-8 px-2 text-xs border rounded-md bg-card" />
          <input type="date" defaultValue="2025-04-15" className="h-8 px-2 text-xs border rounded-md bg-card" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue by period */}
        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-semibold text-sm mb-3">Doanh thu theo ngày</h3>
          <div className="space-y-2">
            {revenueData.map((r, i) => {
              const maxRev = Math.max(...revenueData.map(x => x.revenue));
              const pct = (r.revenue / maxRev) * 100;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">{r.period}</span>
                  <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-medium w-24 text-right shrink-0">{formatVND(r.revenue)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue by category */}
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

      {/* Top products */}
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
