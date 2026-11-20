"use client";

import * as React from "react";
import { startTransition, ViewTransition } from "react";
import { ExternalLink, X } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { BOOK_STACKS } from "@/constants/books";
import { BOOK_ARTWORK } from "@/constants/book-artwork";
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
  hoverPull: 5,
} as const;

const COVER = {
  width: 236,
  height: 320,
} as const;

const SPINE_SIZE = {
  minLength: 190,
  maxLength: 282,
  minThickness: 24,
  maxThickness: 56,
} as const;

const STACK_GAP = 3;

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

function hashString(value: string) {
  return Array.from(value).reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );
}

function spineTransform(book: Book, isHovered: boolean) {
  const stackOffset = book.offset * 4;
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
  const trimVariance = (hashString(book.id) % 17) - 8;

  return {
    width:
      SPINE_SIZE.minLength +
      (SPINE_SIZE.maxLength - SPINE_SIZE.minLength) * scale +
      trimVariance,
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

  return totalBookHeight + (books.length - 1) * STACK_GAP;
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

const MAX_STACK_HEIGHT = Math.max(
  ...BALANCED_BOOK_STACKS.map((stack) => stackHeight(stack.books)),
);

// Keep every stack on the same baseline with room for the selected cover.
const STACK_MIN_HEIGHT = Math.max(COVER.height + 24, MAX_STACK_HEIGHT + 64);
const ARROW_TOP = Math.round(STACK_MIN_HEIGHT - 24 - MAX_STACK_HEIGHT / 2);

function BookMark({ book }: { book: Book }) {
  const artwork = BOOK_ARTWORK[book.id] ?? BOOK_ARTWORK["tao-te-ching"];

  return (
    <>
      <path d={artwork.wash} fill="currentColor" opacity="0.1" />
      <path
        d={artwork.outline}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.65"
      />
    </>
  );
}

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

  return (
    <button
      type="button"
      data-book-spine="true"
      aria-label={`${book.title} by ${book.author}`}
      className="book-spine relative flex shrink-0 cursor-pointer items-center gap-2.5 overflow-hidden rounded-[3px] px-3 text-left text-[#474a46] outline-none transition-transform focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-[#7c8977] focus-visible:ring-offset-2"
      style={
        {
          width: size.width,
          height: size.height,
          backgroundColor: book.coverColor,
          transform: spineTransform(book, isHovered),
          transitionDuration: `${TIMING.spineMs}ms`,
          transitionTimingFunction: MOTION.easing,
          "--spine-offset": `${book.offset * 4}px`,
        } as React.CSSProperties
      }
      onClick={onSelectBook}
      onMouseEnter={() => onHoverBook(book.id)}
      onMouseLeave={() => onHoverBook(null)}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        className="size-[19px] shrink-0 text-[#687363]"
      >
        <BookMark book={book} />
      </svg>
      <span className="min-w-0 flex-1 truncate font-serif text-[13px] font-normal leading-none">
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
  return (
    <div
      className="relative flex items-end justify-center px-1 pb-6 pt-8"
      style={{ minHeight: STACK_MIN_HEIGHT }}
    >
      <div className="flex w-full max-w-sm flex-col items-center justify-end">
        {stack.books.map((book, index) => {
          const size = spineSize(book);
          const isSelected = selectedBookId === book.id;

          if (isSelected) {
            return (
              <div
                key={book.id}
                aria-hidden="true"
                className="shrink-0"
                style={{
                  width: size.width,
                  height: size.height,
                  marginTop: index > 0 ? STACK_GAP : 0,
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
              <div style={{ marginTop: index > 0 ? STACK_GAP : 0 }}>
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
      </div>
    </div>
  );
}

function CoverArtwork({ book }: { book: Book }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 160 96"
      className="my-4 min-h-12 w-full flex-1 text-[#687363]"
      fill="none"
    >
      {book.id === "tao-te-ching" ? (
        <>
          <circle cx="80" cy="43" r="30" fill="currentColor" opacity="0.09" />
          <circle cx="80" cy="43" r="22" stroke="currentColor" opacity="0.45" />
          <path d="M28 70h104M40 79h80" stroke="currentColor" opacity="0.35" />
        </>
      ) : (
        <g transform="translate(48 16) scale(2)">
          <BookMark book={book} />
        </g>
      )}
    </svg>
  );
}

function SelectedBookCover({
  selected,
  coverRef,
  onClose,
}: {
  selected: SelectedBook | null;
  coverRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}) {
  if (!selected) {
    return null;
  }

  const { book } = selected;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center px-4">
      <ViewTransition
        name={bookTransitionName(book)}
        share="morph"
        default="none"
      >
        <div
          ref={coverRef}
          className="pointer-events-auto relative flex flex-col rounded-[4px] p-6 text-[#474a46] shadow-[0_12px_40px_rgba(48,53,44,0.12)] ring-1 ring-black/5"
          style={{
            width: COVER.width,
            minHeight: COVER.height,
            backgroundColor: book.coverColor,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Return book to shelf"
            className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full text-[#474a46]/60 transition-colors hover:text-[#474a46] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <X className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
          </button>
          <h3 className="text-pretty pr-2 font-serif text-2xl font-normal leading-[1.15] tracking-tight">
            {book.title}
          </h3>
          <p className="mt-3 font-mono text-[11px] leading-relaxed">
            {book.author}
          </p>
          <p className="mt-1 font-mono text-[10px] text-[#61665e]">
            {book.publishedYear}
          </p>
          <CoverArtwork book={book} />
          <a
            href={book.readMoreUrl}
            target="_blank"
            rel="noreferrer"
            className="decoration-current/30 mt-auto inline-flex items-center gap-1.5 self-start font-mono text-[11px] underline underline-offset-4 transition-colors hover:decoration-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Read more
            <ExternalLink
              className="size-3"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </a>
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
      <SelectedBookCover
        selected={selected}
        coverRef={coverRef}
        onClose={closeBook}
      />
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
