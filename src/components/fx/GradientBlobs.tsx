import { cn } from "@/lib/utils";

interface GradientBlobsProps {
  className?: string;
  intensity?: "soft" | "bold";
}

/** Slow-moving blurred colour fields. Pure CSS transforms, GPU friendly. */
export function GradientBlobs({ className, intensity = "soft" }: GradientBlobsProps) {
  const o = intensity === "bold" ? "opacity-60" : "opacity-40";
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div
        className={cn(
          "absolute -left-[10%] top-[-10%] h-[42vw] w-[42vw] min-h-[320px] min-w-[320px] rounded-full bg-electric mix-blend-screen blur-2xl md:blur-3xl animate-blob will-change-transform",
          o,
        )}
        style={{ opacity: undefined }}
      />
      <div
        className={cn(
          "absolute right-[-12%] top-[10%] h-[38vw] w-[38vw] min-h-[300px] min-w-[300px] rounded-full bg-neon mix-blend-screen blur-2xl md:blur-3xl animate-blob-2 will-change-transform",
          intensity === "bold" ? "opacity-35" : "opacity-20",
        )}
      />
      <div
        className={cn(
          "absolute bottom-[-20%] left-[30%] h-[36vw] w-[36vw] min-h-[280px] min-w-[280px] rounded-full bg-azure mix-blend-screen blur-2xl md:blur-3xl animate-blob will-change-transform [animation-delay:-9s]",
          intensity === "bold" ? "opacity-40" : "opacity-25",
        )}
      />
    </div>
  );
}
