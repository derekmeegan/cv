"use client";

import * as React from "react";

interface TypingDescriptorProps {
  descriptors: string[];
  children?: React.ReactNode;
}

function punctuate(descriptor: string) {
  return descriptor.endsWith(".") ? descriptor : `${descriptor}.`;
}

const TYPING_DELAY_MS = 48;
const DELETING_DELAY_MS = 28;
const TYPED_PAUSE_DELAY_MS = 1200;
const DELETED_PAUSE_DELAY_MS = 450;

interface Segment {
  length: number;
  typingDuration: number;
  deletingDuration: number;
  total: number;
}

interface TypingState {
  descriptorIndex: number;
  characterCount: number;
}

// Build a per-descriptor timeline so the animation can be derived purely from
// the wall clock instead of from React state. This keeps the rotation
// continuous across page loads — a refresh resumes wherever the global cycle
// happens to be rather than restarting from the beginning.
function buildSegments(descriptors: string[]): Segment[] {
  return descriptors.map((descriptor) => {
    const length = punctuate(descriptor).length;
    const typingDuration = length * TYPING_DELAY_MS;
    const deletingDuration = length * DELETING_DELAY_MS;

    return {
      length,
      typingDuration,
      deletingDuration,
      total:
        typingDuration +
        TYPED_PAUSE_DELAY_MS +
        deletingDuration +
        DELETED_PAUSE_DELAY_MS,
    };
  });
}

function computeTypingState(segments: Segment[], elapsed: number): TypingState {
  const cycleDuration = segments.reduce(
    (total, segment) => total + segment.total,
    0,
  );

  if (cycleDuration === 0) {
    return { descriptorIndex: 0, characterCount: 0 };
  }

  let offset = ((elapsed % cycleDuration) + cycleDuration) % cycleDuration;

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];

    if (offset >= segment.total) {
      offset -= segment.total;
      continue;
    }

    // Typing in.
    if (offset < segment.typingDuration) {
      return {
        descriptorIndex: index,
        characterCount: Math.min(
          segment.length,
          Math.floor(offset / TYPING_DELAY_MS),
        ),
      };
    }
    offset -= segment.typingDuration;

    // Pausing on the fully typed descriptor.
    if (offset < TYPED_PAUSE_DELAY_MS) {
      return { descriptorIndex: index, characterCount: segment.length };
    }
    offset -= TYPED_PAUSE_DELAY_MS;

    // Deleting.
    if (offset < segment.deletingDuration) {
      return {
        descriptorIndex: index,
        characterCount: Math.max(
          0,
          segment.length - Math.floor(offset / DELETING_DELAY_MS),
        ),
      };
    }

    // Pausing on the empty descriptor before moving to the next one.
    return { descriptorIndex: index, characterCount: 0 };
  }

  return { descriptorIndex: 0, characterCount: 0 };
}

export function TypingDescriptor({
  descriptors,
  children,
}: TypingDescriptorProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  const [typingState, setTypingState] = React.useState<TypingState>({
    descriptorIndex: 0,
    characterCount: 0,
  });

  const segments = React.useMemo(
    () => buildSegments(descriptors),
    [descriptors],
  );

  const { descriptorIndex, characterCount } = typingState;
  const descriptor = descriptors[descriptorIndex] ?? "";
  const punctuatedDescriptor = punctuate(descriptor);
  // Reserve space for the longest descriptor so the paragraph never grows when
  // a longer descriptor wraps to a new line. The text is monospace, so the
  // longest by character count is also the widest (and therefore the tallest).
  const longestDescriptor = descriptors.reduce(
    (longest, current) => (current.length > longest.length ? current : longest),
    "",
  );
  const punctuatedLongestDescriptor = punctuate(longestDescriptor);
  const visibleDescriptor = prefersReducedMotion
    ? punctuatedDescriptor
    : punctuatedDescriptor.slice(0, characterCount);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    setPrefersReducedMotion(mediaQuery.matches);

    function handleChange(event: MediaQueryListEvent) {
      setPrefersReducedMotion(event.matches);
    }

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  React.useEffect(() => {
    if (!segments.length || prefersReducedMotion) {
      return;
    }

    let animationFrameId = 0;

    function tick() {
      setTypingState((currentState) => {
        const nextState = computeTypingState(segments, Date.now());

        if (
          nextState.descriptorIndex === currentState.descriptorIndex &&
          nextState.characterCount === currentState.characterCount
        ) {
          return currentState;
        }

        return nextState;
      });

      animationFrameId = window.requestAnimationFrame(tick);
    }

    animationFrameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [segments, prefersReducedMotion]);

  if (!descriptors.length) {
    return null;
  }

  return (
    <span className="grid">
      <span className="[grid-area:1/1]">
        {children}
        <span aria-hidden="true">
          {visibleDescriptor}
          <span className="inline-block w-[0.6ch] animate-pulse">|</span>
        </span>
        <span className="sr-only">{descriptors.join(", ")}</span>
      </span>
      <span aria-hidden="true" className="invisible [grid-area:1/1]">
        {children}
        {punctuatedLongestDescriptor}
      </span>
    </span>
  );
}
