"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

// The primary call-to-action as a Link that presses. Same look as a button, with a little give.
export const MotionLink = motion.create(Link);

// Fade-and-rise a block in on mount. Used for the above-the-fold landing content, so it animates
// straight in on load rather than waiting on a scroll trigger (no flash of hidden content).
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// The landing mascot: visible on every screen size (smaller on phones), with a slow idle float
// that stops for reduced-motion. Served through next/image.
export function FloatingMascot({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      animate={reduce ? {} : { y: [0, -7, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    >
      <Image
        src="/steve.png"
        alt="st·eve, the copilot mascot"
        width={132}
        height={132}
        priority
        className="h-auto w-24 object-contain drop-shadow-xl sm:w-[132px]"
      />
    </motion.div>
  );
}
