import * as React from "react"

type Theme = "dark" | "light" | "system"
type ColorScheme = "default" | "blue" | "green" | "purple" | "orange"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  defaultColorScheme?: ColorScheme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  colorScheme: ColorScheme
  setTheme: (theme: Theme) => void
  setColorScheme: (colorScheme: ColorScheme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  colorScheme: "default",
  setTheme: () => null,
  setColorScheme: () => null,
}

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultColorScheme = "default",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(
    () => (typeof window !== "undefined" && (localStorage.getItem(storageKey) as Theme)) || defaultTheme
  )

  const [colorScheme, setColorScheme] = React.useState<ColorScheme>(
    () => (typeof window !== "undefined" && (localStorage.getItem(`${storageKey}-color`) as ColorScheme)) || defaultColorScheme
  )

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const root = window.document.documentElement

    // Remove all color scheme classes
    root.classList.remove("theme-default", "theme-blue", "theme-green", "theme-purple", "theme-orange")

    // Add new color scheme class
    root.classList.add(`theme-${colorScheme}`)
  }, [colorScheme])

  const value = {
    theme,
    colorScheme,
    setTheme: (theme: Theme) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, theme)
      }
      setTheme(theme)
    },
    setColorScheme: (colorScheme: ColorScheme) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(`${storageKey}-color`, colorScheme)
      }
      setColorScheme(colorScheme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
