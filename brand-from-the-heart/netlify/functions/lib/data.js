/* The app's libraries on the server: the same browser files the page loads
   (they assign to window.*), bundled into the function by esbuild.
   win.js runs first and points `window` at globalThis. */
import './win.js';
import '../../../public/palettes.js';
import '../../../public/fonts.js';
import '../../../public/brands.js';
import '../../../public/questions.js';
import '../../../public/quiz.js';

const W = globalThis;
export const PALETTES = W.BFH_PALETTES || [];
export const MOODS = W.BFH_MOODS || [];
export const FONTS = W.BFH_FONTS || [];
export const FONT_STYLES = W.BFH_FONT_STYLES || [];
export const BRANDS = W.BFH_BRANDS || [];
export const ARCHETYPES = W.BFH_ARCHETYPES || [];
export const QUESTIONS = W.BFH_QUESTIONS || [];
export const TOT = W.BFH_TOT || [];
export const QUIZ_RESULTS = W.BFH_QUIZ_RESULTS || {};
export const QUIZ = W.BFH_QUIZ || [];
export const COLOR = W.BFH_COLOR;
