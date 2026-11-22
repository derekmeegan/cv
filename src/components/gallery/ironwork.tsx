import type { IronKind } from "@/lib/gallery-layout";

/**
 * Wrought-iron hardware of the kind Albert Barnes hung between his pictures:
 * hinges, keys, latches, a weathercock. Drawn as bar stock (round-capped
 * strokes) and sheet iron (fills), sized to the boxes in gallery-layout.ts.
 */

const bar = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const thin = { ...bar, strokeWidth: 2.5 } as const;

const SHAPES: Record<IronKind, { box: string; art: React.ReactNode }> = {
  scroll: {
    box: "0 0 92 50",
    art: (
      <>
        <path {...bar} d="M46 9V41" />
        <path {...thin} d="M46 9c0-5 6-5 6-1" />
        <path
          {...bar}
          d="M46 33C37 33 31 40 22 40 12 40 6 34 6 27c0-6 5-10 10-10 4 0 7 3 7 7 0 3-2 5-5 5"
        />
        <path
          {...bar}
          d="M46 33c9 0 15 7 24 7 10 0 16-6 16-13 0-6-5-10-10-10-4 0-7 3-7 7 0 3 2 5 5 5"
        />
        <path {...thin} d="M46 41c-4 5-9 6-13 4M46 41c4 5 9 6 13 4" />
      </>
    ),
  },
  strap: {
    box: "0 0 30 92",
    art: (
      <>
        <path
          fill="currentColor"
          d="M15 1c9 7 11 15 3 22h4v5h-3l2 54q-6 10-12 0l2-54H8v-5h4C4 16 6 8 15 1Z"
        />
        <g fill="#8d887f">
          <circle cx="15" cy="12" r="1.7" />
          <circle cx="15" cy="38" r="1.5" />
          <circle cx="15" cy="56" r="1.5" />
          <circle cx="15" cy="74" r="1.5" />
        </g>
      </>
    ),
  },
  key: {
    box: "0 0 30 80",
    art: (
      <>
        <ellipse {...bar} cx="15" cy="13" rx="9" ry="10" />
        <path {...thin} d="M15 6v14M9 13h12" />
        <path {...bar} strokeWidth={3.6} d="M15 23V74" />
        <path {...thin} d="M11 27h8" />
        <path fill="currentColor" d="M16 56h11v5h-4v3h4v6H16Z" />
      </>
    ),
  },
  fleur: {
    box: "0 0 44 84",
    art: (
      <>
        <path fill="currentColor" d="M22 3c8 12 8 22 0 33-8-11-8-21 0-33Z" />
        <path {...bar} d="M20 37C9 37 3 29 6 20c2-6 9-6 10-1" />
        <path {...bar} d="M24 37c11 0 17-8 14-17-2-6-9-6-10-1" />
        <path fill="currentColor" d="M13 36h18v5H13zM19 41h6l1 38-4 4-4-4Z" />
        <g fill="#8a857c">
          <circle cx="22" cy="50" r="1.3" />
          <circle cx="22" cy="68" r="1.3" />
        </g>
      </>
    ),
  },
  ring: {
    box: "0 0 58 66",
    art: (
      <>
        <circle {...thin} cx="29" cy="6" r="4" />
        <path {...thin} d="M29 10v4" />
        <circle {...bar} cx="29" cy="39" r="24" />
        <path {...bar} d="M26 24c-10 2-12 14-5 19 5 3 10-1 8-5" />
        <path {...bar} d="M32 54c10-2 12-14 5-19-5-3-10 1-8 5" />
      </>
    ),
  },
  cock: {
    box: "0 0 76 92",
    art: (
      <>
        <path
          fill="currentColor"
          d="M30 52C20 52 14 44 16 34 10 30 6 22 8 12c4 6 8 10 12 12-2-8 0-16 6-20 0 8 2 16 6 22 6 4 14 2 18-6 0-6 4-10 8-10l2-4 2 4 3-3 1 5c2 1 4 3 6 5l-6 2c0 5-4 5-4 3 0 8-2 18-10 26-6 4-14 6-22 4Z"
        />
        <path {...thin} d="M32 52l-2 8M42 52l2 8" />
        <path {...bar} d="M38 60V90" />
        <path {...thin} d="M18 66H58M58 66l-7-4M58 66l-7 4M18 62v8" />
      </>
    ),
  },
  latch: {
    box: "0 0 70 40",
    art: (
      <>
        <path {...thin} d="M35 3v9" />
        <path {...bar} d="M11 13H59" />
        <path {...bar} d="M11 13C4 13 2 22 8 24c4 1 6-3 4-5" />
        <path {...bar} d="M59 13c7 0 9 9 3 11-4 1-6-3-4-5" />
        <path {...thin} d="M35 13v14" />
        <circle {...thin} cx="35" cy="32" r="4.5" />
      </>
    ),
  },
  tongs: {
    box: "0 0 36 96",
    art: (
      <>
        <path {...bar} d="M18 42C9 32 3 20 8 6c3 5 3 9 1 12" />
        <path {...bar} d="M18 42c9-10 15-22 10-36-3 5-3 9-1 12" />
        <path {...bar} d="M18 42 13 92M18 42l5 50" />
        <circle fill="currentColor" cx="18" cy="42" r="3.6" />
      </>
    ),
  },
};

export function Ironwork({
  kind,
  flip,
  style,
}: {
  kind: IronKind;
  flip?: boolean;
  style?: React.CSSProperties;
}) {
  const shape = SHAPES[kind];
  return (
    <svg
      aria-hidden="true"
      className="gal-iron"
      viewBox={shape.box}
      preserveAspectRatio="xMidYMid meet"
      style={style}
    >
      <g
        transform={
          flip
            ? `translate(${shape.box.split(" ")[2]} 0) scale(-1 1)`
            : undefined
        }
      >
        {shape.art}
      </g>
    </svg>
  );
}
