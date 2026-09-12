/*!
 * Canvas UI — Liquid (vanilla WebGL build)
 * Source: https://github.com/DavidHDev/canvas-ui (components/canvasui/LiquidVanilla.ts + rect-cache.ts)
 * License: MIT + Commons Clause — (c) 2026 David Haz. https://canvasui.dev
 * Bundled with esbuild (IIFE, global: CanvasUI). Used here as part of a website per license.
 */
var CanvasUI=(()=>{var Q=Object.defineProperty;var Le=Object.getOwnPropertyDescriptor;var Ce=Object.getOwnPropertyNames;var De=Object.prototype.hasOwnProperty;var we=(a,l)=>{for(var n in l)Q(a,n,{get:l[n],enumerable:!0})},Pe=(a,l,n,m)=>{if(l&&typeof l=="object"||typeof l=="function")for(let R of Ce(l))!De.call(a,R)&&R!==n&&Q(a,R,{get:()=>l[R],enumerable:!(m=Le(l,R))||m.enumerable});return a};var Ae=a=>Pe(Q({},"__esModule",{value:!0}),a);var He={};we(He,{createLiquid:()=>qe,supportsHtmlInCanvas:()=>Ne});function de(a){let l=a.getBoundingClientRect(),n=()=>{l=a.getBoundingClientRect()},m=new ResizeObserver(n);return m.observe(a),window.addEventListener("resize",n,{passive:!0}),window.addEventListener("scroll",n,{capture:!0,passive:!0}),{get current(){return l},destroy(){m.disconnect(),window.removeEventListener("resize",n),window.removeEventListener("scroll",n,!0)}}}var _e={simResolution:128,dyeResolution:512,densityDissipation:.96,velocityDissipation:1,pressure:.8,pressureIterations:4,curl:1.9,radius:.3,force:1.1,intensity:2,distortion:.4,blend:5,color:[.145,.239,.867],rainbow:!1},pe=1/60;function J(a){return a<=.04045?a/12.92:Math.pow((a+.055)/1.055,2.4)}var Ue=`#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
uniform vec2 texelSize;
void main () {
  vUv = aPos * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`,Fe=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uContent;
uniform sampler2D uFluid;
uniform vec3 uColor;
uniform float uDistortion;
uniform float uIntensity;
uniform float uBlend;
uniform float uRainbow;
uniform float uHasContent;
vec3 toLinear (vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}
vec3 toSrgb (vec3 c) {
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
void main () {
  vec3 fluid = texture(uFluid, vUv).rgb;
  if (uHasContent < 0.5) {
    float mag = length(fluid);
    vec3 tint = uRainbow == 1.0
      ? clamp(fluid / max(mag, 1e-3), 0.0, 1.0)
      : uColor;
    float overlay = (1.0 - exp(-mag * uIntensity * 0.5)) * 0.82;
    outColor = vec4(toSrgb(clamp(tint, 0.0, 1.0)) * overlay, overlay);
    return;
  }
  vec2 uv = vUv - fluid.rg * uDistortion * 0.001;
  vec4 content = texture(uContent, vec2(uv.x, 1.0 - uv.y));
  content.rgb = toLinear(content.rgb);
  vec3 tint = uRainbow == 1.0 ? fluid : uColor * length(fluid);
  vec4 fluidColor = vec4(tint, 1.0);
  vec4 blended = mix(content, fluidColor, uBlend * 0.01 * clamp(length(fluid), 0.0, 1.0));
  vec4 final = mix(blended, vec4(0.0), 1.0 - content.a);
  outColor = vec4(toSrgb(clamp(final.rgb, 0.0, 1.0)), final.a);
}`,Se=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uTarget;
uniform float uAspect;
uniform vec3 uColor;
uniform vec2 uPoint;
uniform float uRadius;
void main () {
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  vec3 splat = exp(-dot(p, p) / uRadius) * uColor;
  vec3 base = texture(uTarget, vUv).xyz;
  outColor = vec4(base + splat, 1.0);
}`,Be=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float uDt;
uniform float uDissipation;
void main () {
  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * texelSize;
  outColor = uDissipation * texture(uSource, coord);
  outColor.a = 1.0;
}`,Ie=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uTexture;
uniform float uValue;
void main () {
  outColor = uValue * texture(uTexture, vUv);
}`,Me=`#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 outColor;
uniform sampler2D uVelocity;
void main () {
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) { L = -C.x; }
  if (vR.x > 1.0) { R = -C.x; }
  if (vT.y > 1.0) { T = -C.y; }
  if (vB.y < 0.0) { B = -C.y; }
  float div = 0.5 * (R - L + T - B);
  outColor = vec4(div, 0.0, 0.0, 1.0);
}`,Ge=`#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 outColor;
uniform sampler2D uVelocity;
void main () {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  float vorticity = R - L - T + B;
  outColor = vec4(vorticity, 0.0, 0.0, 1.0);
}`,Ve=`#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 outColor;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float uCurlStrength;
uniform float uDt;
void main () {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = vec2(abs(T) - abs(B), abs(R) - abs(L)) * 0.5;
  force /= length(force) + 1.0;
  force *= uCurlStrength * C;
  force.y *= -1.0;
  vec2 velocity = texture(uVelocity, vUv).xy;
  outColor = vec4(velocity + force * uDt, 0.0, 1.0);
}`,Xe=`#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 outColor;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main () {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float divergence = texture(uDivergence, vUv).x;
  float pressure = (L + R + B + T - divergence) * 0.25;
  outColor = vec4(pressure, 0.0, 0.0, 1.0);
}`,Oe=`#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 outColor;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main () {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity.xy -= vec2(R - L, T - B);
  outColor = vec4(velocity, 0.0, 1.0);
}`;function Ne(){if(typeof document=="undefined")return!1;let a=document.createElement("canvas"),l=a.getContext("2d");return!!(l&&typeof l.drawElementImage=="function"&&typeof a.requestPaint=="function")}function qe(a,l={}){let n={..._e,...l},{source:m,content:R,output:f}=a,e=f.getContext("webgl2",{alpha:!0,depth:!1,stencil:!1,antialias:!1,premultipliedAlpha:!0});if(!e||e.isContextLost()||!!!(e.getExtension("EXT_color_buffer_float")||e.getExtension("EXT_color_buffer_half_float")))return null;let U=m.getContext("2d"),F=m,w=!!(U&&typeof U.drawElementImage=="function"&&typeof F.requestPaint=="function"),S=!1,K=()=>{};w&&(F.onpaint=()=>{try{U.reset(),U.drawElementImage(R,0,0),S=!0,K()}catch{}});let Z=!!e.getExtension("OES_texture_float_linear")?e.LINEAR:e.NEAREST,$=[];function ee(t,r){let o=e.createShader(t);return e.shaderSource(o,r),e.compileShader(o),e.getShaderParameter(o,e.COMPILE_STATUS)||console.error("Liquid shader error:",e.getShaderInfoLog(o)),$.push(o),o}let xe=ee(e.VERTEX_SHADER,Ue),te=[];function g(t){let r=e.createProgram();e.attachShader(r,xe),e.attachShader(r,ee(e.FRAGMENT_SHADER,t)),e.linkProgram(r),te.push(r);let o={},u=e.getProgramParameter(r,e.ACTIVE_UNIFORMS);for(let s=0;s<u;s++){let c=e.getActiveUniform(r,s);o[c.name]=e.getUniformLocation(r,c.name)}return{program:r,uniforms:o}}let T=g(Fe),h=g(Se),E=g(Be),N=g(Ie),q=g(Me),H=g(Ge),L=g(Ve),B=g(Xe),I=g(Oe),re=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,re),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);function M(t,r,o,u){let s=e.createTexture();e.bindTexture(e.TEXTURE_2D,s),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,u),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,u),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texImage2D(e.TEXTURE_2D,0,r,t,t,0,o,e.HALF_FLOAT,null);let c=e.createFramebuffer();return e.bindFramebuffer(e.FRAMEBUFFER,c),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,s,0),e.viewport(0,0,t,t),e.clearColor(0,0,0,1),e.clear(e.COLOR_BUFFER_BIT),{fbo:c,texture:s,width:t,height:t}}function W(t,r,o,u){let s=M(t,r,o,u),c=M(t,r,o,u);return{get read(){return s},get write(){return c},swap(){let _=s;s=c,c=_}}}function oe(t,r){return{velocity:W(t,e.RG16F,e.RG,Z),dye:W(r,e.RGBA16F,e.RGBA,Z),divergence:M(t,e.R16F,e.RED,e.NEAREST),curl:M(t,e.R16F,e.RED,e.NEAREST),pressure:W(t,e.R16F,e.RED,e.NEAREST)}}let i=oe(n.simResolution,n.dyeResolution);function ne(t){[t.velocity.read,t.velocity.write,t.dye.read,t.dye.write,t.pressure.read,t.pressure.write,t.divergence,t.curl].forEach(r=>{e.deleteFramebuffer(r.fbo),e.deleteTexture(r.texture)})}function ge(t,r){let o=oe(t,r),u=i;i=o,ne(u)}let y=0,b=0;function ie(){let t=Math.max(f.clientWidth,1),r=Math.max(f.clientHeight,1);y=1/(n.simResolution*(t/(r+400))),b=1/n.simResolution}function z(){let t=Math.min(window.devicePixelRatio||1,2),r=Math.max(1,Math.round(f.clientWidth*t)),o=Math.max(1,Math.round(f.clientHeight*t));if((f.width!==r||f.height!==o)&&(f.width=r,f.height=o),w){let u=Math.max(1,Math.round(m.clientWidth)),s=Math.max(1,Math.round(m.clientHeight));(m.width!==u*t||m.height!==s*t)&&(m.width=u*t,m.height=s*t),F.requestPaint()}ie()}z();let G=e.createTexture();e.bindTexture(e.TEXTURE_2D,G),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));function Te(){!w||!S||(S=!1,e.bindTexture(e.TEXTURE_2D,G),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,m))}function d(t){t?(e.bindFramebuffer(e.FRAMEBUFFER,t.fbo),e.viewport(0,0,t.width,t.height)):(e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,f.width,f.height)),e.drawArrays(e.TRIANGLE_STRIP,0,4)}function v(t,r){return e.activeTexture(e.TEXTURE0+r),e.bindTexture(e.TEXTURE_2D,t),r}function Ee(t,r,o,u){let s=f.clientWidth/Math.max(f.clientHeight,1),c=n.radius/100;e.useProgram(h.program),e.uniform1i(h.uniforms.uTarget,v(i.velocity.read.texture,0)),e.uniform1f(h.uniforms.uAspect,s),e.uniform2f(h.uniforms.uPoint,t,r),e.uniform3f(h.uniforms.uColor,o,u,10),e.uniform1f(h.uniforms.uRadius,c),d(i.velocity.write),i.velocity.swap(),e.uniform1i(h.uniforms.uTarget,v(i.dye.read.texture,0)),d(i.dye.write),i.dye.swap()}function Re(t){e.disable(e.BLEND),e.useProgram(H.program),e.uniform2f(H.uniforms.texelSize,y,b),e.uniform1i(H.uniforms.uVelocity,v(i.velocity.read.texture,0)),d(i.curl),e.useProgram(L.program),e.uniform2f(L.uniforms.texelSize,y,b),e.uniform1i(L.uniforms.uVelocity,v(i.velocity.read.texture,0)),e.uniform1i(L.uniforms.uCurl,v(i.curl.texture,1)),e.uniform1f(L.uniforms.uCurlStrength,n.curl),e.uniform1f(L.uniforms.uDt,pe),d(i.velocity.write),i.velocity.swap(),e.useProgram(q.program),e.uniform2f(q.uniforms.texelSize,y,b),e.uniform1i(q.uniforms.uVelocity,v(i.velocity.read.texture,0)),d(i.divergence),e.useProgram(N.program),e.uniform1i(N.uniforms.uTexture,v(i.pressure.read.texture,0)),e.uniform1f(N.uniforms.uValue,Math.pow(n.pressure,t*60)),d(i.pressure.write),i.pressure.swap(),e.useProgram(B.program),e.uniform2f(B.uniforms.texelSize,y,b),e.uniform1i(B.uniforms.uDivergence,v(i.divergence.texture,0));for(let r=0;r<n.pressureIterations;r++)e.uniform1i(B.uniforms.uPressure,v(i.pressure.read.texture,1)),d(i.pressure.write),i.pressure.swap();e.useProgram(I.program),e.uniform2f(I.uniforms.texelSize,y,b),e.uniform1i(I.uniforms.uPressure,v(i.pressure.read.texture,0)),e.uniform1i(I.uniforms.uVelocity,v(i.velocity.read.texture,1)),d(i.velocity.write),i.velocity.swap(),e.useProgram(E.program),e.uniform2f(E.uniforms.texelSize,y,b),e.uniform1i(E.uniforms.uVelocity,v(i.velocity.read.texture,0)),e.uniform1i(E.uniforms.uSource,v(i.velocity.read.texture,0)),e.uniform1f(E.uniforms.uDt,pe),e.uniform1f(E.uniforms.uDissipation,Math.pow(n.velocityDissipation,t*60)),d(i.velocity.write),i.velocity.swap(),e.uniform1i(E.uniforms.uVelocity,v(i.velocity.read.texture,0)),e.uniform1i(E.uniforms.uSource,v(i.dye.read.texture,1)),e.uniform1f(E.uniforms.uDissipation,Math.pow(n.densityDissipation,t*60)),d(i.dye.write),i.dye.swap()}function he(){Te(),e.useProgram(T.program),e.uniform1i(T.uniforms.uContent,v(G,0)),e.uniform1i(T.uniforms.uFluid,v(i.dye.read.texture,1)),e.uniform3f(T.uniforms.uColor,J(n.color[0]),J(n.color[1]),J(n.color[2])),e.uniform1f(T.uniforms.uDistortion,n.distortion),e.uniform1f(T.uniforms.uIntensity,n.intensity),e.uniform1f(T.uniforms.uBlend,n.blend),e.uniform1f(T.uniforms.uRainbow,n.rainbow?1:0),e.uniform1f(T.uniforms.uHasContent,w?1:0),d(null)}let C=[],Y=0,k=performance.now(),j=!1,V=!1,X=!0,ue=0;function ye(){let t=Math.min(n.densityDissipation,.999);return Math.log(1e-7)/Math.log(t)/60*1e3}function se(t){if(j)return;if(!X){V=!1;return}let r=Math.min((t-k)/1e3,1/30);if(k=t,C.length>0)for(ue=t+ye();C.length>0;){let[o,u,s,c]=C.pop();Ee(o,u,s,c)}if(Re(r),he(),t>=ue&&!S){V=!1;return}Y=requestAnimationFrame(se)}function p(){j||V||!X||(V=!0,k=performance.now(),Y=requestAnimationFrame(se))}K=p,p();let O=window.matchMedia("(prefers-reduced-motion: reduce)"),P=O.matches;function ae(){P=O.matches,P||p()}O.addEventListener("change",ae);let A=new Map,ce=de(f);function le(t){if(P)return;let r=ce.current,o=t.clientX-r.left,u=t.clientY-r.top;if(o<0||o>r.width||u<0||u>r.height){A.delete(t.pointerId);return}let s=A.get(t.pointerId);if(A.set(t.pointerId,{x:o,y:u}),!s)return;let c=(o-s.x)*n.force,_=-(u-s.y)*n.force;C.push([o/r.width,1-u/r.height,c,_]),p()}function fe(t){if(P)return;let r=f.getBoundingClientRect(),o=t.clientX-r.left,u=t.clientY-r.top;o<0||o>r.width||u<0||u>r.height||(A.set(t.pointerId,{x:o,y:u}),C.push([o/r.width,1-u/r.height,1,1]),p())}function D(t){A.delete(t.pointerId)}let x=window;x.addEventListener("pointerdown",fe,{passive:!0}),x.addEventListener("pointermove",le,{passive:!0}),x.addEventListener("pointerup",D,{passive:!0}),x.addEventListener("pointerleave",D),x.addEventListener("pointercancel",D);let ve=new ResizeObserver(()=>{z(),p()});ve.observe(f);let me=new IntersectionObserver(t=>{var r,o;X=(o=(r=t[t.length-1])==null?void 0:r.isIntersecting)!=null?o:!0,X&&p()});return me.observe(f),{splat(t,r,o,u){P||(C.push([t,r,o,u]),p())},setOptions(t){var s,c;if(!Object.entries(t).some(([_,be])=>n[_]!==be))return;let r=(s=t.simResolution)!=null?s:n.simResolution,o=(c=t.dyeResolution)!=null?c:n.dyeResolution;(r!==n.simResolution||o!==n.dyeResolution)&&(ge(r,o),n.simResolution=r,n.dyeResolution=o,ie()),Object.assign(n,t),p()},resize(){z(),p()},destroy(){j=!0,ce.destroy(),cancelAnimationFrame(Y),ve.disconnect(),me.disconnect(),O.removeEventListener("change",ae),ne(i),e.deleteTexture(G),te.forEach(t=>e.deleteProgram(t)),$.forEach(t=>e.deleteShader(t)),e.deleteBuffer(re),w&&(F.onpaint=null),x.removeEventListener("pointerdown",fe),x.removeEventListener("pointermove",le),x.removeEventListener("pointerup",D),x.removeEventListener("pointerleave",D),x.removeEventListener("pointercancel",D)}}}return Ae(He);})();
