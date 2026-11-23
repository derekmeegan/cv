"use client";

import * as React from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";

import { Framed } from "@/components/gallery/framed";
import { Ironwork } from "@/components/gallery/ironwork";
import type { Hung, Wall } from "@/lib/gallery-layout";
import { cn } from "@/lib/utils";
import type { Piece } from "@/types/gallery";

/** Two hanging plans are rendered; CSS shows the one that suits the width. */
type Variant = "wide" | "narrow";
const VARIANTS = ["wide", "narrow"] as const;

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

/** `sizes` for a picture `width` wall units wide (see --u in gallery.css). */
function wallSizes(variant: Variant, width: number) {
  return variant === "wide"
    ? `(max-width: 1200px) ${Math.ceil(width * 0.75)}px, ${Math.ceil(width * 1.1)}px`
    : `${Math.ceil(width * 0.62)}px`;
}

function vars(values: Record<string, number | string>) {
  return values as React.CSSProperties;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

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

/**
 * Where to put the camera so that a piece fills one side of the screen (the
 * upper half on a phone): a translate-and-scale for the whole wall, about
 * its top-left corner. This is the "walking up to it": nothing is lifted off
 * the wall, the wall comes to you.
 */
function cameraFor(hang: HTMLElement, wall: Wall, hung: Hung) {
  const parent = hang.offsetParent as HTMLElement | null;
  if (!parent) return null;
  // The parent is never transformed, so this is the wall at rest.
  const base = parent.getBoundingClientRect();
  const ox = base.left + parent.clientLeft + hang.offsetLeft;
  const oy = base.top + parent.clientTop + hang.offsetTop;
  const u = hang.offsetWidth / wall.width;
  const w = hung.w * u;
  const h = hung.h * u;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const wide = window.matchMedia(WIDE_QUERY).matches;
  // the part of the screen the piece gets; the label has the rest
  const stage = wide
    ? {
        w: vw - clamp(vw * 0.36, 360, 540),
        h: vh,
        padX: vw * 0.045,
        padY: vh * 0.07,
      }
    : { w: vw, h: vh * 0.5, padX: 20, padY: 24 };

  const scale = Math.min(
    (stage.w - 2 * stage.padX) / w,
    (stage.h - 2 * stage.padY) / h,
  );
  const left = (stage.w - w * scale) / 2;
  const top = (stage.h - h * scale) / 2 + (wide ? 0 : 6);
  const dx = left - ox - hung.x * u * scale;
  const dy = top - oy - hung.y * u * scale;
  return `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${scale.toFixed(4)})`;
}

function WallView({
  wall,
  variant,
  pieces,
  selection,
  camera,
  seen,
  hangRef,
  onOpen,
  onLinger,
}: {
  wall: Wall;
  variant: Variant;
  pieces: Map<string, Piece>;
  selection: Selection | null;
  camera: string | null;
  /** Pieces that have been looked at or lingered on: these get sharp images. */
  seen: Set<string>;
  hangRef: React.RefObject<HTMLDivElement | null>;
  onOpen: (id: string, variant: Variant) => void;
  onLinger: (id: string | null) => void;
}) {
  const active = selection?.variant === variant ? selection.id : null;

  return (
    <section className="gal-wall" aria-label="Gallery">
      <div className="gal-space">
        <div
          ref={hangRef}
          className="gal-hang"
          data-near={active ? "" : undefined}
          style={{
            ...vars({ "--wall-w": wall.width, "--wall-h": wall.height }),
            transform: active && camera ? camera : undefined,
          }}
        >
          {wall.ironwork.map((iron, i) => (
            <Ironwork
              key={`${iron.kind}-${i}`}
              kind={iron.kind}
              flip={iron.flip}
              style={vars({
                "--x": iron.x,
                "--y": iron.y,
                "--w": iron.w,
                "--h": iron.h,
              })}
            />
          ))}
          <span className="gal-shade" aria-hidden="true" />
          {wall.pieces.map((hung) => {
            const piece = pieces.get(hung.id);
            if (!piece) return null;
            return (
              <button
                key={piece.id}
                type="button"
                className="gal-piece"
                data-piece={piece.id}
                data-chosen={active === piece.id ? "" : undefined}
                style={vars({
                  "--x": hung.x,
                  "--y": hung.y,
                  "--w": hung.w,
                  "--h": hung.h,
                })}
                aria-label={`${piece.title} by ${piece.artist}. Step closer.`}
                onClick={() => onOpen(piece.id, variant)}
                onPointerEnter={() => onLinger(piece.id)}
                onPointerLeave={() => onLinger(null)}
              >
                <Framed
                  piece={piece}
                  bw={hung.bw}
                  pw={hung.pw}
                  ph={hung.ph}
                  sizes={wallSizes(variant, hung.w)}
                  closeUp={seen.has(piece.id)}
                />
              </button>
            );
          })}
        </div>
      </div>
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

/**
 * The label: what you read standing next to the piece.
 *
 * The controls never move — stepping from one piece to the next must not
 * make them jump about with the length of the text — so they sit in a bar
 * outside the part that scrolls: at the foot of the label on a desktop,
 * directly under the piece on a phone (the CSS places it; see
 * .gal-label__bar).
 */
function Label({
  piece,
  position,
  total,
  onStep,
}: {
  piece: Piece;
  position: number;
  total: number;
  onStep: (delta: number) => void;
}) {
  const text = piece.about ?? piece.description;
  const title = splitTitle(piece.title);
  const where = MUSEUM_SHORT[piece.museum] ?? piece.museum;

  return (
    <>
      <div className="gal-label__bar">
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
        <a
          className="gal-link"
          href={piece.url}
          target="_blank"
          rel="noreferrer"
        >
          View at {where}
          <ArrowUpRight aria-hidden="true" />
        </a>
      </div>

      {/* keyed, so each piece starts scrolled to the top */}
      <div key={piece.id} className="gal-label__scroll">
        <header className="gal-label__head">
          <p className="gal-eyebrow">
            {piece.museum}
            <span aria-hidden="true"> · </span>
            {piece.city}
          </p>
          <h2 id="gal-label-title" className="gal-title">
            {title.main}
          </h2>
          {title.also ? <p className="gal-also">{title.also}</p> : null}
          <p className="gal-artist">
            {piece.artist}
            {piece.date ? <span className="gal-date">{piece.date}</span> : null}
          </p>
        </header>

        <div className="gal-label__body">
          {text ? (
            <About text={text} from={piece.about ? null : piece.museum} />
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

          {piece.imageCredit ? (
            <p className="gal-credit">Image: {piece.imageCredit}</p>
          ) : null}
        </div>
      </div>
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

  const [selection, setSelection] = React.useState<Selection | null>(null);
  const [camera, setCamera] = React.useState<string | null>(null);
  // The label keeps showing the last piece while it fades away.
  const [labelled, setLabelled] = React.useState<Selection | null>(null);
  const [seen, setSeen] = React.useState<Set<string>>(() => new Set());

  const wideRef = React.useRef<HTMLDivElement>(null);
  const narrowRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const previous = React.useRef<Selection | null>(null);
  const linger = React.useRef<number | null>(null);

  const markSeen = React.useCallback((id: string) => {
    setSeen((current) =>
      current.has(id) ? current : new Set(current).add(id),
    );
  }, []);

  const open = React.useCallback(
    (id: string, variant: Variant) => {
      markSeen(id);
      setSelection({ id, variant });
      setLabelled({ id, variant });
    },
    [markSeen],
  );

  const close = React.useCallback(() => setSelection(null), []);

  const step = React.useCallback(
    (delta: number) => {
      const current = previous.current;
      if (!current) return;
      const list = plans[current.variant].pieces;
      const at = list.findIndex((hung) => hung.id === current.id);
      const next = list[(at + delta + list.length) % list.length];
      open(next.id, current.variant);
    },
    [plans, open],
  );

  // Resting the pointer on a piece starts loading its sharp image, so it is
  // ready by the time you have walked up to it.
  const onLinger = React.useCallback(
    (id: string | null) => {
      if (linger.current) window.clearTimeout(linger.current);
      linger.current = id ? window.setTimeout(() => markSeen(id), 140) : null;
    },
    [markSeen],
  );

  // Point the camera at the chosen piece, and keep it there on resize.
  const aim = React.useCallback(() => {
    if (!selection) return setCamera(null);
    const hang = (selection.variant === "wide" ? wideRef : narrowRef).current;
    const wall = plans[selection.variant];
    const hung = wall.pieces.find((h) => h.id === selection.id);
    if (hang && hung) setCamera(cameraFor(hang, wall, hung));
  }, [selection, plans]);

  React.useLayoutEffect(aim, [aim]);

  React.useEffect(() => {
    if (!selection) return;
    window.addEventListener("resize", aim);
    return () => window.removeEventListener("resize", aim);
  }, [selection, aim]);

  // Open the piece named in the URL (#id), so a picture can be linked to.
  React.useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id || !byId.has(id)) return;
    open(id, window.matchMedia(WIDE_QUERY).matches ? "wide" : "narrow");
  }, [byId, open]);

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

    if (selection && !was) closeRef.current?.focus({ preventScroll: true });
    // On stepping back, hand focus to the picture's place on the wall.
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

  const near = Boolean(selection);
  const piece = labelled ? byId.get(labelled.id) : undefined;
  const list = labelled ? plans[labelled.variant].pieces : [];
  const position = labelled
    ? list.findIndex((hung) => hung.id === labelled.id)
    : -1;

  return (
    <>
      <div className="gal-room" inert={near ? true : undefined}>
        {VARIANTS.map((variant) => (
          <div key={variant} className={cn("gal-plan", `gal-plan--${variant}`)}>
            <WallView
              wall={plans[variant]}
              variant={variant}
              pieces={byId}
              selection={selection}
              camera={camera}
              seen={seen}
              hangRef={variant === "wide" ? wideRef : narrowRef}
              onOpen={open}
              onLinger={onLinger}
            />
          </div>
        ))}
      </div>

      {/* Stepping back: anywhere that is not the label. */}
      <div
        className="gal-scrim"
        data-open={near ? "" : undefined}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        className="gal-label"
        data-open={near ? "" : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gal-label-title"
        inert={near ? undefined : true}
      >
        {piece ? (
          <Label
            piece={piece}
            position={position}
            total={list.length}
            onStep={step}
          />
        ) : null}
        <button
          ref={closeRef}
          type="button"
          className="gal-close"
          aria-label="Step back"
          onClick={close}
        >
          <X aria-hidden="true" />
        </button>
      </aside>
    </>
  );
}
