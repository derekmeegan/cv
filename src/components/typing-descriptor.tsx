"use client";

import * as React from "react";

interface TypingDescriptorProps {
  descriptors: string[];
}

const TYPING_DELAY_MS = 48;
const DELETING_DELAY_MS = 28;
const TYPED_PAUSE_DELAY_MS = 1200;
const DELETED_PAUSE_DELAY_MS = 450;

export function TypingDescriptor({ descriptors }: TypingDescriptorProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  const [descriptorIndex, setDescriptorIndex] = React.useState(0);
  const [characterCount, setCharacterCount] = React.useState(0);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const descriptor = descriptors[descriptorIndex] ?? "";
  const punctuatedDescriptor = descriptor.endsWith(".")
    ? descriptor
    : `${descriptor}.`;
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
    <>
      <span aria-hidden="true" className="inline-flex items-baseline">
        <span>{visibleDescriptor}</span>
        <span className="inline-block w-[0.6ch] animate-pulse">|</span>
      </span>
      <span className="sr-only">{descriptors.join(", ")}</span>
    </>
  );
}
