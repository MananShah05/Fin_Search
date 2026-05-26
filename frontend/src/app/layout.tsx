"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import { initFirebase, onAuthChange, signInWithGoogle, logOut } from "@/lib/firebase";
import type { User } from "firebase/auth";
import "@/styles/globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    initFirebase();

    const unsubscribe = onAuthChange((fbUser) => {
      setUser(fbUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
    lenisRef.current = lenis;

    return () => {
      lenis.destroy();
    };
  }, []);

  const handleSignIn = async () => {
    await signInWithGoogle();
  };

  const handleSignOut = async () => {
    await logOut();
    router.push("/");
  };

  const navLinks = [
    { href: "/search", label: "Search" },
    ...(user ? [{ href: "/history", label: "History" }] : []),
    ...(user ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <html lang="en">
      <head>
        <title>FinSearch — Semantic Search for Financial Reports</title>
        <meta
          name="description"
          content="Semantic search engine for financial reports and regulatory filings."
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-black/8">
          <div className="max-w-container mx-auto px-6 h-16 flex items-center justify-between">
            <a
              href="/"
              className="text-lg font-semibold tracking-tight text-accent"
            >
              FinSearch
            </a>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors ${
                    pathname.startsWith(link.href)
                      ? "text-accent font-medium"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              {authLoading ? (
                <div className="skeleton h-8 w-20 rounded-lg" />
              ) : user ? (
                <div className="hidden md:flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-accent text-white
                             rounded-lg text-sm font-medium hover:bg-accent-light transition-colors"
                >
                  Sign in
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden border-t border-black/8"
              >
                <div className="px-6 py-4 space-y-3">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block text-sm ${
                        pathname.startsWith(link.href)
                          ? "text-accent font-medium"
                          : "text-gray-500"
                      }`}
                    >
                      {link.label}
                    </a>
                  ))}
                  {user ? (
                    <button
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="text-sm text-gray-400"
                    >
                      Sign out
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleSignIn();
                        setMobileMenuOpen(false);
                      }}
                      className="text-sm text-accent font-medium"
                    >
                      Sign in
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: "easeInOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="border-t border-black/8 py-6">
          <div className="max-w-container mx-auto px-6 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              FinSearch v1.0
            </span>
            <span className="text-xs text-gray-400">
              Semantic search for financial reports
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}