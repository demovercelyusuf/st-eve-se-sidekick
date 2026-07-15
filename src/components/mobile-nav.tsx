"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SidebarNav } from "./sidebar-nav";

// The workspace nav on small screens: a hamburger in the header that opens a slide-out drawer.
// On lg+ this stays hidden and the fixed sidebar in AppShell takes over.
export function MobileNav() {
  const [open, setOpen] = useState(false);

  // lock the background from scrolling while the drawer is open, and close on Escape
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="grid size-9 place-items-center rounded-[var(--radius)] text-ink hover:bg-accent-soft/60 lg:hidden"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 flex w-72 max-w-[82vw] flex-col border-r border-border bg-surface p-4 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-lg font-bold text-accent">st·eve</span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="grid size-8 place-items-center rounded-full text-sub hover:text-ink"
                >
                  ✕
                </button>
              </div>
              <p className="mb-2 px-2 text-[11px] font-semibold tracking-wide text-sub">WORKSPACE</p>
              <SidebarNav onNavigate={() => setOpen(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
