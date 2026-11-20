# SAVAGE✰ — motion portfolio

React + Vite, React Three Fiber, GSAP ScrollTrigger and Lenis.

```bash
npm install
npm run dev      # local dev
npm run build    # static build in dist/, deploy to Vercel / Netlify / GitHub Pages
```

- Project content: `src/data/projects.ts` (screenshots live in `public/work/`)
- Hero figure: `public/hero/gabimaru.webp`, a transparent cut-out (square, waist-up works best). If the file is missing the hero renders without it.
- Hero paper planes: cel-shaded toon material with ink outlines, see `src/components/HeroScene.tsx`
- Palette and type: CSS variables at the top of `src/styles.css`
