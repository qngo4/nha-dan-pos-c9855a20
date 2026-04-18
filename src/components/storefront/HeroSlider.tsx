import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Package, Sparkles, ShoppingBag } from "lucide-react";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { products as ProductList } from "@/lib/mock-data";

type Product = (typeof ProductList)[number];

type Slide = {
  product: Product;
  badge: { label: string; tone: "accent" | "gold" | "info" | "success" };
  eyebrow: string;
  tagline: string;
  cta: { label: string; to: string; icon?: "bag" | "sparkles" };
  theme: { bg: string; glow: string; chip: string };
  price: string;
  unit: string;
};

const THEMES = [
  {
    bg: "bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.85),hsl(var(--primary)/0.55)_45%,hsl(220_45%_12%)_100%)]",
    glow: "bg-storefront-accent/40",
    chip: "text-storefront-hero-foreground",
  },
  {
    bg: "bg-[radial-gradient(ellipse_at_top_right,hsl(12_85%_55%/0.85),hsl(20_70%_30%/0.7)_45%,hsl(20_30%_10%)_100%)]",
    glow: "bg-storefront-gold/40",
    chip: "text-storefront-hero-foreground",
  },
  {
    bg: "bg-[radial-gradient(ellipse_at_bottom_left,hsl(160_60%_35%/0.85),hsl(170_50%_18%/0.8)_45%,hsl(180_30%_8%)_100%)]",
    glow: "bg-info/40",
    chip: "text-storefront-hero-foreground",
  },
  {
    bg: "bg-[radial-gradient(ellipse_at_top,hsl(280_55%_45%/0.85),hsl(260_45%_22%/0.8)_45%,hsl(260_30%_10%)_100%)]",
    glow: "bg-storefront-accent/40",
    chip: "text-storefront-hero-foreground",
  },
  {
    bg: "bg-[radial-gradient(ellipse_at_bottom_right,hsl(200_70%_45%/0.85),hsl(210_55%_22%/0.8)_45%,hsl(220_35%_8%)_100%)]",
    glow: "bg-storefront-gold/40",
    chip: "text-storefront-hero-foreground",
  },
] as const;

const TAGLINES = [
  "Sản phẩm chủ đạo — luôn sẵn kho, giao nhanh trong ngày.",
  "Lựa chọn của hàng ngàn gia đình Việt mỗi tuần.",
  "Chất lượng tuyển chọn, giá niêm yết minh bạch.",
  "Hàng chính hãng, đóng gói cẩn thận, vận chuyển an toàn.",
  "Mới về — số lượng có hạn, đặt sớm để không lỡ.",
];

const BADGES: Slide["badge"][] = [
  { label: "Bán chạy", tone: "accent" },
  { label: "Chủ đạo", tone: "gold" },
  { label: "Giá tốt", tone: "success" },
  { label: "Mới", tone: "info" },
  { label: "Bán chạy", tone: "accent" },
];

function badgeClass(tone: Slide["badge"]["tone"]) {
  switch (tone) {
    case "accent":
      return "bg-storefront-accent text-white";
    case "gold":
      return "bg-storefront-gold text-white";
    case "info":
      return "bg-info text-info-foreground";
    case "success":
      return "bg-success text-success-foreground";
  }
}

export function HeroSlider({ items }: { items: Product[] }) {
  const slides: Slide[] = items.slice(0, 5).map((product, i) => {
    const dv = product.variants.find((v) => v.isDefault) || product.variants[0];
    const hasMulti = product.variants.length > 1;
    const minPrice = Math.min(...product.variants.map((v) => v.sellPrice));
    return {
      product,
      badge: BADGES[i % BADGES.length],
      eyebrow: product.categoryName,
      tagline: TAGLINES[i % TAGLINES.length],
      cta: {
        label: i === 1 ? "Xem combo ưu đãi" : i % 2 === 0 ? "Mua ngay" : "Xem sản phẩm",
        to: i === 1 ? "/combos" : `/products/${product.id}`,
        icon: i === 1 ? "sparkles" : "bag",
      },
      theme: THEMES[i % THEMES.length],
      price: hasMulti ? `Từ ${formatVND(minPrice)}` : formatVND(dv.sellPrice),
      unit: dv.sellUnit,
    };
  });

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    duration: 28,
  });
  const [selected, setSelected] = useState(0);
  const [isHover, setIsHover] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  // Auto-play with pause on hover
  useEffect(() => {
    if (!emblaApi) return;
    const id = window.setInterval(() => {
      if (document.hidden || isHover) return;
      emblaApi.scrollNext();
    }, 5500);
    return () => window.clearInterval(id);
  }, [emblaApi, isHover]);

  if (!slides.length) return null;

  return (
    <section
      className="relative"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((s, idx) => {
            const price = s.price;
            const unit = s.unit;
            const Icon = s.cta.icon === "sparkles" ? Sparkles : ShoppingBag;
            return (
              <div key={s.product.id} className="shrink-0 grow-0 basis-full">
                <div
                  className={cn(
                    "relative overflow-hidden text-storefront-hero-foreground",
                    s.theme.bg
                  )}
                >
                  {/* Decorative glows */}
                  <div className={cn("absolute -top-32 -right-24 h-96 w-96 rounded-full blur-3xl", s.theme.glow)} />
                  <div className="absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-white/5 blur-3xl" />
                  {/* Subtle grid texture */}
                  <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(hsl(0_0%_100%)_1px,transparent_1px),linear-gradient(90deg,hsl(0_0%_100%)_1px,transparent_1px)] [background-size:48px_48px]" />

                  <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-20 grid md:grid-cols-2 gap-8 md:gap-12 items-center min-h-[420px] md:min-h-[560px]">
                    {/* Copy */}
                    <div
                      className={cn(
                        "max-w-xl transition-all duration-700",
                        idx === selected ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm", badgeClass(s.badge.tone))}>
                          {s.badge.label}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-[11px] font-semibold uppercase tracking-wider">
                          <Sparkles className="h-3 w-3" /> {s.eyebrow}
                        </span>
                      </div>

                      <h1 className="mt-5 text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
                        {s.product.name}
                      </h1>
                      <p className="mt-4 text-sm md:text-base opacity-90 leading-relaxed max-w-md">
                        {s.tagline}
                      </p>

                      <div className="mt-6 flex items-end gap-4">
                        <div>
                          <p className="text-[11px] uppercase tracking-wider opacity-70">Giá bán</p>
                          <p className="text-2xl md:text-3xl font-bold">{price}</p>
                          <p className="text-[11px] opacity-70 mt-0.5">/ {unit}</p>
                        </div>
                      </div>

                      <div className="mt-7 flex flex-wrap gap-3">
                        <Link
                          to={s.cta.to}
                          className="inline-flex items-center gap-2 bg-white text-foreground px-5 py-3 rounded-full text-sm font-semibold hover:bg-white/90 transition-colors shadow-lg"
                        >
                          <Icon className="h-4 w-4" /> {s.cta.label}
                        </Link>
                        <Link
                          to={`/products/${s.product.id}`}
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold border border-white/30 hover:bg-white/10 transition-colors"
                        >
                          Chi tiết <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>

                    {/* Visual */}
                    <div
                      className={cn(
                        "relative transition-all duration-700",
                        idx === selected ? "opacity-100 scale-100" : "opacity-0 scale-95"
                      )}
                    >
                      <div className="relative aspect-square max-w-[420px] md:max-w-[480px] mx-auto md:ml-auto">
                        {/* Stacked layered backdrop */}
                        <div className="absolute inset-6 rounded-[2.5rem] bg-white/10 backdrop-blur-sm border border-white/20 rotate-3" />
                        <div className="absolute inset-3 rounded-[2.25rem] bg-white/15 backdrop-blur-sm border border-white/25 -rotate-2" />
                        <div className="absolute inset-0 rounded-[2rem] bg-white/95 sf-shadow flex items-center justify-center overflow-hidden">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,hsl(var(--storefront-soft)),transparent_60%)]" />
                          <Package className="h-32 w-32 text-foreground/15" strokeWidth={1.1} />
                          <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{s.product.categoryName}</p>
                              <p className="text-sm font-bold text-foreground line-clamp-1 max-w-[200px]">{s.product.name}</p>
                            </div>
                            <span className="text-xs font-bold text-foreground bg-storefront-soft px-2.5 py-1 rounded-full">
                              {price}
                            </span>
                          </div>
                        </div>

                        {/* Floating badges */}
                        <div className="absolute -top-3 -left-3 px-3 py-1.5 rounded-full bg-storefront-accent text-white text-xs font-bold shadow-lg animate-fade-in">
                          {s.badge.label}
                        </div>
                        <div className="absolute -bottom-3 -right-3 px-3 py-1.5 rounded-full bg-storefront-gold text-white text-xs font-bold shadow-lg">
                          Hot #{idx + 1}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10">
                    <div
                      key={`${idx}-${selected === idx}-${isHover}`}
                      className={cn(
                        "h-full bg-white/80",
                        selected === idx && !isHover ? "animate-[hero-progress_5500ms_linear_forwards]" : "w-0"
                      )}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <button
        onClick={() => emblaApi?.scrollPrev()}
        aria-label="Slide trước"
        className="hidden md:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/15 backdrop-blur border border-white/25 text-white items-center justify-center hover:bg-white/25 transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => emblaApi?.scrollNext()}
        aria-label="Slide sau"
        className="hidden md:flex absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/15 backdrop-blur border border-white/25 text-white items-center justify-center hover:bg-white/25 transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Pagination */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            aria-label={`Đi tới slide ${i + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === selected ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
            )}
          />
        ))}
      </div>
    </section>
  );
}
