import type { Config } from "tailwindcss";

// Every colour here resolves to a CSS variable declared in src/app/tokens.css,
// so light and dark switch without a second Tailwind palette. Never add a hex
// value to this file — add the token to tokens.css and reference it here.
const t = (name: string) => `var(--pp-${name})`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // brand: navigation position, primary action, selection. Three jobs.
        brand: {
          DEFAULT: t("brand"),
          hover: t("brand-hover"),
          pressed: t("brand-pressed"),
          soft: t("brand-soft"),
          border: t("brand-border"),
          text: t("brand-text"),
          on: t("on-brand")
        },
        canvas: t("canvas"),
        surface: {
          DEFAULT: t("surface"),
          sunken: t("surface-sunken"),
          raised: t("surface-raised"),
          hover: t("surface-hover"),
          selected: t("surface-selected")
        },
        hairline: {
          DEFAULT: t("hairline"),
          strong: t("hairline-strong")
        },
        ink: {
          DEFAULT: t("ink"),
          secondary: t("ink-secondary"),
          muted: t("ink-muted"),
          disabled: t("ink-disabled"),
          inverse: t("ink-inverse")
        },
        // The status ramp owns operational meaning. Six channels, no seventh.
        queued: { soft: t("queued-soft"), text: t("queued-text"), solid: t("queued-solid") },
        transit: { soft: t("transit-soft"), text: t("transit-text"), solid: t("transit-solid") },
        attention: { soft: t("attention-soft"), text: t("attention-text"), solid: t("attention-solid") },
        breach: { soft: t("breach-soft"), text: t("breach-text"), solid: t("breach-solid") },
        settled: { soft: t("settled-soft"), text: t("settled-text"), solid: t("settled-solid") },
        // AI provenance: marks proposed-and-unconfirmed. Stripped on confirmation.
        ai: { soft: t("ai-soft"), text: t("ai-text"), solid: t("ai-solid"), border: t("ai-border") },
        chart: {
          1: t("chart-1"), 2: t("chart-2"), 3: t("chart-3"),
          4: t("chart-4"), 5: t("chart-5"), 6: t("chart-6"),
          grid: t("chart-grid")
        }
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Bengali", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      },
      fontSize: {
        display: ["30px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
        "heading-xl": ["24px", { lineHeight: "1.25", letterSpacing: "-0.02em", fontWeight: "600" }],
        "heading-lg": ["20px", { lineHeight: "1.3", letterSpacing: "-0.015em", fontWeight: "600" }],
        "heading-md": ["16px", { lineHeight: "1.4", letterSpacing: "-0.01em", fontWeight: "600" }],
        "heading-sm": ["14px", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["15px", { lineHeight: "1.55" }],
        "body-md": ["14px", { lineHeight: "1.5" }],
        "body-sm": ["13px", { lineHeight: "1.45" }],
        label: ["13px", { lineHeight: "1.3", fontWeight: "500" }],
        caption: ["12px", { lineHeight: "1.4" }],
        overline: ["11px", { lineHeight: "1.2", letterSpacing: "0.06em", fontWeight: "600" }],
        numeric: ["14px", { lineHeight: "1.4", fontWeight: "500" }],
        "numeric-lg": ["22px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
        "mono-md": ["13px", { lineHeight: "1.4", fontWeight: "500" }],
        "mono-sm": ["12px", { lineHeight: "1.5" }],
        kbd: ["11px", { lineHeight: "1", fontWeight: "500" }]
      },
      spacing: {
        xxs: "2px", xs: "4px", sm: "8px", md: "12px", base: "16px",
        lg: "20px", xl: "24px", xxl: "32px", xxxl: "40px",
        page: "32px", "page-mobile": "20px",
        // density-aware, follows data-density on :root
        row: "var(--pp-row-h)",
        control: "var(--pp-control-h)",
        "cell-y": "var(--pp-cell-py)",
        "cell-x": "var(--pp-cell-px)",
        stack: "var(--pp-stack-gap)"
      },
      borderRadius: {
        xs: "4px", sm: "6px", md: "8px", lg: "12px", xl: "16px", pill: "9999px"
      },
      boxShadow: {
        e1: t("e1"), e2: t("e2"), e3: t("e3"), e4: t("e4"),
        focus: `0 0 0 2px ${t("canvas")}, 0 0 0 4px ${t("brand")}`,
        "focus-danger": `0 0 0 2px ${t("canvas")}, 0 0 0 4px ${t("breach-solid")}`
      },
      transitionDuration: {
        instant: "80ms", fast: "140ms", base: "200ms", slow: "320ms"
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
        entrance: "cubic-bezier(0.05, 0.7, 0.1, 1)",
        exit: "cubic-bezier(0.3, 0, 0.8, 0.15)"
      },
      // Never write a raw z-index; pick the nearest rung or add a named one.
      zIndex: {
        base: "0", sticky: "20", sidebar: "30", dropdown: "50",
        drawer: "60", modal: "80", toast: "90", tooltip: "100"
      },
      screens: { sm: "640px", md: "880px", lg: "1280px" },
      maxWidth: { page: "1100px" }
    }
  },
  plugins: []
} satisfies Config;
