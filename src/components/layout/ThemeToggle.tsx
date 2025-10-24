
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";

const TOGGLE_CLASSES =
  "relative flex h-7 w-14 cursor-pointer items-center rounded-full p-1 transition-colors duration-300";
const CIRCLE_CLASSES =
  "h-5 w-5 rounded-full bg-background shadow-md flex items-center justify-center";
const ICON_CLASSES = "transition-colors duration-300";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { updateSettings } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleToggle = () => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    // Dispatch ke context (ThemeSync akan handle setTheme)
    updateSettings({ theme: newTheme });
  };

  if (!mounted) {
    return <div className="h-7 w-14 animate-pulse rounded-full bg-muted" />;
  }
  
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={handleToggle}
      className={cn(
        TOGGLE_CLASSES,
        isDark ? "bg-muted" : "bg-primary"
      )}
      aria-label="Toggle theme"
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          CIRCLE_CLASSES,
          isDark ? "ml-auto" : "mr-auto"
        )}
      >
        <motion.div
          key={isDark ? "moon" : "sun"}
          initial={{ opacity: 0, rotate: -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          exit={{ opacity: 0, rotate: 90 }}
          transition={{ duration: 0.25 }}
        >
          {isDark ? (
            <Moon className={cn(ICON_CLASSES, "text-white")} size={14} />
          ) : (
            <Sun className={cn(ICON_CLASSES, "text-gray-900")} size={14} />
          )}
        </motion.div>
      </motion.div>
    </button>
  );
}
