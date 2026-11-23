"use client";

import * as React from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";

import { BOUND, TALLEST, type Bound } from "@/lib/library";

const WIDE_QUERY = "(min-width: 900px)";

/** How long a book takes to come off the shelf, or go back (see --lib-move). */
const MOVE_MS = 860;

/** How a book is held: turned a little, seen from slightly above. */
const REST = { rx: -5, ry: 30 };

/** The widest a held book gets: the largest format, turned to REST. */
const WIDEST = Math.max(...BOUND.map((b) => b.w * 0.87 + b.t * 0.5));

const BY_ID = new Map(BOUND.map((bound) => [bound.book.id, bound]));

function vars(values: Record<string, number | string>) {
  return values as React.CSSProperties;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

function boundVars(bound: Bound) {
  return vars({
    "--h": bound.h,
    "--w": bound.w,
    "--t": bound.t,
    "--cloth": bound.cloth,
    "--foil": bound.foil,
    "--fs": Number(bound.spine.size.toFixed(2)),
    "--cs": bound.coverSize,
  });
}

/* --- the book as a drawing ------------------------------------------------ */

/** The spine: what you see on the shelf, and one face of the book in hand. */
function Spine({ bound }: { bound: Bound }) {
  const { spine } = bound;
  return (
    <span className="lib-spine">
      <span className="lib-spine__title">
        {spine.lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </span>
      {spine.author ? (
        <span className="lib-spine__author">{spine.author}</span>
      ) : null}
    </span>
  );
}

function FrontBoard({ bound }: { bound: Bound }) {
  return (
    <div className="lib-board lib-board--front">
      <span className="lib-board__frame" />
      <div className="lib-board__lettering">
        <p className="lib-board__title">{bound.book.title}</p>
        <span className="lib-board__rule" />
        <p className="lib-board__author">{bound.book.author}</p>
      </div>
    </div>
  );
}

function BackBoard() {
  return (
    <div className="lib-board lib-board--back">
      <span className="lib-board__frame" />
    </div>
  );
}

/* --- where a book is, and how it is lit ----------------------------------- */

const LIGHT = [0.32, -0.42, 0.85];

/**
 * How much each face is in shadow once the book is turned by rx and ry: the
 * faces square to the light stay as they are and the ones turned away darken.
 * A spine seen dead on (the shelf) comes out at exactly zero.
 */
function shades(rx: number, ry: number) {
  const a = (rx * Math.PI) / 180;
  const b = (ry * Math.PI) / 180;
  const lit = ([x, y, z]: number[]) => {
    const x1 = x * Math.cos(b) + z * Math.sin(b);
    const z1 = -x * Math.sin(b) + z * Math.cos(b);
    const y2 = y * Math.cos(a) - z1 * Math.sin(a);
    const z2 = y * Math.sin(a) + z1 * Math.cos(a);
    return x1 * LIGHT[0] + y2 * LIGHT[1] + z2 * LIGHT[2];
  };
  const shade = (normal: number[]) =>
    clamp((LIGHT[2] - lit(normal)) * 0.5, 0, 0.5).toFixed(3);
  return {
    "--sh-front": shade([0, 0, 1]),
    "--sh-back": shade([0, 0, -1]),
    "--sh-spine": shade([-1, 0, 0]),
    "--sh-fore": shade([1, 0, 0]),
    "--sh-top": shade([0, -1, 0]),
    "--sh-bottom": shade([0, 1, 0]),
  };
}

/**
 * Where a book is held, and how big: on a wide screen the side of the window
 * the label does not use, on a phone the upper half. Books keep their sizes
 * relative to one another, so a pocket book is small in the hand too.
 */
function stageFor(bound: Bound) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const wide = window.matchMedia(WIDE_QUERY).matches;
  const area = wide
    ? { top: 0, width: vw - clamp(vw * 0.36, 360, 540), height: vh }
    : { top: 56, width: vw, height: vh * 0.5 - 56 };
  const u = Math.min(
    (area.height * (wide ? 0.7 : 0.86)) / TALLEST,
    (area.width * (wide ? 0.5 : 0.62)) / WIDEST,
    3.2,
  );
  return {
    u,
    // the spine shows on the left, so the board sits a little right of centre
    x: area.width / 2 + bound.t * 0.2 * u,
    y: area.top + area.height / 2,
  };
}

interface Drag {
  pointer: number;
  x: number;
  y: number;
  ry: number;
  /** turning the book over, or (on a touch screen) pulling it down to put back */
  mode: "turn" | "pull" | null;
  touch: boolean;
  dy: number;
  time: number;
}

/**
 * A book off the shelf. It is a real box — two boards, a spine and a block
 * of pages — that starts spine-on, exactly over its place on the shelf, and
 * turns to face you as it comes. Putting it back is the same in reverse.
 *
 * The motion is written straight onto the elements rather than through
 * React state: it runs every frame while the book follows the pointer.
 */
function FlyingBook({
  bound,
  held,
  dimmed,
  onShelved,
  onPutBack,
}: {
  bound: Bound;
  held: boolean;
  /** going back while another book is being looked at: it fades as it goes */
  dimmed: boolean;
  onShelved: (id: string) => void;
  onPutBack: () => void;
}) {
  const id = bound.book.id;
  const fly = React.useRef<HTMLDivElement>(null);
  const solid = React.useRef<HTMLDivElement>(null);
  const timer = React.useRef<number | null>(null);
  /** it has reached the hand: it can be turned over */
  const arrived = React.useRef(false);
  /** in the hand and at rest: free to follow the pointer */
  const settled = React.useRef(false);
  const turn = React.useRef({ ...REST });
  const drag = React.useRef<Drag | null>(null);
  const mounted = React.useRef(false);

  const pose = React.useCallback(
    (
      where: "slot" | "hand",
      motion: "none" | "move" | "follow",
      angles = REST,
      pull = 0,
    ) => {
      const el = fly.current;
      const body = solid.current;
      if (!el || !body) return;
      const stage = stageFor(bound);
      const width = bound.w * stage.u;
      const lens = bound.h * stage.u * 5;

      el.style.setProperty("--u", `${stage.u.toFixed(3)}px`);
      el.toggleAttribute("data-moving", motion === "move");
      el.toggleAttribute("data-following", motion === "follow");
      el.toggleAttribute("data-held", where === "hand");

      let rx = angles.rx;
      let ry = angles.ry;
      if (where === "slot") {
        const slot = document.querySelector<HTMLElement>(
          `[data-book="${CSS.escape(id)}"]`,
        );
        const rect = slot?.getBoundingClientRect();
        if (!rect) return;
        rx = 0;
        ry = 90;
        const scale = rect.height / (bound.h * stage.u);
        el.style.transform = `translate3d(${(rect.left + rect.width / 2).toFixed(2)}px, ${(rect.top + rect.height / 2).toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
        // Pushed back by half its width, the spine lies in the plane of the
        // page: the same size, to the pixel, as the one drawn on the shelf.
        body.style.transform = `perspective(${lens.toFixed(0)}px) translateZ(${(-width / 2).toFixed(2)}px) rotateX(0deg) rotateY(90deg)`;
      } else {
        el.style.transform = `translate3d(${stage.x.toFixed(2)}px, ${(stage.y + pull).toFixed(2)}px, 0) scale(1)`;
        body.style.transform = `perspective(${lens.toFixed(0)}px) translateZ(0px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      }
      turn.current = { rx, ry };
      for (const [name, value] of Object.entries(shades(rx, ry))) {
        body.style.setProperty(name, value);
      }
    },
    [bound, id],
  );

  const go = React.useCallback(
    (where: "slot" | "hand") => {
      const inHand = arrived.current;
      settled.current = false;
      if (where === "slot") {
        arrived.current = false;
        // Its place may have slid out of sight while it was down: bring the
        // place back first, so the book has somewhere to go.
        document
          .querySelector<HTMLElement>(`[data-book="${CSS.escape(id)}"]`)
          ?.scrollIntoView({
            behavior: "instant",
            block: "nearest",
            inline: "nearest",
          });
      }
      if (timer.current) window.clearTimeout(timer.current);
      // The short way round, however many times it has been turned over.
      const { rx, ry } = turn.current;
      const turns = Math.round((ry - (where === "hand" ? REST.ry : 90)) / 360);
      if (turns !== 0 && inHand) {
        pose("hand", "none", { rx, ry: ry - turns * 360 });
        solid.current?.getBoundingClientRect();
      }
      pose(where, "move");
      timer.current = window.setTimeout(() => {
        timer.current = null;
        if (where === "hand") {
          arrived.current = true;
          settled.current = true;
        } else {
          onShelved(id);
        }
      }, MOVE_MS + 60);
    },
    [pose, onShelved, id],
  );

  // Start over the book's place on the shelf, then come out.
  React.useLayoutEffect(() => {
    pose("slot", "none");
    fly.current?.getBoundingClientRect();
    mounted.current = true;
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
    // only on arrival: `held` is followed by the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useLayoutEffect(() => {
    if (!mounted.current) return;
    go(held ? "hand" : "slot");
  }, [held, go]);

  // Held, the book stays where it should as the window changes, and leans
  // toward the pointer.
  React.useEffect(() => {
    if (!held) return;
    const onResize = () => {
      if (settled.current) pose("hand", "none", turn.current);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      if (!settled.current || drag.current) return;
      const stage = stageFor(bound);
      const nx = clamp(
        (event.clientX - stage.x) / (window.innerWidth / 2),
        -1,
        1,
      );
      const ny = clamp(
        (event.clientY - stage.y) / (window.innerHeight / 2),
        -1,
        1,
      );
      pose("hand", "follow", {
        rx: REST.rx - ny * 4,
        ry: REST.ry - nx * 9,
      });
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
    };
  }, [held, bound, pose]);

  // Dragging the book turns it over in the hand; on a touch screen, pulling
  // it down puts it back.
  const onDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!held || !arrived.current || drag.current) return;
    drag.current = {
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      ry: turn.current.ry,
      mode: null,
      touch: event.pointerType !== "mouse",
      dy: 0,
      time: event.timeStamp,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.mode) {
      if (Math.hypot(dx, dy) < 6) return;
      current.mode =
        current.touch && Math.abs(dy) > Math.abs(dx) ? "pull" : "turn";
      fly.current?.setAttribute("data-dragging", "");
    }
    if (current.mode === "turn") {
      pose("hand", "none", { rx: REST.rx, ry: current.ry + dx * 0.55 });
    } else {
      // down follows the finger; up barely gives
      current.dy = dy > 0 ? dy : dy * 0.15;
      pose("hand", "none", turn.current, current.dy);
    }
  };

  const onDragEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) return;
    drag.current = null;
    fly.current?.removeAttribute("data-dragging");
    if (!current.mode) return;
    if (current.mode === "pull" && event.type === "pointerup") {
      const speed = current.dy / Math.max(1, event.timeStamp - current.time);
      if (current.dy > 80 || (current.dy > 28 && speed > 0.35)) {
        onPutBack();
        return;
      }
    }
    go("hand");
  };

  return (
    <div
      ref={fly}
      className="lib-fly lib-bound"
      data-dimmed={dimmed ? "" : undefined}
      style={boundVars(bound)}
    >
      <div
        ref={solid}
        className="lib-solid"
        aria-hidden="true"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
      >
        <div className="lib-face lib-face--back">
          <BackBoard />
        </div>
        <div className="lib-face lib-face--bottom lib-pages" />
        <div className="lib-face lib-face--top lib-pages" />
        <div className="lib-face lib-face--fore lib-pages" />
        <div className="lib-face lib-edge lib-edge--top-front" />
        <div className="lib-face lib-edge lib-edge--top-back" />
        <div className="lib-face lib-edge lib-edge--fore-front" />
        <div className="lib-face lib-edge lib-edge--fore-back" />
        <div className="lib-face lib-face--spine">
          <Spine bound={bound} />
        </div>
        <div className="lib-face lib-face--front">
          <FrontBoard bound={bound} />
        </div>
      </div>
    </div>
  );
}

/* --- the label ------------------------------------------------------------ */

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <div className="lib-fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/**
 * What you read with the book in your hand. As in the gallery, the controls
 * sit in a bar outside the part that scrolls, so they never move.
 */
function Label({
  bound,
  onStep,
}: {
  bound: Bound;
  onStep: (delta: number) => void;
}) {
  const { book } = bound;
  return (
    <>
      <div className="lib-label__bar">
        <div className="lib-pager">
          <button
            type="button"
            aria-label="Previous book"
            onClick={() => onStep(-1)}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <span aria-live="polite">
            {bound.index + 1} of {BOUND.length}
          </span>
          <button
            type="button"
            aria-label="Next book"
            onClick={() => onStep(1)}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
        <a
          className="lib-link"
          href={book.readMoreUrl}
          target="_blank"
          rel="noreferrer"
        >
          Read more
          <ArrowUpRight aria-hidden="true" />
        </a>
      </div>

      {/* keyed, so each book starts scrolled to the top */}
      <div key={book.id} className="lib-label__scroll">
        <header className="lib-label__head">
          <h2 id="lib-label-title" className="lib-title">
            {book.title}
          </h2>
          <p className="lib-author">{book.author}</p>
        </header>

        <div className="lib-label__body">
          {book.note ? (
            <div className="lib-note">
              {book.note.split(/\n{2,}/).map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
          ) : null}

          <dl className="lib-facts">
            <Fact label="Published">{book.publishedYear}</Fact>
          </dl>
        </div>
      </div>
    </>
  );
}

/* --- the library ---------------------------------------------------------- */

/** A mouse sliding the shelf along, between pressing and letting go. */
interface Slide {
  pointer: number;
  x: number;
  left: number;
  moved: boolean;
  /** where the pointer last was, and when: for the speed it is let go at */
  lastX: number;
  lastTime: number;
  speed: number;
}

export function Library() {
  /** the book in the hand */
  const [held, setHeld] = React.useState<string | null>(null);
  /** every book off the shelf: the one held, and any still on their way back */
  const [away, setAway] = React.useState<string[]>([]);
  // The label keeps showing the last book while it fades away.
  const [labelled, setLabelled] = React.useState<string | null>(null);
  /** the spine under the pointer, and the last one that was */
  const [reading, setReading] = React.useState<string | null>(null);
  const [lastRead, setLastRead] = React.useState<string>(BOUND[0].book.id);

  const shelfRef = React.useRef<HTMLDivElement>(null);
  const nearRef = React.useRef<HTMLDivElement>(null);
  const previous = React.useRef<string | null>(null);
  const heldRef = React.useRef<string | null>(null);
  /** the book whose place gets keyboard focus once it is back in it */
  const refocus = React.useRef<string | null>(null);
  const slide = React.useRef<Slide | null>(null);
  const slidAt = React.useRef(-1000);
  const glide = React.useRef<number | null>(null);

  const open = React.useCallback((id: string) => {
    setHeld(id);
    setLabelled(id);
    setReading(null);
    setAway((current) => (current.includes(id) ? current : [...current, id]));
  }, []);

  const close = React.useCallback(() => setHeld(null), []);

  const step = React.useCallback(
    (delta: number) => {
      const current = previous.current ? BY_ID.get(previous.current) : null;
      if (!current) return;
      const next = BOUND[(current.index + delta + BOUND.length) % BOUND.length];
      open(next.book.id);
    },
    [open],
  );

  // Back in its place: unless it was taken down again on the way.
  const onShelved = React.useCallback((id: string) => {
    if (heldRef.current === id) return;
    setAway((current) => current.filter((other) => other !== id));
  }, []);

  const read = React.useCallback((id: string | null) => {
    setReading(id);
    if (id) setLastRead(id);
  }, []);

  // Take down the book named in the URL (#id), so a book can be linked to.
  React.useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id || !BY_ID.has(id)) return;
    document
      .querySelector<HTMLElement>(`[data-book="${CSS.escape(id)}"]`)
      ?.scrollIntoView({
        behavior: "instant",
        block: "nearest",
        inline: "center",
      });
    open(id);
  }, [open]);

  // Keep the URL and keyboard focus in step with what is in the hand.
  React.useEffect(() => {
    const was = previous.current;
    previous.current = held;
    heldRef.current = held;
    if (!held && !was) return;

    // Straight to the browser's own history: this is not a navigation, and
    // Next's patched replaceState would route it through the router.
    History.prototype.replaceState.call(
      window.history,
      window.history.state,
      "",
      held ? `#${held}` : window.location.pathname + window.location.search,
    );

    // Focus moves into the dialog as a whole, so nothing is ringed until
    // someone actually tabs to a control.
    if (held && !was) nearRef.current?.focus({ preventScroll: true });
    // Put back, focus goes to the book's place on the shelf: once the book
    // is in it again (see below), since an empty place cannot take focus.
    refocus.current = held ? null : was;
  }, [held]);

  React.useEffect(() => {
    const id = refocus.current;
    if (!id || away.includes(id)) return;
    refocus.current = null;
    document
      .querySelector<HTMLElement>(`[data-book="${CSS.escape(id)}"]`)
      ?.focus({ preventScroll: true });
  }, [away]);

  // The page holds still while any book is off the shelf: a book on its way
  // back is aimed at where its place is on the screen.
  const busy = away.length > 0;
  React.useEffect(() => {
    document.documentElement.classList.toggle("lib-locked", busy);
    return () => document.documentElement.classList.remove("lib-locked");
  }, [busy]);

  React.useEffect(() => {
    if (!held) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [held, close, step]);

  // A wheel that only turns up and down slides the shelf too, as long as
  // there is nothing on the page for it to scroll instead.
  React.useEffect(() => {
    const shelf = shelfRef.current;
    if (!shelf) return;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return;
      }
      if (shelf.scrollWidth <= shelf.clientWidth) return;
      const page = document.documentElement;
      if (page.scrollHeight > page.clientHeight + 1) return;
      event.preventDefault();
      shelf.scrollLeft += event.deltaY;
    };
    shelf.addEventListener("wheel", onWheel, { passive: false });
    return () => shelf.removeEventListener("wheel", onWheel);
  }, []);

  React.useEffect(
    () => () => {
      if (glide.current) cancelAnimationFrame(glide.current);
    },
    [],
  );

  // With a mouse, the shelf is slid by taking hold of it. (A finger or a
  // trackpad already scrolls it.)
  const onSlideStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    if (glide.current) cancelAnimationFrame(glide.current);
    slide.current = {
      pointer: event.pointerId,
      x: event.clientX,
      left: event.currentTarget.scrollLeft,
      moved: false,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      speed: 0,
    };
  };

  const onSlideMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = slide.current;
    if (!current || current.pointer !== event.pointerId) return;
    const shelf = event.currentTarget;
    const dx = event.clientX - current.x;
    if (!current.moved) {
      if (Math.abs(dx) < 5) return;
      current.moved = true;
      shelf.setPointerCapture(event.pointerId);
      shelf.setAttribute("data-sliding", "");
      setReading(null);
    }
    shelf.scrollLeft = current.left - dx;
    const elapsed = event.timeStamp - current.lastTime;
    if (elapsed > 0) {
      const now = (event.clientX - current.lastX) / elapsed;
      current.speed = current.speed * 0.6 + now * 0.4;
      current.lastX = event.clientX;
      current.lastTime = event.timeStamp;
    }
  };

  const onSlideEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = slide.current;
    if (!current || current.pointer !== event.pointerId) return;
    slide.current = null;
    if (!current.moved) return;
    const shelf = event.currentTarget;
    shelf.removeAttribute("data-sliding");
    // the click that ends a slide is not a request for the book under it
    slidAt.current = event.timeStamp;

    // Let go while moving, the shelf runs on a little and settles.
    let speed =
      event.timeStamp - current.lastTime > 80
        ? 0
        : clamp(current.speed, -2.5, 2.5);
    let last = performance.now();
    const run = (now: number) => {
      const elapsed = Math.min(40, now - last);
      last = now;
      shelf.scrollLeft -= speed * elapsed;
      speed *= Math.pow(0.994, elapsed);
      glide.current =
        Math.abs(speed) > 0.02 ? requestAnimationFrame(run) : null;
    };
    if (Math.abs(speed) > 0.05) glide.current = requestAnimationFrame(run);
  };

  const onClickCapture = (event: React.MouseEvent) => {
    if (event.timeStamp - slidAt.current > 250) return;
    event.preventDefault();
    event.stopPropagation();
  };

  const near = Boolean(held);
  const label = labelled ? BY_ID.get(labelled) : undefined;
  const readout = BY_ID.get(lastRead) ?? BOUND[0];

  return (
    <>
      <div
        className="lib-room"
        data-near={near ? "" : undefined}
        inert={near ? true : undefined}
      >
        <h1 className="lib-sr-only">Library</h1>

        {/* The book under the pointer is named here, in the page's column. */}
        <div className="container mx-auto px-4 md:px-16">
          <p
            className="lib-readout mx-auto w-full max-w-2xl"
            data-reading={reading ? "" : undefined}
            aria-hidden="true"
          >
            <span className="lib-readout__title">{readout.book.title}</span>
            <span>
              {readout.book.author}
              {" · "}
              {readout.book.publishedYear}
            </span>
          </p>
        </div>

        {/* One shelf, as long as it needs to be: it slides from side to side. */}
        <div
          ref={shelfRef}
          className="lib-shelf"
          style={vars({ "--tallest": TALLEST })}
          role="group"
          aria-label="Books"
          onPointerDown={onSlideStart}
          onPointerMove={onSlideMove}
          onPointerUp={onSlideEnd}
          onPointerCancel={onSlideEnd}
          onClickCapture={onClickCapture}
        >
          <div className="lib-row">
            {BOUND.map((bound) => {
              const { book } = bound;
              return (
                <button
                  key={book.id}
                  type="button"
                  className="lib-book lib-bound"
                  data-book={book.id}
                  data-away={away.includes(book.id) ? "" : undefined}
                  style={boundVars(bound)}
                  aria-label={`${book.title} by ${book.author}. Take it down.`}
                  draggable={false}
                  onClick={() => open(book.id)}
                  onPointerEnter={(event) => {
                    if (
                      event.pointerType === "mouse" &&
                      !slide.current?.moved
                    ) {
                      read(book.id);
                    }
                  }}
                  onPointerLeave={() => read(null)}
                  onFocus={() => read(book.id)}
                  onBlur={() => read(null)}
                >
                  <Spine bound={bound} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Everything but the book fades back; a tap on it puts the book away. */}
      <div
        className="lib-scrim"
        data-open={near ? "" : undefined}
        onClick={close}
        aria-hidden="true"
      />

      {away.map((id) => {
        const bound = BY_ID.get(id);
        return bound ? (
          <FlyingBook
            key={id}
            bound={bound}
            held={held === id}
            dimmed={held !== null && held !== id}
            onShelved={onShelved}
            onPutBack={close}
          />
        ) : null;
      })}

      <div
        ref={nearRef}
        className="lib-near"
        data-open={near ? "" : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lib-label-title"
        tabIndex={-1}
        inert={near ? undefined : true}
      >
        <aside className="lib-label">
          {label ? <Label bound={label} onStep={step} /> : null}
        </aside>
        <button
          type="button"
          className="lib-close"
          aria-label="Put it back"
          onClick={close}
        >
          <X aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
