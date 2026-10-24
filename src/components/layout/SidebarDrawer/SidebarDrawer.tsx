"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { IconButton } from "@/components/ui";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import { usePresence } from "@/hooks/usePresence";

/** Phones: below Tailwind's `md`, the sidebar lives in a drawer. */
const DESKTOP_QUERY = "(min-width: 768px)";

type SidebarDrawerState = {
  /** Whether this shell has a sidebar at all (the builder runs without one). */
  available: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  isAr: boolean;
};

const SidebarDrawerContext = createContext<SidebarDrawerState>({
  available: false,
  open: false,
  setOpen: () => {},
  isAr: false,
});

/** Where the sidebar being rendered sits: beside the page, or in the drawer. */
type SidebarPlacement = "inline" | "drawer";

const SidebarPlacementContext = createContext<SidebarPlacement>("inline");

const useSidebarDrawer = () => useContext(SidebarDrawerContext);
const useSidebarPlacement = () => useContext(SidebarPlacementContext);

type SidebarDrawerProviderProps = { available: boolean; isAr: boolean; children: ReactNode };

const SidebarDrawerProvider = ({ available, isAr, children }: SidebarDrawerProviderProps) => {
  const [open, setOpen] = useState(false);
  return (
    <SidebarDrawerContext.Provider value={{ available, open: available && open, setOpen, isAr }}>
      {children}
    </SidebarDrawerContext.Provider>
  );
};

type DrawerPanelProps = { onClose: () => void; closing: boolean; isAr: boolean; children: ReactNode };

const DrawerPanel = ({ onClose, closing, isAr, children }: DrawerPanelProps) => {
  // Escape closes it and focus goes back to the menu button.
  useModalDismiss(onClose);
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus moves into the drawer so the keyboard starts where the eye does.
  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>("a[href], button:not(:disabled)")?.focus();
  }, []);

  return (
    <div className={`fixed inset-0 z-modal md:hidden ${closing ? "pointer-events-none" : ""}`}>
      <button
        type="button"
        tabIndex={-1}
        aria-label={isAr ? "إغلاق القائمة" : "Close menu"}
        onClick={onClose}
        className={`absolute inset-0 cursor-default bg-scrim ${closing ? "animate-fade-out" : "animate-fade-in"}`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={isAr ? "القائمة" : "Menu"}
        // On the side the reader starts on: the left in English, the right in
        // Arabic. It crossfades in and out, like every overlay.
        className={`absolute inset-y-0 start-0 flex bg-surface-1 shadow-edge-modal ${closing ? "animate-fade-out" : "animate-fade-in"}`}
      >
        <SidebarPlacementContext.Provider value="drawer">{children}</SidebarPlacementContext.Provider>
      </div>
    </div>
  );
};

type MobileSidebarProps = { children: ReactNode };

/**
 * The sidebar on a phone: off-canvas until the menu button opens it.
 *
 * It closes on its own when a link in it is followed, when the window widens
 * past phone size (the inline sidebar takes over), on Escape and on a tap
 * outside it.
 */
const MobileSidebar = ({ children }: MobileSidebarProps) => {
  const { open, setOpen, isAr } = useSidebarDrawer();
  const { mounted, closing } = usePresence(open);
  const pathname = usePathname();

  useEffect(() => {
    // A navigation is what closes it.
    setOpen(false);
  }, [pathname, setOpen]);

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => mql.matches && setOpen(false);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [setOpen]);

  if (!mounted) return null;
  return (
    <DrawerPanel onClose={() => setOpen(false)} closing={closing} isAr={isAr}>
      {children}
    </DrawerPanel>
  );
};

type SidebarMenuButtonProps = { className?: string };

/** Opens the sidebar drawer. Phones only, and only where there is a sidebar. */
const SidebarMenuButton = ({ className = "" }: SidebarMenuButtonProps) => {
  const { available, open, setOpen, isAr } = useSidebarDrawer();
  if (!available) return null;
  return (
    <IconButton
      icon="bars"
      iconSize={18}
      label={isAr ? "فتح القائمة" : "Open menu"}
      aria-expanded={open}
      onClick={() => setOpen(true)}
      className={`-ms-1.5 size-9 text-text-muted hover:text-text md:hidden ${className}`}
    />
  );
};

export { MobileSidebar, SidebarDrawerProvider, SidebarMenuButton, useSidebarDrawer, useSidebarPlacement };
export type { SidebarDrawerState, SidebarPlacement };
