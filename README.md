# My Portfolio Website

Hey! This is my personal site.

Drag a hat onto the cat and the page
transforms. 

The background, the title, the side panels all swap to match
whatever I was up to.

Hopefully it's as fun to click around as it was to build.

## Run it locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) and start dragging hats.

## Built with

- **Next.js** (App Router) + **TypeScript**
- **anime.js** for the drag, snap, and float animations
- **Tailwind CSS** + **shadcn/ui** for styling
- Deployed on **Vercel**

## Poking around

- `app/page.tsx` — the cat, the hats, the drag/snap logic, responsive layout
- `app/components/` — the side-panel widgets (each hat gets its own theme)
- `public/` — hats, the cat, and other assets


