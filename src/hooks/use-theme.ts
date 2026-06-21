import { useState, useEffect } from "react";
import { useAppData } from "@/lib/app-data";

export function useTheme() {
  const { settings } = useAppData();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mode = settings.themeMode ?? "system";

    if (mode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDark(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      setIsDark(mode === "dark");
    }
  }, [settings.themeMode]);

  return { isDark };
}
