// src/polyfills.js
import { Buffer } from 'buffer';

window.Buffer = Buffer;
window.global = window;
window.globalThis = window;

if (typeof window.Request === 'undefined') {
  window.Request = fetch('').constructor;
}
if (typeof window.Headers === 'undefined') {
  window.Headers = new window.Request('').headers.constructor;
}
if (typeof window.Response === 'undefined') {
  window.Response = new Response().constructor;
}
