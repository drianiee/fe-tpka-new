import * as React from "react";
import Image, { ImageProps } from "next/image";

interface LogoProps extends Omit<ImageProps, "src" | "alt" | "fill" | "width" | "height"> {
  /** kelas untuk WRAPPER (harus set height, opsional width) */
  className?: string;
  /** kelas opsional untuk <img> di dalam */
  imgClassName?: string;
}

export default function Logo({ className = "", imgClassName = "", ...props }: LogoProps) {
  return (
    <div className={`relative ${className}`}>
      <Image
        src="/blue-logo.svg"
        alt="ISPO Rakyat Logo"
        fill
        priority
        sizes="100vw"
        className={`block object-contain ${imgClassName}`}
        {...props}
      />
    </div>
  );
}