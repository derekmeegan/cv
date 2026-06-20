"use client";

import * as React from "react";
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  markUserInteracted: () => void;
  hasUserInteracted: boolean;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

/* Carousel swipe hint
 *
 *    0ms   carousel viewport enters the screen
 * 3000ms   visible track nudges left to reveal horizontal movement
 * 3820ms   track returns to its original position
 * 13000ms  repeat the hint if the carousel remains in view
 */
const SWIPE_HINT = {
  delayMs: 3000,
  durationMs: 820,
  repeatDelayMs: 10000,
  distance: "-0.875rem",
  intersectionThreshold: 0.55,
} as const;

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins,
    );
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);
    const [hasUserInteracted, setHasUserInteracted] = React.useState(false);

    const markUserInteracted = React.useCallback(() => {
      setHasUserInteracted(true);
    }, []);

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) {
        return;
      }

      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    }, []);

    const scrollPrev = React.useCallback(() => {
      markUserInteracted();
      api?.scrollPrev();
    }, [api, markUserInteracted]);

    const scrollNext = React.useCallback(() => {
      markUserInteracted();
      api?.scrollNext();
    }, [api, markUserInteracted]);

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          scrollNext();
        }
      },
      [scrollPrev, scrollNext],
    );

    React.useEffect(() => {
      if (!api || !setApi) {
        return;
      }

      setApi(api);
    }, [api, setApi]);

    React.useEffect(() => {
      if (!api) {
        return;
      }

      onSelect(api);
      api.on("reInit", onSelect);
      api.on("select", onSelect);

      return () => {
        api?.off("select", onSelect);
      };
    }, [api, onSelect]);

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api,
          opts,
          orientation,
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
          markUserInteracted,
          hasUserInteracted,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  },
);
Carousel.displayName = "Carousel";

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => {
  const {
    carouselRef,
    api,
    orientation,
    canScrollNext,
    markUserInteracted,
    hasUserInteracted,
  } = useCarousel();
  const [viewportElement, setViewportElement] =
    React.useState<HTMLDivElement | null>(null);
  const [shouldShowSwipeHint, setShouldShowSwipeHint] = React.useState(false);

  const setViewportRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      carouselRef(node);
      setViewportElement(node);
    },
    [carouselRef],
  );

  React.useEffect(() => {
    if (
      !viewportElement ||
      !canScrollNext ||
      hasUserInteracted ||
      orientation !== "horizontal"
    ) {
      setShouldShowSwipeHint(false);
      return;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (motionQuery.matches) {
      return;
    }

    let initialTimer: number | undefined;
    let repeatTimer: number | undefined;
    let endTimer: number | undefined;

    function clearSwipeHintTimers() {
      window.clearTimeout(initialTimer);
      window.clearTimeout(repeatTimer);
      window.clearTimeout(endTimer);
    }

    function showSwipeHint() {
      setShouldShowSwipeHint(false);
      window.requestAnimationFrame(() => {
        setShouldShowSwipeHint(true);
      });

      endTimer = window.setTimeout(() => {
        setShouldShowSwipeHint(false);
      }, SWIPE_HINT.durationMs);
      repeatTimer = window.setTimeout(showSwipeHint, SWIPE_HINT.repeatDelayMs);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          !entry?.isIntersecting ||
          entry.intersectionRatio < SWIPE_HINT.intersectionThreshold
        ) {
          clearSwipeHintTimers();
          setShouldShowSwipeHint(false);
          return;
        }

        clearSwipeHintTimers();
        initialTimer = window.setTimeout(() => {
          showSwipeHint();
        }, SWIPE_HINT.delayMs);
      },
      { threshold: SWIPE_HINT.intersectionThreshold },
    );

    observer.observe(viewportElement);

    return () => {
      observer.disconnect();
      clearSwipeHintTimers();
    };
  }, [canScrollNext, hasUserInteracted, orientation, viewportElement]);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    api.on("pointerDown", markUserInteracted);

    return () => {
      api.off("pointerDown", markUserInteracted);
    };
  }, [api, markUserInteracted]);

  const swipeHintStyle = {
    ...style,
    "--carousel-swipe-hint-distance": SWIPE_HINT.distance,
    "--carousel-swipe-hint-duration": String(SWIPE_HINT.durationMs) + "ms",
  } as React.CSSProperties;

  return (
    <div
      ref={setViewportRefs}
      onPointerDown={markUserInteracted}
      onKeyDown={markUserInteracted}
      onWheel={markUserInteracted}
      className={cn(
        "overflow-hidden",
        orientation === "horizontal" ? "touch-pan-y" : "touch-pan-x",
      )}
      style={{
        touchAction:
          orientation === "horizontal"
            ? "pan-y pinch-zoom"
            : "pan-x pinch-zoom",
      }}
    >
      <div
        ref={ref}
        className={cn(
          "flex select-none",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          shouldShowSwipeHint && "carousel-swipe-hint",
          className,
        )}
        style={swipeHintStyle}
        {...props}
      />
    </div>
  );
});
CarouselContent.displayName = "CarouselContent";

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel();

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className,
      )}
      {...props}
    />
  );
});
CarouselItem.displayName = "CarouselItem";

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  if (!canScrollPrev) {
    return null;
  }

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="size-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
});
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel();

  if (!canScrollNext) {
    return null;
  }

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="size-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  );
});
CarouselNext.displayName = "CarouselNext";

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
