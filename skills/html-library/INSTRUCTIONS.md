The HTML Library registry: 191 copy-paste UI components written in plain HTML + Tailwind CSS.

Not React. No package to install, no CLI, no build step. A component is a self-contained fragment of markup; "installing" it means pasting files[0].content into anything that accepts a class attribute — HTML, Vue, Svelte, Astro, Blade, ERB, Jinja, or JSX after renaming class to className.

READ THIS BEFORE GENERATING MARKUP
Call get_design_guide once at the start of any task that writes or edits component markup, and get_category_guide when you are working inside one category. They carry the measured design language — type scale, radius rhythm, dark-mode strategy, state vocabulary — that these few lines can only summarise. Everything below is the short version.

THE RULES
1. It is class, never className. These are HTML files.
2. Never add JavaScript. Interactivity is CSS-only — hidden radios and checkboxes driving peer-checked:, group-has-[...]: and :has(). Call get_interactivity_pattern instead of reaching for a script.
3. 54 of the 191 components use theme tokens that resolve only inside the docs app and render invisible anywhere else. Run check_portability on markup before pasting it into another project.
4. Every colour utility needs its dark: partner.
5. Re-namespace id / for / name if you paste a component twice — CSS-only state is keyed on them, and named peers are never used, so a hidden input must stay the immediate previous sibling.
6. Keep any <style> block; it carries keyframes or a scoped palette that utilities cannot express.

THE LOOK, IN ONE PARAGRAPH
Light side uses named grays, dark side switches to alpha-on-white: bg-white/dark:bg-neutral-950, border-gray-200/dark:border-white/10, text-gray-900/dark:text-gray-100. Primary action is bg-gray-900 text-white / dark:bg-white dark:text-neutral-900. Sizes are arbitrary values (text-[13px], text-[13.5px]), not text-sm. Radius rhythm is control rounded-lg, container rounded-xl, pill rounded-full. Three palettes ship — Tailwind-literal, Fluent (--fluent-brand #0f6cbd/#479ef5) and Astryx (--bg-app #f4f4f6/#141414) — and must not be mixed in one screen.

THE CATEGORIES
- apps (6) — mobile screens, fixed 390×844. Radii one step larger (rounded-2xl/3xl), cards borderless, separated by elevation and divide-y. 100% literal Tailwind, so the safest to copy.
- sites (29) — pages at 1280×800 and sections at 1280×auto. Section frame px-6 py-24, display type to text-[56px], cards rounded-2xl.
- agent (23) — chat surfaces on a 640×auto canvas, always mx-auto w-full max-w-2xl. Bubble tail rounded-2xl rounded-br-md. shadow-sm dark:shadow-none.
- ui (23) — primitives on 640×auto. Controls rounded-lg, containers rounded-xl.
- images (110) — photography; each carries a structured recreation prompt.

WHERE TO START
recommend_components when you know the goal, search_components when you know the keyword, get_categories to browse. Then get_component_markup to take the HTML.