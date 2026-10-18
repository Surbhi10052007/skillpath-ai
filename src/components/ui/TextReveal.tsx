"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, type ElementType } from "react";
import { cn } from "@/lib/utils";

interface TextRevealProps {
  /** A single string or an array of lines. */
  text: string | string[];
  as?: ElementType;
  className?: string;
  lineClassName?: string | string[];
  delay?: number;
  stagger?: number;
  once?: boolean;
}

/** Word-by-word masked reveal that triggers when scrolled into view. */
export function TextReveal({
  text,
  as: Tag = "p",
  className,
  lineClassName,
  delay = 0,
  stagger = 0.045,
  once = true,
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once, margin: "-10% 0px -10% 0px" });
  const reduce = useReducedMotion();
  const lines = Array.isArray(text) ? text : [text];
  let wordIndex = 0;

  return (
    <Tag ref={ref} className={cn(className)} aria-label={lines.join(" ")}>
      {lines.map((line, li) => {
        const lineCls = Array.isArray(lineClassName) ? lineClassName[li] : lineClassName;
        return (
          <span key={li} className={cn("block", lineCls)} aria-hidden>
            {line.split(" ").map((word, wi) => {
              const i = wordIndex++;
              return (
                <span key={`${li}-${wi}`} className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
                  <motion.span
                    className="inline-block will-change-transform"
                    initial={reduce ? false : { y: "110%", opacity: 0 }}
                    animate={inView ? { y: "0%", opacity: 1 } : undefined}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: delay + i * stagger }}
                  >
                    {word}
                  </motion.span>
                  {wi < line.split(" ").length - 1 ? "\u00A0" : ""}
                </span>
              );
            })}
          </span>
        );
      })}
    </Tag>
  );
}
