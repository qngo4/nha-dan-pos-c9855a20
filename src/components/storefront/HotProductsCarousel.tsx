import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { products as ProductList } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Product = (typeof ProductList)[number];

export function HotProductsCarousel({ items }: { items: Product[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
    containScroll: "trimSnaps",
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  // Auto-play
  useEffect(() => {
    if (!emblaApi) return;
    const id = window.setInterval(() => {
      if (!emblaApi) return;
      if (document.hidden) return;
      emblaApi.scrollNext();
    }, 4000);
    return () => window.clearInterval(id);
  }, [emblaApi]);

  if (!items.length) return null;

  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex -ml-3 md:-ml-4">
          {items.map((p) => (
            <div
              key={p.id}
              className="pl-3 md:pl-4 shrink-0 grow-0 basis-1/2 sm:basis-1/3 lg:basis-1/4 xl:basis-1/5"
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <button
        onClick={() => emblaApi?.scrollPrev()}
        disabled={!canPrev}
        aria-label="Trước"
        className={cn(
          "hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-card border shadow-md items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => emblaApi?.scrollNext()}
        disabled={!canNext}
        aria-label="Sau"
        className={cn(
          "hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-card border shadow-md items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
