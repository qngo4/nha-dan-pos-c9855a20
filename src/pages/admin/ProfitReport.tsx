import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { profitData, dashboardStats } from "@/lib/mock-data";
import { formatVND, formatPercent, formatNumber } from "@/lib/format";
import { DollarSign, TrendingUp, Download, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminProfitReport() {
  const totalRevenue = profitData.reduce((s, r) => s + r.revenue, 0);
  const totalCost = profitData.reduce((s, r) => s + r.cost, 0);
  const totalProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;
  const totalInvoices = profitData.reduce((s, r) => s + r.invoiceCount, 0);

  return (
    <div className="space-y-4 admin-dense">
      <PageHeader
        title="Lợi nhuận"
        description="Báo cáo lợi nhuận kinh doanh"
        actions={<button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted"><Download className="h-3.5 w-3.5" /> Xuất Excel</button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={TrendingUp} title="Doanh thu" value={formatVND(totalRevenue)} variant="primary" />
        <StatCard icon={DollarSign} title="Giá vốn" value={formatVND(totalCost)} />
        <StatCard icon={DollarSign} title="Lợi nhuận" value={formatVND(totalProfit)} variant="success" trend={{ value: formatPercent(margin), positive: totalProfit > 0 }} />
        <StatCard icon={Receipt} title="Hóa đơn" value={formatNumber(totalInvoices)} />
      </div>

      {/* Date range */}
      <div className="flex items-center gap-2">
        <input type="date" defaultValue="2025-04-07" className="h-8 px-2 text-xs border rounded-md bg-card" />
        <span className="text-xs text-muted-foreground">—</span>
        <input type="date" defaultValue="2025-04-15" className="h-8 px-2 text-xs border rounded-md bg-card" />
      </div>

      {/* Quick stats */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-semibold text-sm mb-1">Tuần này</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Doanh thu</span><span className="font-medium">{formatVND(dashboardStats.revenueThisWeek)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Lợi nhuận</span><span className="font-medium text-success">{formatVND(dashboardStats.profitThisWeek)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Biên lợi nhuận</span><span className="font-medium">{formatPercent(dashboardStats.profitThisWeek / dashboardStats.revenueThisWeek)}</span></div>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-semibold text-sm mb-1">Tháng này</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Doanh thu</span><span className="font-medium">{formatVND(dashboardStats.revenueThisMonth)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Lợi nhuận</span><span className="font-medium text-success">{formatVND(dashboardStats.profitThisMonth)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Biên lợi nhuận</span><span className="font-medium">{formatPercent(dashboardStats.profitThisMonth / dashboardStats.revenueThisMonth)}</span></div>
          </div>
        </div>
      </div>

      {/* Period breakdown */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b"><h3 className="font-semibold text-sm">Chi tiết theo kỳ</h3></div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Kỳ</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Doanh thu</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Giá vốn</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Lợi nhuận</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Biên LN</th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground">Hóa đơn</th>
            </tr>
          </thead>
          <tbody>
            {profitData.map((r, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2.5 font-medium">{r.period}</td>
                <td className="px-3 py-2.5 text-right">{formatVND(r.revenue)}</td>
                <td className="px-3 py-2.5 text-right text-muted-foreground">{formatVND(r.cost)}</td>
                <td className="px-3 py-2.5 text-right font-medium text-success">{formatVND(r.profit)}</td>
                <td className="px-3 py-2.5 text-right">{formatPercent(r.margin)}</td>
                <td className="px-3 py-2.5 text-center">{r.invoiceCount}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/50 font-bold">
              <td className="px-3 py-2">Tổng</td>
              <td className="px-3 py-2 text-right">{formatVND(totalRevenue)}</td>
              <td className="px-3 py-2 text-right">{formatVND(totalCost)}</td>
              <td className="px-3 py-2 text-right text-success">{formatVND(totalProfit)}</td>
              <td className="px-3 py-2 text-right">{formatPercent(margin)}</td>
              <td className="px-3 py-2 text-center">{totalInvoices}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
