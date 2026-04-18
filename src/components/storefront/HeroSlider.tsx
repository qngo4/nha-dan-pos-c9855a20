import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Package, ShoppingBag, Sparkles } from "lucide-react";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { products as ProductList } from "@/lib/mock-data";

type Product = (typeof ProductList)[number];

const BADGES = [
  { label: "Top #1 · Chủ đạo", cls: "bg-storefront-gold text-white" },
  { label: "Top #2 · Bán chạy", cls: "bg-storefront-accent text-white" },
  { label: "Top #3 · Bán chạy", cls: "bg-info text-info-foreground" },
  { label: "Top #4 · Giá tốt", cls: "bg-success text-success-foreground" },
  { label: "Top #5 · Mới", cls: "bg-primary text-primary-foreground" },
];

const TAGLINES = [
  "Sản phẩm chủ đạo — luôn sẵn kho, giao nhanh trong ngày.",
  "Lựa chọn của hàng ngàn gia đình Việt mỗi tuần.",
  "Chất lượng tuyển chọn, giá niêm yết minh bạch.",
  "Hàng chính hãng, đóng gói cẩn thận, vận chuyển an toàn.",
  "Mới về — số lượng có hạn, đặt sớm để không lỡ.",
];

const ACCENTS = [
  "from-storefront-gold/30 via-storefront-accent/10 to-transparent",
  "from-storefront-accent/30 via-primary/10 to-transparent",
  "from-info/30 via-primary/10 to-transparent",
  "from-success/30 via-storefront-gold/10 to-transparent",
  "from-primary/30 via-storefront-accent/10 to-transparent",
];

export function HeroSlider({ items }: { items: Product[] }) {
  const slides = items.slice(0, 5);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    containScroll: false,
    duration: 30,
    skipSnaps: false,
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
      className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,hsl(220_45%_14%),hsl(225_40%_8%)_60%,hsl(230_45%_5%)_100%)] py-12 md:py-20"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      {/* Ambient glows */}
      <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-storefront-accent/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-storefront-gold/10 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none [background-image:linear-gradient(hsl(0_0%_100%)_1px,transparent_1px),linear-gradient(90deg,hsl(0_0%_100%)_1px,transparent_1px)] [background-size:48px_48px]" />

      {/* Header eyebrow */}
      <div className="relative max-w-7xl mx-auto px-4 mb-6 md:mb-10 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/15 text-storefront-hero-foreground/90 text-[11px] font-semibold uppercase tracking-[0.2em]">
          <Sparkles className="h-3 w-3" /> Spotlight
        </span>
        <h2 className="mt-3 text-2xl md:text-4xl font-bold tracking-tight text-storefront-hero-foreground">
          Top 5 sản phẩm chủ đạo
        </h2>
      </div>

      <div ref={emblaRef} className="overflow-hidden relative">
        <div className="flex items-stretch">
          {slides.map((p, idx) => {
            const dv = p.variants.find((v) => v.isDefault) || p.variants[0];
            const hasMulti = p.variants.length > 1;
            const minPrice = Math.min(...p.variants.map((v) => v.sellPrice));
            const price = hasMulti ? `Từ ${formatVND(minPrice)}` : formatVND(dv.sellPrice);
            const badge = BADGES[idx % BADGES.length];
            const tagline = TAGLINES[idx % TAGLINES.length];
            const accent = ACCENTS[idx % ACCENTS.length];
            const isActive = idx === selected;

            return (
              <div
                key={p.id}
                className="shrink-0 grow-0 basis-[88%] sm:basis-[70%] md:basis-[62%] lg:basis-[56%] xl:basis-[50%] px-3 md:px-4"
              >
                <div
                  className={cn(
                    "group relative rounded-3xl border overflow-hidden transition-all duration-500 ease-out",
                    "bg-gradient-to-br backdrop-blur-md",
                    accent,
                    isActive
                      ? "scale-100 opacity-100 border-white/25 shadow-[0_30px_80px_-20px_hsl(0_0%_0%/0.6)]"
                      : "scale-[0.88] opacity-40 border-white/10 blur-[1px]"
                  )}
                >
                  <div className="absolute inset-0 bg-[hsl(225_40%_10%/0.55)]" />
                  <div className="relative grid md:grid-cols-2 gap-6 md:gap-8 p-6 md:p-10 min-h-[440px] md:min-h-[480px] items-center">
                    {/* Visual */}
                    <div className="relative order-1 md:order-2">
                      <div className="relative aspect-square max-w-[360px] mx-auto">
                        <div className="absolute inset-6 rounded-[2.5rem] bg-white/10 border border-white/15 rotate-3" />
                        <div className="absolute inset-3 rounded-[2.25rem] bg-white/15 border border-white/20 -rotate-2" />
                        <div className="absolute inset-0 rounded-[2rem] bg-white/95 sf-shadow flex items-center justify-center overflow-hidden">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,hsl(var(--storefront-soft)),transparent_60%)]" />
                          <Package className="h-28 w-28 text-foreground/15" strokeWidth={1.1} />
                        </div>
                        <div className={cn("absolute -top-3 -left-3 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-lg", badge.cls)}>
                          {badge.label}
                        </div>
                      </div>
                    </div>

                    {/* Copy */}
                    <div
                      className={cn(
                        "order-2 md:order-1 text-storefront-hero-foreground transition-all duration-700",
                        isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                      )}
                    >
                      <p className="text-[11px] uppercase tracking-[0.2em] opacity-70 font-semibold">
                        {p.categoryName}
                      </p>
                      <h3 className="mt-2 text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.1]">
                        {p.name}
                      </h3>
                      <p className="mt-3 text-sm md:text-base opacity-85 leading-relaxed max-w-md">
                        {tagline}
                      </p>

                      <div className="mt-5">
                        <p className="text-[10px] uppercase tracking-wider opacity-60">Giá bán</p>
                        <p className="text-2xl md:text-3xl font-bold">{price}</p>
                        <p className="text-[11px] opacity-60 mt-0.5">/ {dv.sellUnit}</p>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                          to={`/products/${p.id}`}
                          className="inline-flex items-center gap-2 bg-white text-foreground px-5 py-3 rounded-full text-sm font-semibold hover:bg-white/90 transition-colors shadow-lg"
                        >
                          <ShoppingBag className="h-4 w-4" /> Mua ngay
                        </Link>
                        <Link
                          to={`/products/${p.id}`}
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold border border-white/30 text-storefront-hero-foreground hover:bg-white/10 transition-colors"
                        >
                          Chi tiết <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Active progress bar */}
                  {isActive && (
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10">
                      <div
                        key={`${idx}-${isHover}`}
                        className={cn(
                          "h-full bg-white/80",
                          !isHover ? "animate-[hero-progress_5500ms_linear_forwards]" : "w-0"
                        )}
                      />
                    </div>
                  )}
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
        className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/15 backdrop-blur border border-white/25 text-storefront-hero-foreground items-center justify-center hover:bg-white/25 transition-colors z-10"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => emblaApi?.scrollNext()}
        aria-label="Slide sau"
        className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/15 backdrop-blur border border-white/25 text-storefront-hero-foreground items-center justify-center hover:bg-white/25 transition-colors z-10"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Pagination */}
      <div className="relative mt-8 flex items-center justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            aria-label={`Đi tới slide ${i + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === selected ? "w-8 bg-white" : "w-2 bg-white/30 hover:bg-white/60"
            )}
          />
        ))}
      </div>
    </section>
  );
}
