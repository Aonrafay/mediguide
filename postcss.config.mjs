const config = {
  // Tailwind v4 via PostCSS — used by webpack builds (`next build --webpack`).
  // Turbopack (dev) keeps its faster @tailwindcss/turbopack rule in next.config.ts.
  plugins: ["@tailwindcss/postcss"],
};

export default config;
