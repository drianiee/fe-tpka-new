"use client";

import * as React from "react";
import katex from "katex";
import { cn } from "@/lib/utils";

type Segment =
  | {
      type: "text";
      value: string;
    }
  | {
      type: "math";
      value: string;
      displayMode: boolean;
    };

function parseMathSegments(value: string): Segment[] {
  const segments: Segment[] = [];
  const pattern = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let lastIndex = 0;

  for (const match of value.matchAll(pattern)) {
    const fullMatch = match[0];
    const start = match.index ?? 0;

    if (start > lastIndex) {
      segments.push({
        type: "text",
        value: value.slice(lastIndex, start),
      });
    }

    const displayMode = fullMatch.startsWith("$$");
    segments.push({
      type: "math",
      value: fullMatch.slice(displayMode ? 2 : 1, displayMode ? -2 : -1),
      displayMode,
    });

    lastIndex = start + fullMatch.length;
  }

  if (lastIndex < value.length) {
    segments.push({
      type: "text",
      value: value.slice(lastIndex),
    });
  }

  return segments.length > 0 ? segments : [{ type: "text", value }];
}

function renderLatex(value: string, displayMode: boolean) {
  return katex.renderToString(value, {
    displayMode,
    throwOnError: false,
    strict: "ignore",
    output: "html",
  });
}

export function MathText({
  value,
  className,
  inline = false,
}: {
  value?: string | null;
  className?: string;
  inline?: boolean;
}) {
  const content = (value ?? "").trim();

  const segments = React.useMemo(
    () => (content ? parseMathSegments(content) : []),
    [content],
  );

  if (!content) return null;

  if (
    segments.length === 1 &&
    segments[0]?.type === "math" &&
    segments[0].displayMode &&
    !inline
  ) {
    return (
      <div
        className={cn("katex-content overflow-x-auto", className)}
        dangerouslySetInnerHTML={{
          __html: renderLatex(segments[0].value, true),
        }}
      />
    );
  }

  return (
    <div
      className={cn(
        inline ? "inline" : "whitespace-pre-wrap",
        "katex-content break-words",
        className,
      )}
    >
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return (
            <span
              key={`text-${index}`}
              className="whitespace-pre-wrap"
            >
              {segment.value}
            </span>
          );
        }

        return (
          <span
            key={`math-${index}`}
            className={cn(
              segment.displayMode && !inline
                ? "block overflow-x-auto py-1"
                : "inline-block max-w-full align-middle",
            )}
            dangerouslySetInnerHTML={{
              __html: renderLatex(segment.value, segment.displayMode && !inline),
            }}
          />
        );
      })}
    </div>
  );
}
