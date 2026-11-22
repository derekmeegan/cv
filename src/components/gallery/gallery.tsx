"use client";

import * as React from "react";
import { startTransition, ViewTransition } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";

import { Framed } from "@/components/gallery/framed";
import type { Hung, Wall } from "@/lib/gallery-layout";
import { cn } from "@/lib/utils";
import type { Piece } from "@/types/gallery";

/** Two hanging plans are rendered; CSS shows the one that suits the width. */
type Variant = "wide" | "narrow";

interface Selection {
  id: string;
  variant: Variant;
}

const WIDE_QUERY = "(min-width: 900px)";

const MUSEUM_SHORT: Record<string, string> = {
  "The Metropolitan Museum of Art": "The Met",
  "Barnes Foundation": "the Barnes",
  "Philadelphia Museum of Art": "the PMA",
  "J. Paul Getty Museum": "the Getty",
  "de Young": "the de Young",
  "Legion of Honor": "the Legion of Honor",
};

function transitionName(variant: Variant, id: string) {
  return `gal-${variant}-${id}`;
}

/** `sizes` for a picture `width` wall units wide (see --u in gallery.css). */
function wallSizes(variant: Variant, width: number) {
  return variant === "wide"
    ? `(max-width: 1200px) ${Math.ceil(width * 0.78)}px, ${Math.ceil(width * 1.25)}px`
    : `(max-width: 480px) ${Math.ceil(width * 0.62)}px, ${Math.ceil(width * 1.25)}px`;
}

const DETAIL_SIZES = "(max-width: 900px) 92vw, 62vw";

function vars(values: Record<string, number | string>) {
  return values as React.CSSProperties;
}

function trim(n: number) {
  return Number(n.toFixed(1)).toString();
}

/** "Models (Poseuses)" → the title, and its original-language alternative. */
function splitTitle(title: string) {
  const match = title.match(/^(.{3,}?)\s*\(([^()]+)\)$/);
  return match
    ? { main: match[1], also: match[2] }
    : { main: title, also: null };
}

function sizeText(piece: Piece) {
  if (!piece.heightCm || !piece.widthCm) return piece.dimensions;
  const inches = (cm: number) => trim(cm / 2.54);
  return `${trim(piece.heightCm)} × ${trim(piece.widthCm)} cm (${inches(piece.heightCm)} × ${inches(piece.widthCm)} in.)`;
}

function WallView({
  wall,
  variant,
  pieces,
  selection,
  onOpen,
}: {
  wall: Wall;
  variant: Variant;
  pieces: Map<string, Piece>;
  selection: Selection | null;
  onOpen: (hung: Hung, variant: Variant) => void;
}) {
  return (
    <section className="gal-wall" aria-label="The wall">
      <div className="gal-cove" aria-hidden="true" />
      <div className="gal-rail" aria-hidden="true" />
      <div className="gal-burlap">
        <div
          className="gal-hang"
          style={vars({ "--wall-w": wall.width, "--wall-h": wall.height })}
        >
          {wall.pieces.map((hung) => {
            const piece = pieces.get(hung.id);
            if (!piece) return null;
            const box = vars({
              "--x": hung.x,
              "--y": hung.y,
              "--w": hung.w,
              "--h": hung.h,
            });
            const away =
              selection?.id === piece.id && selection.variant === variant;

            // While a picture is being looked at, its place on the wall is
            // left empty.
            if (away) {
              return (
                <span
                  key={piece.id}
                  className="gal-piece gal-piece--away"
                  style={box}
                  aria-hidden="true"
                />
              );
            }

            return (
              <ViewTransition
                key={piece.id}
                name={transitionName(variant, piece.id)}
                share="gal-morph"
                default="none"
              >
                <button
                  type="button"
                  className="gal-piece"
                  style={box}
                  data-piece={piece.id}
                  title={`${piece.artist} — ${piece.title}`}
                  aria-label={`${piece.title} by ${piece.artist}. Open details.`}
                  onClick={() => onOpen(hung, variant)}
                >
                  <Framed
                    piece={piece}
                    bw={hung.bw}
                    pw={hung.pw}
                    ph={hung.ph}
                    sizes={wallSizes(variant, hung.w)}
                  />
                </button>
              </ViewTransition>
            );
          })}
        </div>
      </div>
      <div className="gal-base" aria-hidden="true" />
      <div className="gal-floor" aria-hidden="true" />
    </section>
  );
}

/**
 * The text about a piece: my own note, or the museum's description with its
 * name under it. Long descriptions open on their first paragraph.
 */
function About({ text, from }: { text: string; from: string | null }) {
  const paragraphs = text.split(/\n{2,}/);
  const [open, setOpen] = React.useState(false);
  const long = paragraphs.length > 1 && text.length > 700;
  const shown = long && !open ? paragraphs.slice(0, 1) : paragraphs;

  return (
    <div className="gal-about">
      {shown.map((paragraph) => (
        <p key={paragraph.slice(0, 40)}>{paragraph}</p>
      ))}
      {long ? (
        <button
          type="button"
          className="gal-more"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? "Show less" : "Read more"}
        </button>
      ) : null}
      {from ? <p className="gal-attribution">— {from}</p> : null}
    </div>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <div className="gal-fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Focus({
  piece,
  hung,
  variant,
  position,
  total,
  onClose,
  onStep,
}: {
  piece: Piece;
  hung: Hung;
  variant: Variant;
  position: number;
  total: number;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const text = piece.about ?? piece.description;
  const title = splitTitle(piece.title);
  const where = MUSEUM_SHORT[piece.museum] ?? piece.museum;

  React.useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <>
      <ViewTransition enter="gal-veil-in" exit="gal-veil-out" default="none">
        <div className="gal-veil" onClick={onClose} aria-hidden="true" />
      </ViewTransition>
      {/* The panel arrives as one piece; the picture inside it travels
          separately, from its place on the wall. */}
      <ViewTransition enter="gal-info-in" exit="gal-info-out" default="none">
        <div
          className="gal-focus"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gal-focus-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <div
            className="gal-stage"
            style={vars({ "--w": hung.w, "--h": hung.h })}
            onClick={(event) => {
              if (event.target === event.currentTarget) onClose();
            }}
          >
            <ViewTransition
              key={piece.id}
              name={transitionName(variant, piece.id)}
              share="gal-morph"
              default="none"
            >
              <div className="gal-stage__piece">
                <Framed
                  piece={piece}
                  bw={hung.bw}
                  pw={hung.pw}
                  ph={hung.ph}
                  sizes={wallSizes(variant, hung.w)}
                  detailSizes={DETAIL_SIZES}
                />
              </div>
            </ViewTransition>
          </div>

          <aside className="gal-info">
            <p className="gal-eyebrow">
              {piece.museum}
              <span aria-hidden="true"> · </span>
              {piece.city}
            </p>
            <h2 id="gal-focus-title" className="gal-title">
              {title.main}
            </h2>
            {title.also ? <p className="gal-also">{title.also}</p> : null}
            <p className="gal-artist">
              {piece.artist}
              {piece.date ? (
                <span className="gal-date">{piece.date}</span>
              ) : null}
            </p>

            {text ? (
              <About
                key={piece.id}
                text={text}
                from={piece.about ? null : piece.museum}
              />
            ) : null}

            <dl className="gal-facts">
              <Fact label="Artist">{piece.artistBio}</Fact>
              <Fact label="Medium">{piece.medium}</Fact>
              <Fact label="Size">{sizeText(piece)}</Fact>
              <Fact label="On view">{piece.location}</Fact>
              <Fact label="Credit">{piece.creditLine}</Fact>
              <Fact label="Object no.">{piece.accession}</Fact>
              <Fact label="Frame">
                {piece.framed
                  ? "The museum’s own frame, from its photograph"
                  : null}
              </Fact>
            </dl>

            <div className="gal-actions">
              <a
                className="gal-link"
                href={piece.url}
                target="_blank"
                rel="noreferrer"
              >
                View at {where}
                <ArrowUpRight aria-hidden="true" />
              </a>
              <div className="gal-pager">
                <button
                  type="button"
                  aria-label="Previous piece"
                  onClick={() => onStep(-1)}
                >
                  <ChevronLeft aria-hidden="true" />
                </button>
                <span aria-live="polite">
                  {position + 1} of {total}
                </span>
                <button
                  type="button"
                  aria-label="Next piece"
                  onClick={() => onStep(1)}
                >
                  <ChevronRight aria-hidden="true" />
                </button>
              </div>
            </div>
            {piece.imageCredit ? (
              <p className="gal-credit">Image: {piece.imageCredit}</p>
            ) : null}
          </aside>

          <button
            ref={closeRef}
            type="button"
            className="gal-close"
            aria-label="Close"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </div>
      </ViewTransition>
    </>
  );
}

export interface GalleryPlans {
  wide: Wall;
  narrow: Wall;
}

export function Gallery({
  pieces,
  plans,
}: {
  pieces: Piece[];
  /** Hanging plans, worked out on the server (see gallery-layout.ts). */
  plans: GalleryPlans;
}) {
  const byId = React.useMemo(
    () => new Map(pieces.map((piece) => [piece.id, piece])),
    [pieces],
  );
  // Reading order for stepping through, as the hanging plan lists them.
  const order = React.useMemo(
    () => ({ wide: plans.wide.pieces, narrow: plans.narrow.pieces }),
    [plans],
  );

  const [selection, setSelection] = React.useState<Selection | null>(null);
  const previous = React.useRef<Selection | null>(null);

  const open = React.useCallback((hung: Hung, variant: Variant) => {
    startTransition(() => setSelection({ id: hung.id, variant }));
  }, []);

  const close = React.useCallback(() => {
    startTransition(() => setSelection(null));
  }, []);

  const step = React.useCallback(
    (delta: number) => {
      startTransition(() =>
        setSelection((current) => {
          if (!current) return current;
          const list = order[current.variant];
          const at = list.findIndex((hung) => hung.id === current.id);
          const next = list[(at + delta + list.length) % list.length];
          return { ...current, id: next.id };
        }),
      );
    },
    [order],
  );

  // Open the piece named in the URL (#id), so a picture can be linked to.
  React.useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id || !byId.has(id)) return;
    const variant: Variant = window.matchMedia(WIDE_QUERY).matches
      ? "wide"
      : "narrow";
    setSelection({ id, variant });
  }, [byId]);

  // Keep the URL, the page scroll and keyboard focus in step with what is
  // being looked at.
  React.useEffect(() => {
    const was = previous.current;
    previous.current = selection;
    document.documentElement.classList.toggle("gal-locked", Boolean(selection));
    if (!selection && !was) return;

    // Straight to the browser's own history: this is not a navigation, and
    // Next's patched replaceState would route it through the router.
    History.prototype.replaceState.call(
      window.history,
      window.history.state,
      "",
      selection
        ? `#${selection.id}`
        : window.location.pathname + window.location.search,
    );

    // On closing, hand focus back to the picture's place on the wall.
    if (!selection && was) {
      document
        .querySelector<HTMLElement>(
          `.gal-plan--${was.variant} [data-piece="${was.id}"]`,
        )
        ?.focus({ preventScroll: true });
    }
  }, [selection]);

  React.useEffect(
    () => () => document.documentElement.classList.remove("gal-locked"),
    [],
  );

  React.useEffect(() => {
    if (!selection) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selection, close, step]);

  const list = selection ? order[selection.variant] : [];
  const position = selection
    ? list.findIndex((hung) => hung.id === selection.id)
    : -1;
  const hung = list[position];
  const piece = selection ? byId.get(selection.id) : undefined;

  return (
    <>
      <div className="gal-room" inert={selection ? true : undefined}>
        {(["wide", "narrow"] as const).map((variant) => (
          <div key={variant} className={cn("gal-plan", `gal-plan--${variant}`)}>
            <WallView
              wall={plans[variant]}
              variant={variant}
              pieces={byId}
              selection={selection}
              onOpen={open}
            />
          </div>
        ))}
      </div>

      {selection && hung && piece ? (
        <Focus
          piece={piece}
          hung={hung}
          variant={selection.variant}
          position={position}
          total={list.length}
          onClose={close}
          onStep={step}
        />
      ) : null}
    </>
  );
}
