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
// Roughly how long one descriptor stays on screen (type + pause + delete +
// pause). Used only to pick the starting descriptor from the clock.
const DESCRIPTOR_DISPLAY_DURATION_MS = 4000;

export function TypingDescriptor({
  descriptors,
  children,
}: TypingDescriptorProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  const [descriptorIndex, setDescriptorIndex] = React.useState(0);
  const [characterCount, setCharacterCount] = React.useState(0);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const descriptor = descriptors[descriptorIndex] ?? "";
  const punctuatedDescriptor = punctuate(descriptor);
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
    if (!descriptors.length) {
      return;
    }

    // Seed the starting descriptor from the clock so the rotation keeps
    // advancing over time and doesn't restart from the first item on every
    // page load. The per-character typing then continues from here as usual.
    setDescriptorIndex(
      Math.floor(Date.now() / DESCRIPTOR_DISPLAY_DURATION_MS) %
        descriptors.length,
    );
  }, [descriptors.length]);

  React.useEffect(() => {
    if (!descriptors.length || prefersReducedMotion) {
      return;
    }

    const delay =
      !isDeleting && characterCount === punctuatedDescriptor.length
        ? TYPED_PAUSE_DELAY_MS
        : isDeleting && characterCount === 0
          ? DELETED_PAUSE_DELAY_MS
          : isDeleting
            ? DELETING_DELAY_MS
            : TYPING_DELAY_MS;

    const timeoutId = window.setTimeout(() => {
      if (isDeleting) {
        if (characterCount > 0) {
          setCharacterCount((currentCharacterCount) =>
            Math.max(0, currentCharacterCount - 1),
          );
          return;
        }

        setIsDeleting(false);
        setDescriptorIndex(
          (currentDescriptorIndex) =>
            (currentDescriptorIndex + 1) % descriptors.length,
        );
        return;
      }

      if (characterCount < punctuatedDescriptor.length) {
        setCharacterCount((currentCharacterCount) =>
          Math.min(punctuatedDescriptor.length, currentCharacterCount + 1),
        );
        return;
      }

      setIsDeleting(true);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    characterCount,
    punctuatedDescriptor,
    descriptors.length,
    isDeleting,
    prefersReducedMotion,
  ]);

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
      {/* Reserve room for every descriptor so the paragraph never grows when
          one wraps to a new line. They are all stacked in the same grid cell,
          invisible; the letters are not fixed-width, so the longest by
          character count is not necessarily the widest. */}
      {descriptors.map((reserved) => (
        <span
          key={reserved}
          aria-hidden="true"
          className="invisible [grid-area:1/1]"
        >
          {children}
          {punctuate(reserved)}
          <span className="inline-block w-[0.6ch]">|</span>
        </span>
      ))}
    </span>
  );
}
