"use client";

import * as React from "react";
import { startTransition, ViewTransition } from "react";
import { ExternalLink } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { BOOK_STACKS } from "@/constants/books";
import { cn } from "@/lib/utils";
import type { Book, BookStack } from "@/types/books";

interface SelectedBook {
  stackId: string;
  book: Book;
}

const TIMING = {
  spineMs: 220,
  bookSwapMs: 430,
} as const;

const MOTION = {
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  hoverPull: 10,
} as const;

const COVER = {
  width: 228,
  height: 288,
  depth: 18,
  radius: 6,
  tiltX: 3,
  tiltY: -8,
} as const;

const PAGE_EDGE_BACKGROUND =
  "repeating-linear-gradient(90deg, #fbf7ea 0 3px, #e8deca 3px 4px)";

const SPINE_SIZE = {
  minLength: 176,
  maxLength: 282,
  minThickness: 24,
  maxThickness: 58,
} as const;

const BOOKS_PER_STACK = 7;
const STACK_OFFSETS = [-2, 1, -1, 3, -3, 2, 0] as const;

const WORD_COUNT_RANGE = BOOK_STACKS.flatMap((stack) =>
  stack.books.map((book) => book.wordCount),
).reduce(
  (range, wordCount) => ({
    min: Math.min(range.min, wordCount),
    max: Math.max(range.max, wordCount),
  }),
  { min: Number.POSITIVE_INFINITY, max: 0 },
);

function bookTransitionName(book: Book) {
  return `book-${book.id}`;
}

function spineTransform(book: Book, isHovered: boolean) {
  const stackOffset = book.offset * 8;
  const pull = isHovered ? MOTION.hoverPull : 0;

  return `translate3d(${stackOffset + pull}px, 0, 0)`;
}

function wordCountScale(wordCount: number) {
  const range = WORD_COUNT_RANGE.max - WORD_COUNT_RANGE.min;

  if (!range) {
    return 0;
  }

  return (wordCount - WORD_COUNT_RANGE.min) / range;
}

function spineSize(book: Book) {
  const scale = wordCountScale(book.wordCount);

  return {
    width:
      SPINE_SIZE.minLength +
      (SPINE_SIZE.maxLength - SPINE_SIZE.minLength) * scale,
    height:
      SPINE_SIZE.minThickness +
      (SPINE_SIZE.maxThickness - SPINE_SIZE.minThickness) * scale,
  };
}

function stackHeight(books: Book[]) {
  const totalBookHeight = books.reduce(
    (height, book) => height + spineSize(book).height,
    0,
  );

  return totalBookHeight - (books.length - 1);
}

function balanceBookStacks(stacks: BookStack[]) {
  const balancedStacks = Array.from(
    { length: stacks.length },
    () => [] as Book[],
  );
  const books = stacks
    .flatMap((stack) => stack.books)
    .sort((a, b) => spineSize(b).height - spineSize(a).height);

  for (const book of books) {
    const shortestAvailableStack = balancedStacks
      .filter((stack) => stack.length < BOOKS_PER_STACK)
      .sort((a, b) => stackHeight(a) - stackHeight(b))[0];

    shortestAvailableStack.push(book);
  }

  return balancedStacks.map((books, index) => ({
    id: `balanced-stack-${index + 1}`,
    label: `Stack ${index + 1}`,
    books: [...books]
      .sort((a, b) => spineSize(a).height - spineSize(b).height)
      .map((book, bookIndex) => ({
        ...book,
        offset: STACK_OFFSETS[bookIndex] ?? 0,
      })),
  }));
}

const BALANCED_BOOK_STACKS = balanceBookStacks(BOOK_STACKS);

const ARROW_TOP = Math.round(
  Math.max(...BALANCED_BOOK_STACKS.map((stack) => stackHeight(stack.books))) /
    2 +
    4,
);

function BookSpine({
  book,
  isHovered,
  onHoverBook,
  onSelectBook,
}: {
  book: Book;
  isHovered: boolean;
  onHoverBook: (bookId: string | null) => void;
  onSelectBook: () => void;
}) {
  const size = spineSize(book);
  const outerRadius = Math.max(3, Math.min(7, size.height * 0.12));
  const innerRadius = outerRadius * 0.65;

  return (
    <button
      type="button"
      data-book-spine="true"
      aria-label={`${book.title} by ${book.author}`}
      className={cn(
        "relative z-0 flex shrink-0 cursor-pointer items-center justify-center overflow-hidden border border-black/15 px-3 py-2 text-left outline-none transition-[background-color,border-color,box-shadow,filter,transform] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "hover:z-20 hover:border-black/25",
      )}
      style={{
        width: size.width,
        height: size.height,
        background: book.coverGradient,
        borderRadius: outerRadius,
        boxShadow:
          "inset 0 1px rgba(255,255,255,0.44), inset 0 -1px rgba(0,0,0,0.16), 0 8px 18px rgba(15,23,42,0.08)",
        filter: isHovered
          ? "saturate(0.92) contrast(1) brightness(1.01)"
          : "saturate(0.78) contrast(0.96) brightness(1.04)",
        transform: spineTransform(book, isHovered),
        transitionDuration: `${TIMING.spineMs}ms`,
        transitionTimingFunction: MOTION.easing,
        willChange: "transform, filter",
      }}
      onClick={onSelectBook}
      onMouseEnter={() => onHoverBook(book.id)}
      onMouseLeave={() => onHoverBook(null)}
    >
      <span
        className="relative line-clamp-1 w-full overflow-hidden text-ellipsis whitespace-nowrap bg-white/65 px-2 py-1 font-mono text-xs leading-none tracking-normal text-slate-900 shadow-sm ring-1 ring-black/10 backdrop-blur-[1px]"
        style={{ borderRadius: innerRadius }}
      >
        {book.title}
      </span>
    </button>
  );
}

function LibraryStack({
  stack,
  selectedBookId,
  hoveredBookId,
  onHoverBook,
  onSelectBook,
}: {
  stack: BookStack;
  selectedBookId: string | null;
  hoveredBookId: string | null;
  onHoverBook: (bookId: string | null) => void;
  onSelectBook: (stack: BookStack, book: Book) => void;
}) {
  const baseWidth = stack.books.reduce(
    (width, book) => Math.max(width, spineSize(book).width),
    0,
  );

  return (
    <div className="relative min-h-[18rem] overflow-visible px-1 pb-2 pt-0">
      <div className="flex min-h-[18rem] items-end justify-center pb-3 pt-2">
        <div className="flex w-full max-w-sm flex-col items-center justify-end">
          {stack.books.map((book, index) => {
            const size = spineSize(book);
            const isSelected = selectedBookId === book.id;

            if (isSelected) {
              return (
                <div
                  key={book.id}
                  aria-hidden="true"
                  className={cn("shrink-0", index > 0 && "-mt-px")}
                  style={{
                    width: size.width,
                    height: size.height,
                    transform: spineTransform(book, false),
                  }}
                />
              );
            }

            return (
              <ViewTransition
                key={book.id}
                name={bookTransitionName(book)}
                share="morph"
                default="none"
              >
                <div className={cn(index > 0 && "-mt-px")}>
                  <BookSpine
                    book={book}
                    isHovered={hoveredBookId === book.id}
                    onHoverBook={onHoverBook}
                    onSelectBook={() => onSelectBook(stack, book)}
                  />
                </div>
              </ViewTransition>
            );
          })}
          <div
            aria-hidden="true"
            className="mt-2 shrink-0 rounded-[50%] bg-slate-950/25 blur-md"
            style={{ width: baseWidth * 0.92, height: 14 }}
          />
        </div>
      </div>
    </div>
  );
}

function SelectedBookCover({
  selected,
  coverRef,
}: {
  selected: SelectedBook | null;
  coverRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (!selected) {
    return null;
  }

  const { book } = selected;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center px-4 py-10 [perspective:1100px]">
      <ViewTransition
        name={bookTransitionName(book)}
        share="morph"
        default="none"
      >
        <div
          ref={coverRef}
          className="pointer-events-auto relative text-slate-950 [filter:drop-shadow(0_22px_30px_rgba(15,23,42,0.22))] [text-shadow:0_1px_1px_rgba(255,255,255,0.45)] [transform-style:preserve-3d]"
          style={{
            width: COVER.width,
            height: COVER.height,
            transform: `rotateX(${COVER.tiltX}deg) rotateY(${COVER.tiltY}deg)`,
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-2 rounded-r-[4px] border-y border-r border-black/10 shadow-[inset_1px_0_rgba(255,255,255,0.6),inset_-5px_0_rgba(0,0,0,0.08)]"
            style={{
              width: COVER.depth,
              height: COVER.height - 14,
              background: PAGE_EDGE_BACKGROUND,
              transform: `translateX(${COVER.depth - 2}px) rotateY(82deg)`,
              transformOrigin: "left center",
            }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-2 rounded-b-[4px] border-x border-b border-black/10 shadow-[inset_0_1px_rgba(255,255,255,0.55),inset_0_-5px_rgba(0,0,0,0.08)]"
            style={{
              width: COVER.width - 8,
              height: COVER.depth,
              background: PAGE_EDGE_BACKGROUND,
              transform: `translateY(${COVER.depth - 2}px) rotateX(-82deg)`,
              transformOrigin: "center top",
            }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-2 top-0 rounded-t-[4px] border-x border-t border-black/10 opacity-70 shadow-[inset_0_-1px_rgba(0,0,0,0.05)]"
            style={{
              width: COVER.width - 10,
              height: Math.round(COVER.depth * 0.72),
              background: PAGE_EDGE_BACKGROUND,
              transform: `translateY(-${Math.round(COVER.depth * 0.7)}px) rotateX(82deg)`,
              transformOrigin: "center bottom",
            }}
          />

          <div
            className="relative flex size-full min-h-0 flex-col justify-between overflow-hidden border border-black/10 p-5 shadow-[inset_0_1px_rgba(255,255,255,0.4),inset_0_-1px_rgba(0,0,0,0.12)]"
            style={{
              background: book.coverGradient,
              borderRadius: COVER.radius,
              transform: `translateZ(${Math.round(COVER.depth * 0.72)}px)`,
            }}
          >
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.42),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.26),transparent_46%,rgba(0,0,0,0.12)_100%)]" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0 pr-2">
                <h3 className="text-pretty text-lg font-medium leading-tight">
                  {book.title}
                </h3>
                <p className="mt-2 font-mono text-xs text-slate-900/70">
                  {book.author}
                </p>
              </div>
            </div>

            <a
              href={book.readMoreUrl}
              target="_blank"
              rel="noreferrer"
              className="relative mt-auto inline-flex items-center gap-1 self-end font-mono text-xs text-slate-900/75 underline underline-offset-4 hover:text-slate-950"
            >
              Read more
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      </ViewTransition>
    </div>
  );
}

export function Library() {
  const [selected, setSelected] = React.useState<SelectedBook | null>(null);
  const [hoveredBookId, setHoveredBookId] = React.useState<string | null>(null);
  const coverRef = React.useRef<HTMLDivElement>(null);
  const pendingSelectionRef = React.useRef<SelectedBook | null>(null);
  const returnTimerRef = React.useRef<number | null>(null);

  const clearReturnTimer = React.useCallback(() => {
    if (!returnTimerRef.current) {
      return;
    }

    window.clearTimeout(returnTimerRef.current);
    returnTimerRef.current = null;
  }, []);

  const openBook = React.useCallback((selection: SelectedBook) => {
    pendingSelectionRef.current = null;
    startTransition(() => {
      setSelected(selection);
    });
  }, []);

  const returnBookToShelf = React.useCallback(
    (nextSelection?: SelectedBook) => {
      pendingSelectionRef.current = nextSelection ?? null;
      clearReturnTimer();

      startTransition(() => {
        setSelected(null);
      });

      returnTimerRef.current = window.setTimeout(() => {
        const pendingSelection = pendingSelectionRef.current;

        pendingSelectionRef.current = null;
        returnTimerRef.current = null;

        if (pendingSelection) {
          openBook(pendingSelection);
        }
      }, TIMING.bookSwapMs);
    },
    [clearReturnTimer, openBook],
  );

  const closeBook = React.useCallback(() => {
    returnBookToShelf();
  }, [returnBookToShelf]);

  React.useEffect(
    () => () => {
      pendingSelectionRef.current = null;
      clearReturnTimer();
    },
    [clearReturnTimer],
  );

  React.useEffect(() => {
    if (!selected) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      closeBook();
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (target instanceof Node && coverRef.current?.contains(target)) {
        return;
      }

      if (target instanceof Element && target.closest("[data-book-spine]")) {
        return;
      }

      closeBook();
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [closeBook, selected]);

  const selectBook = React.useCallback(
    (stack: BookStack, book: Book) => {
      const nextSelection = { stackId: stack.id, book };
      const isSameBook =
        selected?.stackId === stack.id && selected.book.id === book.id;

      setHoveredBookId(null);

      if (!selected) {
        if (returnTimerRef.current) {
          pendingSelectionRef.current = nextSelection;
          return;
        }

        openBook(nextSelection);
        return;
      }

      if (isSameBook) {
        returnBookToShelf();
        return;
      }

      returnBookToShelf(nextSelection);
    },
    [openBook, returnBookToShelf, selected],
  );

  return (
    <Carousel opts={{ align: "start" }} className="relative w-full">
      <CarouselContent>
        {BALANCED_BOOK_STACKS.map((stack) => (
          <CarouselItem
            key={stack.id}
            className="basis-full sm:basis-1/2 lg:basis-1/2"
          >
            <LibraryStack
              stack={stack}
              selectedBookId={selected?.book.id ?? null}
              hoveredBookId={hoveredBookId}
              onHoverBook={setHoveredBookId}
              onSelectBook={selectBook}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <SelectedBookCover selected={selected} coverRef={coverRef} />
      <CarouselPrevious
        className="hidden md:inline-flex"
        style={{ top: ARROW_TOP }}
      />
      <CarouselNext
        className="hidden md:inline-flex"
        style={{ top: ARROW_TOP }}
      />
    </Carousel>
  );
}
