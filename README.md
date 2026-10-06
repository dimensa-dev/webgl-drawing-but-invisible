# WebGL: drawing, but invisible — 30,912 points

A small, dependency-free WebGL2 demo of a bug we hit in our own site hero: the scene draws
30,912 points every frame, the console is clean, and the canvas still looks black.

The demo proves it with numbers instead of guessing:

- **Draw calls counted** — `drawArrays` is wrapped, so you see every call happen.
- **Points per draw** — all 30,912 points are sent each frame.
- **Brightest centre pixel** — `readPixels` samples the centre right after the draw.
  In the "Before" state the brightest pixel is almost the background colour `#0b1017`.

Toggle **Before: the bug** / **After: the fix** to see the difference. The fix is not in the
geometry or the shader logic: it is colour, alpha and point size.

## Run it

Open `index.html` in a browser with WebGL2 (any current Chrome, Firefox, Safari or Edge).
No build step, no libraries.

## Full write-up

Symptom, evidence, root cause, fix and the tested snippet:
**[Three.js scene not rendering? Prove why before you touch the shader](https://dimensa.dev/en/threejs-scene-not-rendering)**

Made by [Dimensa](https://dimensa.dev) — websites, real browser 3D, Next.js/React apps and
evidence-first fixes for broken Next.js/Vercel apps.

## License

MIT — see `LICENSE`.
