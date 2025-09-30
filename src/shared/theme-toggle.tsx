import { useTheme } from "@/providers/theme-context";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      className="text-sm rounded-md px-3 py-1 bg-white/10 hover:bg-white/20"
      onClick={() => setTheme(next)}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}
