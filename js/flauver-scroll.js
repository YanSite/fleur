/* Флаувер: движок сцены — фотографии, переходы и камера по прокрутке. Без зависимостей. */
(function () {
  'use strict';
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  function ease(x) { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

  var VS = '#version 300 es\nconst vec2 P[3]=vec2[3](vec2(-1,-1),vec2(3,-1),vec2(-1,3));out vec2 vUV;void main(){vec2 p=P[gl_VertexID];vUV=p*0.5+0.5;gl_Position=vec4(p,0,1);}';
  var FS = '#version 300 es\nprecision highp float;in vec2 vUV;out vec4 o;\n' +
    'uniform sampler2D tA,tB,dA,dB;uniform vec2 uRes;uniform vec4 uWin;uniform vec3 uBg;uniform float uTr,uSideB,uTone,uAspA,uAspB,uZA,uZB,uRA,uRB,uMix,uTime,uBeam,uVel,uScrim,uFade,uSide;uniform vec2 uFA,uFB,uPar,uBeamPos;\n' +
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n' +
    'float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}\n' +
    'float scr(float s,vec2 uv){float c=0.;if(s>.5&&s<1.5)c=(1.-smoothstep(.34,.72,uv.x))*1.12+smoothstep(.86,1.,uv.y)*.45+(1.-smoothstep(0.,.13,uv.y))*.5+smoothstep(.93,1.,uv.x)*.45;else if(s>1.5&&s<2.5)c=1.-smoothstep(.0,.48,uv.y);else if(s>2.5&&s<3.5)c=smoothstep(.52,1.,uv.y);else if(s>3.5&&s<4.5)c=min(1.,(1.-smoothstep(.04,.72,uv.y))*1.2)+smoothstep(.86,1.,uv.y)*.55;else if(s>4.5)c=smoothstep(.28,.66,uv.x)*1.12+smoothstep(.86,1.,uv.y)*.45+(1.-smoothstep(0.,.13,uv.y))*.5;return min(c,1.);}\n' +
    'float sa0(){vec2 wr=uRes*(uWin.zw-uWin.xy);return wr.x/wr.y;}\n' +
    'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n2(p);p*=2.03;a*=.5;}return v;}\n' +
    'vec2 cover(vec2 uv,float asp,float z,float r,vec2 f){vec2 wr=uRes*(uWin.zw-uWin.xy);float sa=wr.x/wr.y;vec2 p=uv-.5;p.x*=sa;float c=cos(r),s=sin(r);p=mat2(c,s,-s,c)*p;float sc=max(1.,sa/asp);p/=z*sc;\n' +
    ' vec2 hx=vec2(.5*sa/(sc*z*asp),.5/(sc*z));vec2 fc=vec2(f.x,1.-f.y);fc=clamp(fc,hx,1.-hx);return vec2(p.x/asp,p.y)+fc;}\n' +
    'vec3 shot(sampler2D t,sampler2D d,vec2 uv,float asp,float z,float r,vec2 f,float k){vec2 q=cover(uv,asp,z,r,f);float dep=texture(d,q).r;\n' +
    ' q+=uPar*(dep-.45)*0.05/z;vec2 dir=(uv-.5);float ca=(0.0015+abs(uVel)*0.006)*k;\n' +
    ' vec3 c=vec3(texture(t,q+dir*ca).r,texture(t,q).g,texture(t,q-dir*ca).b);return c;}\n' +
    'void main(){vec2 suv=vUV;float t=uTime;vec2 uv=(suv-uWin.xy)/max(uWin.zw-uWin.xy,vec2(1e-4));\n' +
    ' if(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.){vec3 bg=uBg+(h(suv*uRes+fract(t*7.)*100.)-.5)*.018;o=vec4(bg,1.);return;}\n' +
    ' vec3 a=shot(tA,dA,uv,uAspA,uZA,uRA,uFA,1.);vec3 col=a;\n' +
    ' if(uMix>0.001){float m=uMix;float edge=0.;\n' +
    '  if(uTr<.5){vec3 b=shot(tB,dB,uv,uAspB,uZB,uRB,uFB,1.);float n=fbm(uv*vec2(3.,2.2)+vec2(t*.03,-t*.02))*.85+(1.-uv.y)*.15;float mm=m*1.3-.15;float e=smoothstep(mm-.12,mm+.12,n);col=mix(b,a,e);edge=1.-abs(e*2.-1.);}\n' +
    '  else if(uTr<1.5){float yb=m*1.08-.04+(fbm(vec2(uv.x*3.,t*.2))-.5)*.05;float e=smoothstep(yb-.012,yb+.012,uv.y);vec3 aa=shot(tA,dA,clamp(uv-vec2(0.,m*.32),0.,1.),uAspA,uZA,uRA,uFA,1.);vec3 b=shot(tB,dB,clamp(uv+vec2(0.,(1.-m)*.32),0.,1.),uAspB,uZB,uRB,uFB,1.);col=mix(b,aa*(1.-m*.35),e);edge=1.-abs(e*2.-1.);}\n' +
    '  else if(uTr<2.5){vec2 c=(uv-.5)*vec2(sa0(),1.);float r=m*1.35*max(1.,1./sa0())*.75;float d=length(c)+(fbm(uv*4.+t*.05)-.5)*.06;float e=smoothstep(r-.015,r+.015,d);vec2 ub=(uv-.5)/(1.+(1.-m)*.18)+.5;vec3 b=shot(tB,dB,ub,uAspB,uZB,uRB,uFB,1.);vec2 ua=(uv-.5)*(1.-m*.08)+.5;vec3 aa=shot(tA,dA,ua,uAspA,uZA,uRA,uFA,1.);col=mix(b,aa*(1.-m*.4),e);edge=1.-abs(e*2.-1.);}\n' +
    '  else if(uTr<3.5){float k=floor(uv.x*6.);float mi=clamp(m*1.7-k*.12,0.,1.);mi=mi*mi*(3.-2.*mi);float e=step(mi,uv.y);vec3 b=shot(tB,dB,clamp(uv+vec2(0.,(1.-mi)*.2),0.,1.),uAspB,uZB,uRB,uFB,1.);col=mix(b,a*(1.-m*.3),e);float fx=fract(uv.x*6.);edge=smoothstep(.02,0.,abs(uv.y-mi))*step(.01,mi)*step(mi,.99)+smoothstep(.006,0.,min(fx,1.-fx))*.3*(1.-abs(m*2.-1.));}\n' +
    '  else if(uTr>4.5){vec3 b=shot(tB,dB,uv,uAspB,uZB,uRB,uFB,1.);col=mix(a,b,smoothstep(.08,.92,m));}\n' +
    '  else{vec2 ua=(uv-.5)/(1.+m*m*.9)+.5;vec3 aa=shot(tA,dA,ua,uAspA,uZA,uRA,uFA,1.+m*4.);vec2 ub=(uv-.5)*(1.+(1.-m)*.35)+.5;vec3 b=shot(tB,dB,ub,uAspB,uZB,uRB,uFB,1.+(1.-m)*4.);float e=smoothstep(.25,.75,m);col=mix(aa,b,e)+vec3(1.,.9,.8)*(1.-abs(m*2.-1.))*.18;}\n' +
    '  col+=vec3(.95,.62,.32)*edge*edge*.22*(1.-abs(uMix*2.-1.));}\n' +
    ' vec2 bd=normalize(vec2(.62,-1.));vec2 bn=vec2(-bd.y,bd.x);vec2 bp=uv-uBeamPos;float dist=dot(bp,bn);float along=dot(bp,bd);\n' +
    ' float beam=exp(-dist*dist/(.012+along*.02))*smoothstep(-.1,.4,along)*smoothstep(1.4,.3,along)*uBeam;\n' +
    ' float haze=fbm(uv*vec2(4.,8.)+vec2(t*.05,t*.08));col+=col*beam*.7+vec3(.95,.74,.48)*beam*(.05+.06*haze);\n' +
    ' vec2 wr2=uRes*(uWin.zw-uWin.xy);float sa=wr2.x/wr2.y;float sc=mix(scr(uSide,uv),scr(uSideB,uv),smoothstep(.2,.8,uMix));\n' +
    ' col=mix(col*(1.-sc*.66),mix(col,vec3(.955,.94,.91),sc*.85),uTone);\n' +
    ' vec2 vv=(uv-.5)*vec2(sa,1.);col*=mix(mix(.55,.86,uTone),1.,smoothstep(1.15,.25,length(vv)*.95));\n' +
    ' col=pow(col,vec3(.96));col+=(h(suv*uRes+fract(t*7.)*100.)-.5)*.035;\n' +
    ' o=vec4(mix(uBg,col,uFade),1.);}';
  var VSP = '#version 300 es\nprecision highp float;uniform float uTime,uBeam,uSize;uniform vec2 uBeamPos,uRes;out float vA;\n' +
    'float h(float n){return fract(sin(n*12.9898)*43758.5453);}\n' +
    'void main(){float i=float(gl_VertexID);vec2 bd=normalize(vec2(.62,-1.));vec2 bn=vec2(-bd.y,bd.x);\n' +
    ' float along=fract(h(i)+uTime*(.006+.01*h(i+3.)))*1.3;float off=(h(i+7.)-.5)*.32+sin(uTime*.3+i)*.02;\n' +
    ' vec2 p=uBeamPos+bd*along+bn*off+vec2(sin(uTime*.4+i*1.7),cos(uTime*.33+i))*.01;\n' +
    ' float w=exp(-off*off/.012)*smoothstep(0.,.25,along)*smoothstep(1.3,.6,along);vA=w*uBeam*(.35+.65*h(i+11.))*(.6+.4*sin(uTime*2.+i));\n' +
    ' gl_Position=vec4(p*2.-1.,0,1);gl_PointSize=uSize*(1.+3.*h(i+5.)*h(i+5.));}';
  var FSP = '#version 300 es\nprecision mediump float;in float vA;out vec4 o;void main(){vec2 c=gl_PointCoord-.5;float d=length(c);float a=smoothstep(.5,.0,d)*vA;o=vec4(vec3(1.,.82,.58)*a,a);}';

  function compile(gl, vs, fs) {
    function sh(t, s) { var x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; }
    var p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var inf = gl.getActiveUniform(p, i); u[inf.name.replace('[0]', '')] = gl.getUniformLocation(p, inf.name); }
    return { p: p, u: u };
  }

  // pseudo depth from luminance + saturation, blurred (subjects pop forward from dark grounds)
  function depthCanvas(img) {
    var W = 160, H = Math.max(2, Math.round(160 * img.height / img.width));
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d'); x.drawImage(img, 0, 0, W, H);
    var d = x.getImageData(0, 0, W, H), px = d.data, v = new Float32Array(W * H), i;
    for (i = 0; i < W * H; i++) {
      var r = px[i * 4] / 255, g = px[i * 4 + 1] / 255, b = px[i * 4 + 2] / 255;
      var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      v[i] = Math.pow(0.5 * mx + 0.3 * (mx - mn) + 0.2 * (0.3 * r + 0.6 * g + 0.1 * b), 0.7);
    }
    for (var pass = 0; pass < 4; pass++) {
      var o = new Float32Array(W * H);
      for (var y = 0; y < H; y++) for (var xx = 0; xx < W; xx++) {
        var s = 0, n = 0;
        for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) {
          var yy = y + dy, x2 = xx + dx; if (yy < 0 || yy >= H || x2 < 0 || x2 >= W) continue; s += v[yy * W + x2]; n++;
        }
        o[y * W + xx] = s / n;
      }
      v = o;
    }
    var lo = 1, hi = 0; for (i = 0; i < v.length; i++) { lo = Math.min(lo, v[i]); hi = Math.max(hi, v[i]); }
    for (i = 0; i < W * H; i++) { var q = (v[i] - lo) / Math.max(1e-3, hi - lo) * 255; px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = q; px[i * 4 + 3] = 255; }
    x.putImageData(d, 0, 0);
    return c;
  }

  function create(canvas, opts) {
    var gl = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!gl) return { ok: false };
    var prog, progP;
    try { prog = compile(gl, VS, FS); progP = compile(gl, VSP, FSP); } catch (e) { console.error('[flauver-scroll]', e); return { ok: false, error: String(e) }; }
    var vao = gl.createVertexArray();
    var shots = opts.shots, imgs = opts.images, tex = [], dep = [], asp = [], loaded = 0, ready = false;
    var black = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, black); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([10, 8, 7, 255]));
    function mk(src) {
      var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }
    // Фото грузятся по мере надобности, а не все сразу: сначала кадр первого экрана
    // (по нему страница считается готовой), затем остальные в порядке сцен, не больше
    // двух одновременно. Кадр, до которого дошли раньше, чем он загрузился, идёт вне очереди.
    var asked = [], done = [], queue = [], active = 0, PAR = opts.parallel || 2;
    imgs.forEach(function (url, i) { tex[i] = black; dep[i] = black; asp[i] = 1; });
    function shotImg(s, portrait) { return (portrait && s.mimg !== undefined) ? s.mimg : s.img; }
    function isPortrait() { var w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight; return opts.portrait ? opts.portrait(w, h) : w / h < 0.95; }
    var first = shotImg(shots[0], isPortrait());
    function finish(i, im) {
      if (im) { tex[i] = mk(im); dep[i] = mk(depthCanvas(im)); asp[i] = im.width / im.height; }
      done[i] = true; active--; loaded++;
      if (!ready && done[first]) { ready = true; if (opts.onProgress) opts.onProgress(1); if (opts.onReady) opts.onReady(); }
      pump();
    }
    function start(i) {
      active++;
      var im = new Image(); im.decoding = 'async';
      im.onload = function () {
        // decode() — декодирование вне главного потока до заливки в текстуру
        var up = function () { finish(i, im); };
        if (im.decode) im.decode().then(up, up); else up();
      };
      im.onerror = function () { finish(i, null); };
      im.src = imgs[i];
    }
    function pump() { while (active < PAR && queue.length) start(queue.shift()); }
    function need(i, urgent) { if (asked[i]) return; asked[i] = true; if (urgent) queue.unshift(i); else queue.push(i); pump(); }
    need(first, true);
    (function () { var p = isPortrait(); shots.forEach(function (s) { need(shotImg(s, p), false); }); })();

    var S = { y: 0, ty: 0, vel: 0, px: 0, py: 0, tpx: 0, tpy: 0, fade: 0 };
    var T = 0.5; // transition length in viewport heights
    function state(y, portrait) {
      var i = 0; while (i < shots.length - 1 && y > shots[i].s1) i++;
      var A = shots[i], B = shots[Math.min(i + 1, shots.length - 1)];
      var p = clamp((y - A.s0) / (A.s1 - A.s0), 0, 1), mix = 0;
      if (B !== A && y > A.s1 - T) mix = smooth((y - (A.s1 - T)) / T);
      function v(s, pp, extra) {
        var f0 = portrait && s.mf0 ? s.mf0 : s.f0, f1 = portrait && s.mf1 ? s.mf1 : s.f1;
        var z0 = portrait && s.mz0 !== undefined ? s.mz0 : s.z0, z1 = portrait && s.mz1 !== undefined ? s.mz1 : s.z1;
        var r0 = portrait && s.mr0 !== undefined ? s.mr0 : (s.r0 || 0), r1 = portrait && s.mr1 !== undefined ? s.mr1 : (s.r1 || 0);
        var wn = (portrait ? s.mwin : s.win) || [0, 0, 1, 1], w0 = portrait ? s.mwin0 : s.win0;
        if (w0) { var we = smooth(pp / 0.2); wn = [0, 1, 2, 3].map(function (k) { return lerp(w0[k], wn[k], we); }); }
        var e = ease(pp);
        return { img: (portrait && s.mimg !== undefined) ? s.mimg : s.img, z: lerp(z0, z1, e) * (1 + extra), r: lerp(r0, r1, e), tr: portrait && s.mtr !== undefined ? s.mtr : (s.tr || 0), f: [lerp(f0[0], f1[0], e), lerp(f0[1], f1[1], e)], beam: s.beam || 0, tone: s.tone || 0, win: wn, side: portrait ? (s.mside === undefined ? 2 : s.mside) : (s.side === undefined ? 1 : s.side) };
      }
      var a = v(A, p, mix * 0.12), b = v(B, 0, (1 - mix) * 0.1);
      return { a: a, b: b, mix: mix, i: i };
    }
    S.cur = null;

    function onMove(e) { if (e.pointerType === 'touch') return; var r = canvas.getBoundingClientRect(); S.tpx = ((e.clientX - r.left) / r.width - 0.5) * 2; S.tpy = ((e.clientY - r.top) / r.height - 0.5) * -2; }
    window.addEventListener('pointermove', onMove, { passive: true });

    var raf = 0, last = performance.now(), dead = false;
    function frame(now) {
      if (dead) return;
      var dt = Math.min(0.1, (now - last) / 1000); last = now;
      var w = canvas.clientWidth, h = canvas.clientHeight, small = Math.min(w, h) < 700;
      var dpr = Math.min(window.devicePixelRatio || 1, small ? 1.6 : 1.5);
      var W = Math.max(1, Math.round(w * dpr)), H = Math.max(1, Math.round(h * dpr));
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      var prevY = S.y;
      S.y += (S.ty - S.y) * (1 - Math.exp(-dt * (S.jump ? 60 : (opts.follow || 5.5))));
      S.jump = Math.max(0, (S.jump || 0) - 1);
      S.vel = lerp(S.vel, (S.y - prevY) / Math.max(dt, 1e-3), 1 - Math.exp(-dt * 6));
      var time = now / 1000;
      var auto = small ? [Math.sin(time * 0.22) * 0.14, Math.cos(time * 0.17) * 0.1] : [Math.sin(time * 0.25) * 0.25, Math.cos(time * 0.2) * 0.2];
      S.px = lerp(S.px, S.tpx + auto[0], 1 - Math.exp(-dt * 3)); S.py = lerp(S.py, S.tpy + auto[1], 1 - Math.exp(-dt * 3));
      if (ready) S.fade = Math.min(1, S.fade + dt * 0.8);
      var st = state(S.y, opts.portrait ? opts.portrait(w, h) : w / h < 0.95); S.cur = st;
      if (opts.onFrame) opts.onFrame(S.y, st);
      need(st.a.img, true); need(st.b.img, true);

      gl.viewport(0, 0, W, H); gl.disable(gl.BLEND);
      gl.useProgram(prog.p); var u = prog.u;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[st.a.img]); gl.uniform1i(u.tA, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex[st.b.img]); gl.uniform1i(u.tB, 1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, dep[st.a.img]); gl.uniform1i(u.dA, 2);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, dep[st.b.img]); gl.uniform1i(u.dB, 3);
      gl.uniform2f(u.uRes, W, H);
      gl.uniform1f(u.uAspA, asp[st.a.img]); gl.uniform1f(u.uAspB, asp[st.b.img]);
      gl.uniform1f(u.uZA, st.a.z); gl.uniform1f(u.uZB, st.b.z); gl.uniform1f(u.uRA, st.a.r); gl.uniform1f(u.uRB, st.b.r);
      gl.uniform2f(u.uFA, st.a.f[0], st.a.f[1]); gl.uniform2f(u.uFB, st.b.f[0], st.b.f[1]);
      gl.uniform1f(u.uMix, st.mix); if (u.uTr) gl.uniform1f(u.uTr, st.b.tr); gl.uniform1f(u.uTime, time);
      var beam = lerp(st.a.beam, st.b.beam, st.mix);
      var bpos = [0.05 + Math.sin(time * 0.07) * 0.03 + S.y * 0.015, 1.05];
      gl.uniform1f(u.uBeam, beam); gl.uniform2f(u.uBeamPos, bpos[0], bpos[1]);
      gl.uniform1f(u.uVel, clamp(S.vel, -3, 3)); gl.uniform2f(u.uPar, S.px, S.py);
      gl.uniform1f(u.uFade, S.fade);
      var wn = [0, 1, 2, 3].map(function (k) { return lerp(st.a.win[k], st.b.win[k], st.mix); }); S.win = wn;
      gl.uniform4f(u.uWin, wn[0], wn[1], wn[2], wn[3]);
      var tn = lerp(st.a.tone, st.b.tone, st.mix); gl.uniform3f(u.uBg, lerp(0.07, 0.937, tn), lerp(0.063, 0.922, tn), lerp(0.055, 0.894, tn)); gl.uniform1f(u.uTone, lerp(st.a.tone, st.b.tone, st.mix)); gl.uniform1f(u.uSide, st.a.side); if (u.uSideB) gl.uniform1f(u.uSideB, st.b.side);
      gl.bindVertexArray(vao); gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (beam > 0.02) {
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(progP.p);
        gl.uniform1f(progP.u.uTime, time); gl.uniform1f(progP.u.uBeam, beam * S.fade); gl.uniform2f(progP.u.uBeamPos, bpos[0], bpos[1]);
        gl.uniform1f(progP.u.uSize, 2.2 * dpr); gl.uniform2f(progP.u.uRes, W, H);
        gl.drawArrays(gl.POINTS, 0, small ? 160 : 280);
        gl.disable(gl.BLEND);
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return {
      ok: true,
      setScroll: function (y) { S.ty = y; },
      jump: function () { S.jump = 3; S.fade = 1; },
      setTilt: function (x, y) { S.tpx = x; S.tpy = y; },
      getY: function () { return S.y; },
      // image fraction (fx, fy from top-left) of the current main shot → CSS px in the canvas
      project: function (fx, fy) {
        var st = S.cur; if (!st) return null;
        var a = st.a, wn = S.win || a.win, W0 = canvas.clientWidth, H0 = canvas.clientHeight, w = W0 * (wn[2] - wn[0]), h = H0 * (wn[3] - wn[1]), sa = w / h, ia = asp[a.img], sc = Math.max(1, sa / ia);
        var hx = 0.5 * sa / (sc * a.z * ia), hy = 0.5 / (sc * a.z);
        var fc = [clamp(a.f[0], hx, 1 - hx), clamp(1 - a.f[1], hy, 1 - hy)];
        var p = [(fx - fc[0]) * ia, ((1 - fy) - fc[1])];
        p = [p[0] * sc * a.z, p[1] * sc * a.z];
        var c = Math.cos(-a.r), s = Math.sin(-a.r);
        p = [c * p[0] - s * p[1], s * p[0] + c * p[1]];
        return [wn[0] * W0 + (p[0] / sa + 0.5) * w, (1 - wn[3]) * H0 + (1 - (p[1] + 0.5)) * h];
      },
      isReady: function () { return ready; },
      dispose: function () { dead = true; cancelAnimationFrame(raf); window.removeEventListener('pointermove', onMove); }
    };
  }
  window.FlauverScroll = { create: create };
})();
