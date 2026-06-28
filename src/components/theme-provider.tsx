import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
type Ctx = { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void };
const ThemeCtx = createContext<Ctx | null>(null);

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme] = useState<Theme>("light");

  useEffect(() => {
    applyTheme("light");
    try { localStorage.setItem("ap-theme", "light"); } catch {}
  }, []);

  const setTheme = (_t: Theme) => {
    applyTheme("light");
  };

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, toggle: () => {} }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const c = useContext(ThemeCtx);
  if (!c) return { theme: "light" as Theme, toggle: () => {}, setTheme: () => {} };
  return c;
}