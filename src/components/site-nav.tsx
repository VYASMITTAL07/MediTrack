"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { HeartPulse, LogOut, Menu, UserPlus } from "lucide-react";
import { useState } from "react";
import { portalNav } from "@/lib/data";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const showLogout =
    ["/patient", "/doctor", "/admin"].some(
      (prefix) =>
        pathname === prefix ||
        (pathname.startsWith(`${prefix}/`) &&
          !pathname.startsWith(`${prefix}/login`) &&
          !pathname.startsWith(`${prefix}/register`))
    );

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    window.location.href = "/login";
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 px-4 backdrop-blur">
      <motion.nav
        initial={{ y: -28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex max-w-7xl items-center justify-between py-3"
      >
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <HeartPulse className="size-5" />
          </span>
          <span>MediTrack</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {portalNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
                pathname === item.href && "text-foreground"
              )}
            >
              {pathname === item.href && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-md bg-muted"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              )}
              <span className="relative">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {showLogout ? (
            <Button className="hidden md:inline-flex" onClick={logout}>
              <LogOut className="mr-2 size-4" />
              Logout
            </Button>
          ) : (
            <Button asChild className="hidden md:inline-flex">
              <Link href="/register">
                <UserPlus className="mr-2 size-4" />
                Create Account
              </Link>
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden"
            onClick={() => setOpen((value) => !value)}
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </motion.nav>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-3 grid max-w-sm gap-2 rounded-lg border border-border bg-background p-4 shadow-lg md:hidden"
        >
          {portalNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3 text-sm font-medium hover:bg-foreground/10"
            >
              {item.label}
            </Link>
          ))}
          {showLogout && (
            <button
              onClick={logout}
              className="rounded-2xl px-4 py-3 text-left text-sm font-medium hover:bg-foreground/10"
            >
              Logout
            </button>
          )}
        </motion.div>
      )}
    </header>
  );
}
