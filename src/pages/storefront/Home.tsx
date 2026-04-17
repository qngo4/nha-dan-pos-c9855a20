import { Link } from "react-router-dom";
import {
  Search,
  ChevronRight,
  Flame,
  Sparkles,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  ArrowRight,
} from "lucide-react";
import { products, combos, categories } from "@/lib/mock-data";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ComboCard } from "@/components/storefront/ComboCard";
import { HotProductsCarousel } from "@/components/storefront/HotProductsCarousel";
import { Reveal } from "@/components/storefront/Reveal";
import { cn } from "@/lib/utils";
import { useState } from "react";

const trustItems = [
  { icon: Truck, label: "Giao nhanh trong ngày", sub: "Nội thành 2 giờ" },
  { icon: ShieldCheck, label: "Hàng chính hãng", sub: "Bảo đảm nguồn gốc" },
  { icon: RotateCcw, label: "Đổi trả 7 ngày", sub: "Miễn phí kiểm tra" },
  { icon: Headphones, label: "Hỗ trợ 24/7", sub: "Hotline 1900 1234" },
];

export default function StorefrontHome() {
  const activeCategories = categories.filter((c) => c.active);
  const activeProducts = products.filter((p) => p.active);
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const filteredProducts = activeChip
    ? activeProducts.filter((p) => p.categoryId === activeChip)
    : activeProducts;

  return (
    <div className="storefront-relaxed bg-storefront-bg">
      {/* === HERO === */}
      <section className="relative overflow-hidden sf-hero-bg text-storefront-hero-foreground">
        <div className="absolute inset-0 sf-hero-overlay pointer-events-none" />
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-storefront-accent/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-info/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 py-14 md:py-24 grid md:grid-cols-2 gap-8 items-center">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-[11px] font-semibold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" /> Mua sắm thông minh mỗi ngày
            </span>
            <h1 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              Tạp hóa hiện đại,
              <br />
              <span className="text-storefront-accent">giá tốt mỗi ngày.</span>
            </h1>
            <p className="mt-4 text-sm md:text-base opacity-90 leading-relaxed">
              Hàng nghìn sản phẩm thiết yếu — mì gói, đồ uống, sữa, hóa mỹ phẩm — luôn sẵn kho,
              giao nhanh, giá niêm yết minh bạch.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-white text-foreground px-5 py-3 rounded-full text-sm font-semibold hover:bg-white/90 transition-colors shadow-lg"
              >
                Mua sắm ngay <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/combos"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold border border-white/30 hover:bg-white/10 transition-colors"
              >
                <Sparkles className="h-4 w-4" /> Xem combo ưu đãi
              </Link>
            </div>

            {/* Hero search */}
            <div className="mt-7 relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Bạn cần tìm sản phẩm gì?"
                className="w-full h-12 pl-11 pr-32 text-sm rounded-full bg-white/95 text-foreground placeholder:text-muted-foreground border-0 focus:outline-none focus:ring-2 focus:ring-white/40"
              />
              <Link
                to="/products"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-4 h-9 rounded-full bg-foreground text-background text-xs font-semibold hover:opacity-90"
              >
                Tìm
              </Link>
            </div>

            <div className="mt-6 flex items-center gap-6 text-xs opacity-90">
              <div>
                <p className="text-2xl font-bold">2K+</p>
                <p>Sản phẩm</p>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <p className="text-2xl font-bold">15K+</p>
                <p>Khách hàng</p>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <p className="text-2xl font-bold">4.9★</p>
                <p>Đánh giá</p>
              </div>
            </div>
          </div>

          {/* Hero visual */}
          <div className="hidden md:block relative">
            <div className="relative aspect-square max-w-md ml-auto">
              <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm border border-white/20" />
              <div className="absolute inset-6 rounded-[2rem] bg-white/95 sf-shadow flex items-center justify-center">
                <div className="grid grid-cols-2 gap-3 p-6 w-full">
                  {activeProducts.slice(0, 4).map((p, i) => (
                    <div
                      key={p.id}
                      className="aspect-square rounded-xl bg-gradient-to-br from-storefront-soft to-muted flex items-center justify-center text-foreground/60 text-xs font-medium text-center p-2"
                      style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 2}deg)` }}
                    >
                      {p.name.split(" ").slice(0, 2).join(" ")}
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -top-3 -left-3 px-3 py-1.5 rounded-full bg-storefront-accent text-white text-xs font-bold shadow-lg">
                -30%
              </div>
              <div className="absolute -bottom-3 -right-3 px-3 py-1.5 rounded-full bg-storefront-gold text-white text-xs font-bold shadow-lg">
                Bán chạy
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === Trust strip === */}
      <section className="border-y bg-storefront-surface">
        <div className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {trustItems.map((t) => (
            <div key={t.label} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <t.icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-tight">{t.label}</p>
                <p className="text-[11px] text-muted-foreground">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
        {/* === Categories === */}
        <Reveal>
          <section>
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="sf-eyebrow">Khám phá</p>
                <h2 className="sf-section-title mt-1">Danh mục sản phẩm</h2>
              </div>
              <Link to="/products" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                Xem tất cả <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
              <button
                onClick={() => setActiveChip(null)}
                className={cn("sf-chip", !activeChip && "sf-chip-active")}
              >
                Tất cả
              </button>
              {activeCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveChip(cat.id)}
                  className={cn("sf-chip", activeChip === cat.id && "sf-chip-active")}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </section>
        </Reveal>

        {/* === Hot selling (carousel) === */}
        <Reveal>
          <section>
            <div className="flex items-end justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-storefront-accent/10 text-storefront-accent flex items-center justify-center">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <p className="sf-eyebrow">Đang hot</p>
                  <h2 className="sf-section-title">Bán chạy nhất</h2>
                </div>
              </div>
              <Link to="/products" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                Xem tất cả <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <HotProductsCarousel items={filteredProducts.slice(0, 10)} />
          </section>
        </Reveal>

        {/* === Combo banner === */}
        <Reveal>
          <section className="relative overflow-hidden rounded-3xl sf-combo-bg p-6 md:p-10 border">
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-storefront-accent/20 blur-3xl" />
            <div className="relative grid md:grid-cols-2 gap-6 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-storefront-accent text-white text-[11px] font-semibold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" /> Combo tiết kiệm
                </span>
                <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">
                  Mua combo, tiết kiệm đến 25%
                </h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-md">
                  Các combo gia đình được thiết kế sẵn — đủ dùng trong tuần, giá ưu đãi hơn mua lẻ.
                </p>
                <Link
                  to="/combos"
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 sf-shadow-cta"
                >
                  Xem tất cả combo <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {combos.filter((c) => c.active).slice(0, 2).map((c) => (
                  <ComboCard key={c.id} combo={c} />
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        {/* === All products === */}
        <Reveal>
          <section>
            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="sf-eyebrow">Tất cả sản phẩm</p>
                <h2 className="sf-section-title mt-1">Mới nhất tại Nhã Đan Shop</h2>
              </div>
              <Link to="/products" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                Xem tất cả <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
