# Procedural Art

A collection of small, interactive, mathematically driven animations and visual experiments.

## Intent

This is a creative-coding playground: explore geometry, periodic motion, dynamical systems, numerical patterns and generative art by changing the underlying mathematics and seeing the result immediately.

The aim is to:

- **Keep the feedback loop fluid:** edit a sketch in VS Code, save, and watch Fragment update the live browser preview.
- **Prioritise smoothness and interactivity:** use continuous time, responsive mouse/parameter controls and lightweight client-side rendering.
- **Keep experiments independent:** each sketch lives in its own directory, while all sketches share one local npm/Fragment installation.
- **Publish selected pieces:** build standalone static HTML/JavaScript/CSS that can be embedded in the [GitHub Pages portfolio](https://smcateer.github.io/portfolio/). Visitors run the animations in their own browsers, without a backend.
- **Preserve the source and history:** commit sketches and configuration, not installed dependencies or generated builds.

[Fragment](https://fragment.tools/) is the development environment. Start with JavaScript and Canvas 2D; other sketches can use shaders/WebGL, p5.js or Three.js as needed. This is about exploring many ideas rather than imposing one common mathematical model.

## Structure

```text
procedural-art/
├── .fragment/                   # Fragment project metadata/configuration
├── .gitignore
├── jsconfig.json
├── package.json                 # Fragment dependency
├── package-lock.json            # Reproducible npm dependency versions
└── sketches/
    └── mouse-orbit/
        └── sketch.js            # First working experiment
```

The `mouse-orbit` sketch draws a circle orbiting the pointer. Fragment controls adjust the circle radius, orbit radius and period. It uses a native canvas `mousemove` listener (with cleanup in `dispose()`) and converts screen coordinates to sketch coordinates so mouse tracking works at different Fragment preview zoom levels.

## Set up on a new machine

Install **Git**, **Node.js (LTS)** and **npm** first. Use VS Code if you want the built-in editor, commits and sync workflow.

Clone the repository (authentication is needed while this repository is private):

```bash
git clone https://github.com/smcateer/procedural-art.git
cd procedural-art
```

Install the saved dependencies:

```bash
npm ci
```

`npm ci` uses the checked-in `package-lock.json` to reproduce the dependency versions. If deliberately adding/updating a dependency, use `npm install <package>` instead and commit both `package.json` and `package-lock.json`. No global Fragment installation is needed.

Open the directory in VS Code:

```bash
code .
```

## Run an animation locally

From the repository root:

```bash
npx fragment sketches/mouse-orbit/sketch.js
```

Open the local URL printed by Fragment (normally `http://localhost:3000`). Keep this command running while you edit `sketch.js` in VS Code: saving changes updates the development preview.

Stop the server with `Ctrl+C`.

## Create another sketch

From the **repository root**:

```bash
mkdir -p sketches/new-sketch
npx fragment create sketches/new-sketch/sketch.js --template=2d
npx fragment sketches/new-sketch/sketch.js
```

Choose **JavaScript** if prompted. The 2D template is a simple starting point; see the [Fragment templates](https://fragment.tools/docs/api/cli) for alternatives. You do **not** need a new `npm init` or `npm install` for each sketch.

Keep finished experiments in their directories. Git preserves their history, so there is no need to archive or commit `node_modules/`.

## Build a sketch for GitHub Pages

To turn a sketch into a standalone static webpage:

```bash
npx fragment build sketches/mouse-orbit/sketch.js
```

Follow the interactive prompts to choose an output directory and, if needed, a base path for the eventual URL. The output is **static files**, not necessarily one self-contained HTML file; keep its generated JavaScript/CSS/assets together with `index.html`.

You can test the built output with:

```bash
npx fragment preview <build-directory>
```

Then copy the complete built directory into the portfolio site, for example under `animations/mouse-orbit/`. An embedded portfolio page could use:

```html
<iframe
  src="/portfolio/animations/mouse-orbit/"
  width="600"
  height="400"
  style="border: 0"
  title="Mouse orbit animation">
</iframe>
```

The URL assumes the portfolio continues to be served from `/portfolio/`; adjust it to match its actual deployment path. Check the build's base path if assets fail to load. GitHub Pages serves the result over HTTPS; animation and interaction happen client-side.

**Note:** Fragment's static build is for web publication. Image/GIF/video exports are a separate feature.

## Everyday workflow

1. Edit a sketch in VS Code and view changes in Fragment's live preview.
2. Tune any `props` sliders; put settings you want to preserve into the sketch source.
3. Use VS Code **Source Control** to review, stage and commit changes.
4. **Sync Changes** to push commits to GitHub (and pull other changes).
5. Build and publish selected sketches when ready.

`node_modules/` and `dist/` are excluded by `.gitignore`. Keep `package.json`, `package-lock.json`, code and relevant configuration in Git.

If the README or other files were edited directly on GitHub, **pull/sync the repository in VS Code before making further local commits**, to avoid divergent histories.

## Notes on smooth animation

- Use Fragment's frame updates and continuous `time` (milliseconds) rather than moving objects by a fixed amount per frame.
- For periodic motion, use `theta = 2 * Math.PI * time / (1000 * periodSeconds)`, or Fragment's `playhead` with a defined `duration`.
- Keep drawing work modest, and use shaders/GPU rendering where useful rather than by default.
- Mouse coordinates from DOM events are in displayed canvas pixels; convert using `canvas.getBoundingClientRect()` when the Fragment preview is zoomed.
- Fragment has an `onMouseMove` trigger, but the first experiment used the standard canvas listener after that trigger failed to fire in the local setup.

## References

- [Fragment getting started](https://fragment.tools/docs)
- [Fragment CLI](https://fragment.tools/docs/api/cli)
- [Building a sketch](https://fragment.tools/docs/guide/building-a-sketch)
- [Fragment source](https://github.com/raphaelameaume/fragment)
