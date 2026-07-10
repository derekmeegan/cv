import * as React from "react";
import Image, { type ImageProps } from "next/image";

import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-xl",
      className,
    )}
    {...props}
  />
));
Avatar.displayName = "Avatar";

// Renders through next/image so Vercel resizes the source down to the display
// size and serves AVIF/WebP instead of the multi-megabyte source PNGs. Uses
// `fill` so it adapts to whatever box the surrounding Avatar defines.
const AvatarImage = React.forwardRef<
  HTMLImageElement,
  Omit<ImageProps, "fill">
>(({ className, sizes = "128px", ...props }, ref) => (
  <Image
    ref={ref}
    fill
    sizes={sizes}
    className={cn("z-10 object-cover", className)}
    {...props}
  />
));
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute inset-0 flex items-center justify-center rounded-xl bg-muted",
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
