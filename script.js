// The bug from our own WebGL hero, rebuilt: 30,912 points drawn every frame,
// yet nearly invisible. The numbers are real: every drawArrays is counted and
// readPixels samples the centre right after the draw.
// Write-up: https://dimensa.dev/en/threejs-scene-not-rendering
const PUNTEN = 30912, BG = [0x0b, 0x10, 0x17], BLOK = 32;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const STANDEN = {
  voor: { laag: hex("#33445a"), hoog: hex("#33445a"), alfa: 0.08, grootte: 1.5 },
  na: { laag: hex("#2f7f74"), hoog: hex("#99f6e4"), alfa: 0.9, grootte: 2.4 },
};
let stand = "voor";

const canvas = document.getElementById("c");
const gl = canvas.getContext("webgl2", { antialias: false });
const dpr = Math.min(devicePixelRatio || 1, 2);
canvas.width = Math.round(canvas.clientWidth * dpr);
canvas.height = Math.round(canvas.clientHeight * dpr);
gl.viewport(0, 0, canvas.width, canvas.height);

const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); return x; };
const prog = gl.createProgram();
gl.attachShader(prog, sh(gl.VERTEX_SHADER, `#version 300 es
in vec3 positie; uniform float hoek, aspect, grootte; out float diepte;
void main() {
  float c = cos(hoek), s = sin(hoek);
  vec3 p = vec3(c * positie.x + s * positie.z, positie.y, -s * positie.x + c * positie.z);
  float z = p.z + 2.6;
  diepte = clamp((3.6 - z) / 2.0, 0.0, 1.0);
  gl_Position = vec4(p.x * 1.6 / z / aspect, p.y * 1.6 / z, 0.0, 1.0);
  gl_PointSize = grootte;
}`));
gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, `#version 300 es
precision mediump float; in float diepte; uniform vec3 laag, hoog; uniform float alfa; out vec4 kleur;
void main() { kleur = vec4(mix(laag, hoog, diepte), alfa); }`));
gl.linkProgram(prog);
gl.useProgram(prog);

const data = new Float32Array(PUNTEN * 3);
let zaad = 12345;
const rnd = () => ((zaad = (zaad * 1664525 + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < PUNTEN; i++) {
  const u = rnd() * 2 - 1, t = rnd() * Math.PI * 2, r = 0.85 + rnd() * 0.15, q = Math.sqrt(1 - u * u);
  data.set([r * q * Math.cos(t), r * u, r * q * Math.sin(t)], i * 3);
}
gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
const loc = gl.getAttribLocation(prog, "positie");
gl.enableVertexAttribArray(loc);
gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.clearColor(BG[0] / 255, BG[1] / 255, BG[2] / 255, 1);
const U = (n) => gl.getUniformLocation(prog, n);
gl.uniform1f(U("aspect"), canvas.width / canvas.height);

// The measurement: wrap drawArrays, count, and read pixels right after the draw.
let calls = 0, laatste = -Infinity;
const px = new Uint8Array(BLOK * BLOK * 4);
const origineel = gl.drawArrays.bind(gl);
gl.drawArrays = (mode, first, count) => {
  origineel(mode, first, count);
  calls++;
  const nu = performance.now();
  if (nu - laatste < 500) return;
  laatste = nu;
  gl.readPixels((canvas.width - BLOK) >> 1, (canvas.height - BLOK) >> 1, BLOK, BLOK, gl.RGBA, gl.UNSIGNED_BYTE, px);
  let best = [0, 0, 0], bestL = -1;
  for (let i = 0; i < px.length; i += 4) {
    const l = px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11;
    if (l > bestL) { bestL = l; best = [px[i], px[i + 1], px[i + 2]]; }
  }
  const h = "#" + best.map((v) => v.toString(16).padStart(2, "0")).join("");
  document.getElementById("calls").textContent = calls.toLocaleString("en-US");
  document.getElementById("punten").textContent = count.toLocaleString("en-US");
  document.getElementById("hex").textContent = h;
  document.getElementById("swatch").style.background = h;
  document.getElementById("verdict").textContent = Math.hypot(...best.map((v, i) => v - BG[i])) > 40
    ? "Verdict: drawing, and visible."
    : "Verdict: drawing, but invisible. All points are drawn, yet the brightest pixel is almost the background colour #0b1017.";
};

for (const id of ["voor", "na"]) {
  document.getElementById(id).onclick = () => {
    stand = id;
    for (const b of ["voor", "na"]) document.getElementById(b).setAttribute("aria-pressed", String(b === id));
  };
}

const stil = matchMedia("(prefers-reduced-motion: reduce)").matches;
(function teken(t) {
  const s = STANDEN[stand];
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform1f(U("hoek"), stil ? 0.6 : t / 6000);
  gl.uniform1f(U("grootte"), s.grootte * dpr);
  gl.uniform3fv(U("laag"), s.laag);
  gl.uniform3fv(U("hoog"), s.hoog);
  gl.uniform1f(U("alfa"), s.alfa);
  gl.drawArrays(gl.POINTS, 0, PUNTEN);
  requestAnimationFrame(teken);
})(0);
