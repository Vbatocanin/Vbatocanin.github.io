/* ═══════════════════════════════════════════════════════════════════
   PAINT THE TOWN CRIMSON  —  WebGL 3D Top-Down Shooter  (v2)
   Click the wizard on the Projects section to play.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ──────────────────────────────────────────────────────────────────
  //  Column-major 4×4 matrix helpers
  // ──────────────────────────────────────────────────────────────────
  function m4()      { return new Float32Array(16); }
  function m4mul(o, a, b) {
    for (var c=0;c<4;c++) for (var r=0;r<4;r++) {
      var s=0; for (var k=0;k<4;k++) s+=a[k*4+r]*b[c*4+k];
      o[c*4+r]=s;
    }
    return o;
  }
  function m4persp(o, fov, asp, n, f) {
    var t=1/Math.tan(fov/2), d=1/(n-f);
    o[0]=t/asp;o[1]=0;o[2]=0;o[3]=0;
    o[4]=0;o[5]=t;o[6]=0;o[7]=0;
    o[8]=0;o[9]=0;o[10]=(f+n)*d;o[11]=-1;
    o[12]=0;o[13]=0;o[14]=2*f*n*d;o[15]=0;
    return o;
  }
  function m4look(o, ex,ey,ez, cx,cy,cz) {
    var fx=cx-ex,fy=cy-ey,fz=cz-ez;
    var fl=Math.sqrt(fx*fx+fy*fy+fz*fz); fx/=fl;fy/=fl;fz/=fl;
    var sx=-fz,sy=0,sz=fx;
    var sl=Math.sqrt(sx*sx+sz*sz); if(sl>1e-8){sx/=sl;sz/=sl;}
    var ux=sy*fz-sz*fy, uy=sz*fx-sx*fz, uz=sx*fy-sy*fx;
    o[0]=sx; o[1]=ux; o[2]=-fx; o[3]=0;
    o[4]=sy; o[5]=uy; o[6]=-fy; o[7]=0;
    o[8]=sz; o[9]=uz; o[10]=-fz;o[11]=0;
    o[12]=-(sx*ex+sy*ey+sz*ez);
    o[13]=-(ux*ex+uy*ey+uz*ez);
    o[14]= (fx*ex+fy*ey+fz*ez);
    o[15]=1;
    return o;
  }
  function m4inv(o, m) {
    var a=m[0],b=m[1],c=m[2],d=m[3],e=m[4],f=m[5],g=m[6],h=m[7],
        i=m[8],j=m[9],k=m[10],l=m[11],mn=m[12],n=m[13],p=m[14],q=m[15];
    var b00=a*f-b*e,b01=a*g-c*e,b02=a*h-d*e,b03=b*g-c*f,
        b04=b*h-d*f,b05=c*h-d*g,b06=i*n-j*mn,b07=i*p-k*mn,
        b08=i*q-l*mn,b09=j*p-k*n,b10=j*q-l*n,b11=k*q-l*p;
    var det=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;
    if (!det) return o;
    det=1/det;
    o[0]=(f*b11-g*b10+h*b09)*det; o[1]=(c*b10-b*b11-d*b09)*det;
    o[2]=(n*b05-p*b04+q*b03)*det; o[3]=(k*b04-j*b05-l*b03)*det;
    o[4]=(g*b08-e*b11-h*b07)*det; o[5]=(a*b11-c*b08+d*b07)*det;
    o[6]=(p*b02-mn*b05-q*b01)*det;o[7]=(i*b05-k*b02+l*b01)*det;
    o[8]=(e*b10-f*b08+h*b06)*det; o[9]=(b*b08-a*b10-d*b06)*det;
    o[10]=(mn*b04-n*b02+q*b00)*det;o[11]=(j*b02-i*b04-l*b00)*det;
    o[12]=(f*b07-e*b09-g*b06)*det;o[13]=(a*b09-b*b07+c*b06)*det;
    o[14]=(n*b01-mn*b03-p*b00)*det;o[15]=(i*b03-j*b01+k*b00)*det;
    return o;
  }
  function m4trs(o, tx,ty,tz, ry, sx,sy,sz) {
    var c=Math.cos(ry),s=Math.sin(ry);
    o[0]=sx*c; o[1]=0;  o[2]=-sx*s; o[3]=0;
    o[4]=0;    o[5]=sy; o[6]=0;     o[7]=0;
    o[8]=sz*s; o[9]=0;  o[10]=sz*c; o[11]=0;
    o[12]=tx;  o[13]=ty;o[14]=tz;   o[15]=1;
  }
  function m4ts(o, tx,ty,tz, sx,sy,sz) {
    o[0]=sx;o[1]=0; o[2]=0; o[3]=0;
    o[4]=0; o[5]=sy;o[6]=0; o[7]=0;
    o[8]=0; o[9]=0; o[10]=sz;o[11]=0;
    o[12]=tx;o[13]=ty;o[14]=tz;o[15]=1;
  }

  // ──────────────────────────────────────────────────────────────────
  //  Geometry  (position xyz + normal xyz, stride=6 floats)
  // ──────────────────────────────────────────────────────────────────
  function buildBox() {
    var V=[], faces=[
      {n:[0,1,0], q:[[-1,1,-1],[1,1,-1],[1,1,1],[-1,1,1]]},
      {n:[0,-1,0],q:[[-1,-1,1],[1,-1,1],[1,-1,-1],[-1,-1,-1]]},
      {n:[1,0,0], q:[[1,-1,-1],[1,-1,1],[1,1,1],[1,1,-1]]},
      {n:[-1,0,0],q:[[-1,-1,1],[-1,-1,-1],[-1,1,-1],[-1,1,1]]},
      {n:[0,0,1], q:[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]},
      {n:[0,0,-1],q:[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]]}
    ];
    faces.forEach(function(f){
      [[0,1,2],[0,2,3]].forEach(function(tri){
        tri.forEach(function(i){
          var v=f.q[i];
          V.push(v[0]*0.5,v[1]*0.5,v[2]*0.5, f.n[0],f.n[1],f.n[2]);
        });
      });
    });
    return new Float32Array(V);
  }

  function buildQuad() {
    return new Float32Array([
      -0.5,0,-0.5,0,1,0,  0.5,0,-0.5,0,1,0,  0.5,0,0.5,0,1,0,
      -0.5,0,-0.5,0,1,0,  0.5,0,0.5,0,1,0,  -0.5,0,0.5,0,1,0
    ]);
  }

  function buildCylinder(N) {
    N = N||12;
    var V=[];
    for (var i=0;i<N;i++) {
      var a0=i/N*Math.PI*2, a1=(i+1)/N*Math.PI*2;
      var c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1);
      // side quad: two triangles
      // bottom-left, bottom-right, top-right
      V.push(c0*0.5, -0.5, s0*0.5,  c0,0,s0);
      V.push(c1*0.5, -0.5, s1*0.5,  c1,0,s1);
      V.push(c1*0.5,  0.5, s1*0.5,  c1,0,s1);
      // bottom-left, top-right, top-left
      V.push(c0*0.5, -0.5, s0*0.5,  c0,0,s0);
      V.push(c1*0.5,  0.5, s1*0.5,  c1,0,s1);
      V.push(c0*0.5,  0.5, s0*0.5,  c0,0,s0);
      // top cap
      V.push(0,0.5,0, 0,1,0);
      V.push(c0*0.5,0.5,s0*0.5, 0,1,0);
      V.push(c1*0.5,0.5,s1*0.5, 0,1,0);
      // bottom cap
      V.push(0,-0.5,0, 0,-1,0);
      V.push(c1*0.5,-0.5,s1*0.5, 0,-1,0);
      V.push(c0*0.5,-0.5,s0*0.5, 0,-1,0);
    }
    return new Float32Array(V);
  }

  function buildCone(N) {
    N = N||12;
    var V=[];
    for (var i=0;i<N;i++) {
      var a0=i/N*Math.PI*2, a1=(i+1)/N*Math.PI*2;
      var c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1);
      // side triangle: apex at top (0,0.5,0)
      var nx0=c0, nz0=s0, nx1=c1, nz1=s1;
      V.push(0, 0.5, 0,  (nx0+nx1)*0.5, 0.5, (nz0+nz1)*0.5);
      V.push(c0*0.5,-0.5,s0*0.5, nx0,0.5,nz0);
      V.push(c1*0.5,-0.5,s1*0.5, nx1,0.5,nz1);
      // bottom cap
      V.push(0,-0.5,0, 0,-1,0);
      V.push(c1*0.5,-0.5,s1*0.5, 0,-1,0);
      V.push(c0*0.5,-0.5,s0*0.5, 0,-1,0);
    }
    return new Float32Array(V);
  }

  function buildSphere(la, lo) {
    la=la||8; lo=lo||12;
    var V=[];
    for (var j=0;j<la;j++) {
      var t0=j/la*Math.PI, t1=(j+1)/la*Math.PI;
      var y0=Math.cos(t0), y1=Math.cos(t1);
      var r0=Math.sin(t0), r1=Math.sin(t1);
      for (var i=0;i<lo;i++) {
        var a0=i/lo*Math.PI*2, a1=(i+1)/lo*Math.PI*2;
        var p00=[r0*Math.cos(a0),y0,r0*Math.sin(a0)];
        var p10=[r0*Math.cos(a1),y0,r0*Math.sin(a1)];
        var p01=[r1*Math.cos(a0),y1,r1*Math.sin(a0)];
        var p11=[r1*Math.cos(a1),y1,r1*Math.sin(a1)];
        // normalize for normals (sphere radius=0.5, positions are on unit sphere*0.5)
        function pv(p){ V.push(p[0]*0.5,p[1]*0.5,p[2]*0.5, p[0],p[1],p[2]); }
        pv(p00); pv(p10); pv(p11);
        pv(p00); pv(p11); pv(p01);
      }
    }
    return new Float32Array(V);
  }

  function buildDisc(N) {
    N=N||12;
    var V=[];
    for (var i=0;i<N;i++) {
      var a0=i/N*Math.PI*2, a1=(i+1)/N*Math.PI*2;
      V.push(0,0,0, 0,1,0);
      V.push(Math.cos(a0)*0.5,0,Math.sin(a0)*0.5, 0,1,0);
      V.push(Math.cos(a1)*0.5,0,Math.sin(a1)*0.5, 0,1,0);
    }
    return new Float32Array(V);
  }

  // ──────────────────────────────────────────────────────────────────
  //  GLSL shaders (improved with rim lighting + world pos)
  // ──────────────────────────────────────────────────────────────────
  var VS = [
    'attribute vec3 aP;',
    'attribute vec3 aN;',
    'uniform mat4 uMVP;',
    'uniform mat4 uM;',
    'varying vec3 vN;',
    'varying vec3 vWP;',
    'void main(){',
    '  vN = mat3(uM[0].xyz, uM[1].xyz, uM[2].xyz) * aN;',
    '  vec4 wp = uM * vec4(aP,1.0);',
    '  vWP = wp.xyz;',
    '  gl_Position = uMVP * vec4(aP,1.0);',
    '}'
  ].join('\n');

  var FS = [
    'precision mediump float;',
    'uniform vec4 uC;',
    'uniform vec3 uE;',
    'uniform float uRim;',
    'uniform vec3 uEye;',
    'uniform sampler2D uTex;',
    'uniform float uTexAmt;',
    'uniform float uTexScale;',
    'varying vec3 vN;',
    'varying vec3 vWP;',
    'void main(){',
    '  vec3 L=normalize(vec3(0.4,1.0,0.4));',
    '  vec3 N=normalize(vN);',
    '  float diff=max(dot(N,L),0.0);',
    '  vec3 V=normalize(uEye - vWP);',
    '  float rim=pow(1.0-max(dot(N,V),0.0),3.0)*uRim;',
    '  vec3 col=uC.rgb*(0.35+diff*0.65)+uE+vec3(rim);',
    '  if(uTexAmt>0.0){',
    '    vec3 absN=abs(N);',
    '    vec2 uv;',
    '    if(absN.y>=absN.x && absN.y>=absN.z) uv=vWP.xz*uTexScale;',
    '    else if(absN.x>=absN.z) uv=vWP.zy*uTexScale;',
    '    else uv=vWP.xy*uTexScale;',
    '    vec3 tex=texture2D(uTex,uv).rgb;',
    '    col=col*(1.0-uTexAmt)+col*tex*2.0*uTexAmt;',
    '  }',
    '  gl_FragColor=vec4(clamp(col,0.0,1.8), uC.a);',
    '}'
  ].join('\n');

  // ──────────────────────────────────────────────────────────────────
  //  Audio Engine
  // ──────────────────────────────────────────────────────────────────
  var SFX = (function(){
    var ctx=null;
    function gc(){ if(!ctx) ctx=new(window.AudioContext||window.webkitAudioContext)(); if(ctx.state==='suspended')ctx.resume(); return ctx; }
    function muted(){ return typeof AudioEngine!=='undefined' && AudioEngine.isMuted && AudioEngine.isMuted(); }
    function tone(f0,f1,dur,vol,type,delay){
      if(muted())return;
      try{
        var c=gc(),w=delay||0;
        var osc=c.createOscillator(), g=c.createGain();
        osc.connect(g); g.connect(c.destination);
        osc.type=type||'sine';
        osc.frequency.setValueAtTime(f0,c.currentTime+w);
        if(f1!==f0) osc.frequency.exponentialRampToValueAtTime(f1,c.currentTime+w+dur);
        g.gain.setValueAtTime(vol,c.currentTime+w);
        g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+w+dur);
        osc.start(c.currentTime+w); osc.stop(c.currentTime+w+dur+0.02);
      }catch(e){}
    }
    function noise(dur,vol,freq,delay){
      if(muted())return;
      try{
        var c=gc(),w=delay||0;
        var buf=c.createBuffer(1,Math.ceil(c.sampleRate*dur),c.sampleRate);
        var d=buf.getChannelData(0); for(var i=0;i<d.length;i++) d[i]=Math.random()*2-1;
        var src=c.createBufferSource(), g=c.createGain(), filt=c.createBiquadFilter();
        filt.type='bandpass'; filt.frequency.value=freq||300; filt.Q.value=2;
        src.buffer=buf; src.connect(filt); filt.connect(g); g.connect(c.destination);
        g.gain.setValueAtTime(vol,c.currentTime+w);
        g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+w+dur);
        src.start(c.currentTime+w);
      }catch(e){}
    }
    return {
      shoot:     function(){ tone(900,400,0.07,0.035,'square'); },
      hit:       function(){ noise(0.07,0.12,350); tone(220,120,0.09,0.04,'sawtooth'); },
      death:     function(){ noise(0.14,0.22,200); tone(280,80,0.18,0.07,'sawtooth'); },
      playerHit: function(){ tone(160,55,0.35,0.13,'sine'); noise(0.2,0.18,120,0.05); },
      pickup:    function(){ tone(880,1320,0.1,0.05,'sine'); tone(1320,1760,0.1,0.04,'sine',0.09); },
      bomb:      function(){ tone(90,28,0.55,0.2,'sawtooth'); noise(0.45,0.35,140); },
      dash:      function(){ tone(600,1200,0.08,0.04,'sine'); },
      wave:      function(){ tone(440,550,0.18,0.06,'sine'); tone(550,660,0.18,0.05,'sine',0.15); tone(660,880,0.25,0.06,'sine',0.3); },
      teleport:  function(){ tone(400,1600,0.12,0.05,'sine'); },
      gameOver:  function(){ tone(440,220,0.3,0.08,'sine'); tone(330,165,0.3,0.06,'sine',0.28); tone(220,110,0.5,0.05,'sine',0.55); },
      win:       function(){ [0,0.13,0.26,0.45].forEach(function(w,i){ var f=[523,659,784,1047][i]; tone(f,f*1.5,0.28,0.06,'sine',w); }); },
      summon:    function(){ tone(180,260,0.2,0.04,'sine'); },
    };
  })();

  // ──────────────────────────────────────────────────────────────────
  //  Game configuration constants
  // ──────────────────────────────────────────────────────────────────
  var ENEMY_CFG = [
    {hp:2, spd:3.5, w:0.5, h:0.9,  r:0.88,g:0.12,b:0.12, score:10, ai:'chase'},
    {hp:1, spd:7.0, w:0.38,h:0.55, r:1.0, g:0.45,b:0.0,  score:15, ai:'rush'},
    {hp:6, spd:1.8, w:0.85,h:1.4,  r:0.52,g:0.0, b:0.08, score:35, ai:'chase', shoots:true},
    {hp:3, spd:0,   w:0.5, h:0.5,  r:0.65,g:0.1, b:0.95, score:30, ai:'teleport'},
    {hp:4, spd:2.8, w:0.75,h:0.55, r:0.95,g:0.85,b:0.0,  score:25, ai:'chase', splits:true},
    {hp:3, spd:1.8, w:0.48,h:1.1,  r:0.1, g:0.85,b:0.75, score:45, ai:'necro'},
  ];

  var WAVES = [
    [{t:0,n:6}],
    [{t:0,n:8},{t:1,n:4}],
    [{t:0,n:8},{t:1,n:5},{t:2,n:2}],
    [{t:0,n:8},{t:1,n:6},{t:2,n:3},{t:3,n:3}],
    [{t:0,n:8},{t:1,n:7},{t:2,n:3},{t:3,n:3},{t:4,n:4}],
    [{t:0,n:6},{t:1,n:8},{t:2,n:4},{t:3,n:4},{t:4,n:3},{t:5,n:2}],
    [{t:0,n:8},{t:1,n:10},{t:2,n:5},{t:3,n:5},{t:4,n:4},{t:5,n:3}],
  ];

  var PILLARS = [{x:-4.5,z:-4.5},{x:4.5,z:-4.5},{x:-4.5,z:4.5},{x:4.5,z:4.5}];
  var PILLAR_R = 0.7;

  var PU_CFG = [
    {name:'heart',  r:1.0,g:0.2,b:0.3, weight:3},
    {name:'speed',  r:0.2,g:0.8,b:1.0, weight:2},
    {name:'rapid',  r:1.0,g:0.8,b:0.0, weight:2},
    {name:'triple', r:0.3,g:1.0,b:0.4, weight:2},
    {name:'bomb',   r:1.0,g:0.4,b:0.1, weight:1},
  ];

  function clamp(v,lo,hi){ return v<lo?lo:v>hi?hi:v; }

  function weightedPick(arr) {
    var total=0; arr.forEach(function(c){total+=c.weight;});
    var r=Math.random()*total;
    for (var i=0;i<arr.length;i++) { r-=arr[i].weight; if(r<=0) return i; }
    return arr.length-1;
  }

  // ──────────────────────────────────────────────────────────────────
  //  Game class
  // ──────────────────────────────────────────────────────────────────
  function CrimsonGame(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl', {antialias:true}) ||
              canvas.getContext('experimental-webgl');
    if (!this.gl) return;
    this._eid = 0;
    this.trauma = 0;
    this._bombKeyHeld = false;
    this._setupGL();
    this._resetState();
    this._bindInput();
    this.running = false;
    this._last = 0;
  }

  CrimsonGame.prototype._setupGL = function() {
    var gl = this.gl;
    function sh(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        console.warn('Shader error:', gl.getShaderInfoLog(s));
      return s;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
      console.warn('Program link error:', gl.getProgramInfoLog(prog));
    this.prog = prog;
    this.loc = {
      aP:   gl.getAttribLocation(prog,  'aP'),
      aN:   gl.getAttribLocation(prog,  'aN'),
      uMVP: gl.getUniformLocation(prog, 'uMVP'),
      uM:   gl.getUniformLocation(prog, 'uM'),
      uC:   gl.getUniformLocation(prog, 'uC'),
      uE:   gl.getUniformLocation(prog, 'uE'),
      uRim: gl.getUniformLocation(prog, 'uRim'),
      uEye:      gl.getUniformLocation(prog, 'uEye'),
      uTex:      gl.getUniformLocation(prog, 'uTex'),
      uTexAmt:   gl.getUniformLocation(prog, 'uTexAmt'),
      uTexScale: gl.getUniformLocation(prog, 'uTexScale'),
    };

    // Create geometry buffers
    function mkBuf(data) {
      var b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      return b;
    }
    var boxData   = buildBox();
    var quadData  = buildQuad();
    var cylData   = buildCylinder(12);
    var coneData  = buildCone(12);
    var sphereData= buildSphere(8,12);
    var discData  = buildDisc(12);

    this.boxBuf    = mkBuf(boxData);    this.boxCount    = boxData.length/6;
    this.quadBuf   = mkBuf(quadData);   this.quadCount   = quadData.length/6;
    this.cylBuf    = mkBuf(cylData);    this.cylCount    = cylData.length/6;
    this.coneBuf   = mkBuf(coneData);   this.coneCount   = coneData.length/6;
    this.sphereBuf = mkBuf(sphereData); this.sphereCount = sphereData.length/6;
    this.discBuf   = mkBuf(discData);   this.discCount   = discData.length/6;

    gl.useProgram(prog);
    gl.enableVertexAttribArray(this.loc.aP);
    gl.enableVertexAttribArray(this.loc.aN);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.uniform1i(this.loc.uTex, 0);
    gl.uniform1f(this.loc.uTexAmt, 0);
    gl.uniform1f(this.loc.uTexScale, 0.25);

    this.stoneTex = this._makeFloorTex();
    this.wallTex  = this._makeWallTex();

    this.mProj=m4(); this.mView=m4(); this.mVP=m4();
    this.mM=m4();    this.mMVP=m4(); this.mInv=m4();
    this._W=0; this._H=0;
  };

  CrimsonGame.prototype._uploadTex = function(canvas) {
    var gl = this.gl;
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
  };

  CrimsonGame.prototype._makeFloorTex = function() {
    var sz = 256, c = document.createElement('canvas');
    c.width = c.height = sz;
    var ctx = c.getContext('2d');
    // Base dark stone
    ctx.fillStyle = '#151220';
    ctx.fillRect(0, 0, sz, sz);
    // Stone tiles (4×4 grid)
    var n = 4, ts = sz / n, g = 3;
    for (var ty = 0; ty < n; ty++) {
      for (var tx = 0; tx < n; tx++) {
        var bx = tx*ts+g, by = ty*ts+g, bw = ts-g*2, bh = ts-g*2;
        var vi = ((tx*7+ty*13) % 8) / 8;
        var r = 18 + Math.floor(vi*14), gg = 14 + Math.floor(vi*10), b = 24 + Math.floor(vi*18);
        ctx.fillStyle = 'rgb('+r+','+gg+','+b+')';
        ctx.fillRect(bx, by, bw, bh);
        // subtle surface variation lines
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        for (var li = 0; li < 5; li++) {
          var lx = bx + (tx*17+ty*11+li*29) % bw;
          var ly = by + (tx*13+ty*19+li*7)  % bh;
          ctx.fillRect(lx, ly, (li*11)%12+3, 1);
        }
        // edge shadow (bottom + right)
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(bx+bw-4, by, 4, bh);
        ctx.fillRect(bx, by+bh-4, bw, 4);
        // edge highlight (top + left)
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(bx, by, bw, 2);
        ctx.fillRect(bx, by, 2, bh);
      }
    }
    // Grout lines
    ctx.fillStyle = '#08060d';
    for (var i = 0; i <= n; i++) {
      ctx.fillRect(i*ts - 1, 0, g, sz);
      ctx.fillRect(0, i*ts - 1, sz, g);
    }
    return this._uploadTex(c);
  };

  CrimsonGame.prototype._makeWallTex = function() {
    var sz = 256, c = document.createElement('canvas');
    c.width = c.height = sz;
    var ctx = c.getContext('2d');
    // Mortar
    ctx.fillStyle = '#0c0a10';
    ctx.fillRect(0, 0, sz, sz);
    // Brick rows
    var bh = 20, bw = 44, m = 2;
    var rows = Math.ceil(sz / bh) + 1;
    for (var row = 0; row < rows; row++) {
      var xoff = (row % 2) * (bw / 2);
      var cols = Math.ceil((sz + bw) / bw) + 1;
      for (var col = -1; col < cols; col++) {
        var x = col*bw + xoff, y = row*bh;
        var vi = ((col*7+row*11) % 8) / 8;
        var r = 20 + Math.floor(vi*14), gg = 16 + Math.floor(vi*10), b = 27 + Math.floor(vi*16);
        ctx.fillStyle = 'rgb('+r+','+gg+','+b+')';
        ctx.fillRect(x+m, y+m, bw-m*2, bh-m*2);
        // top highlight
        ctx.fillStyle = 'rgba(180,160,220,0.07)';
        ctx.fillRect(x+m, y+m, bw-m*2, 2);
        // bottom shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(x+m, y+bh-m*2, bw-m*2, m);
        // occasional crack
        if ((col*3+row*7) % 5 === 0) {
          ctx.strokeStyle = 'rgba(0,0,0,0.18)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          var cx = x+m+6, cy = y+m+3;
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + (col*11)%8+2, cy + bh-m*2-4);
          ctx.stroke();
        }
      }
    }
    return this._uploadTex(c);
  };

  CrimsonGame.prototype._resetState = function() {
    this.s = {
      p: {x:0,z:0, hp:5,maxHp:5, ang:0, ft:0, inv:0, spd:6,
          dashTimer:0, dashDx:0, dashDz:0, dashCd:0,
          fireModeTimer:0, fireMode:'normal',
          speedTimer:0,
          bombCharges:1,
          walkPhase:0, walkSpeed:0},
      enemies:[], projs:[], splats:[], particles:[], powerups:[],
      score:0, wave:0, wt:2.5, queue:null,
      over:false, won:false,
      msg:'PAINT THE TOWN CRIMSON', msgT:99,
      bombFlash:0,
    };
    this.trauma = 0;
    this._bombKeyHeld = false;
  };

  CrimsonGame.prototype._bindInput = function() {
    var self = this;
    this.keys = {};
    this.mx = 0; this.my = 0;
    this.mdown = false;
    this.joyId = null; this.joyDx = 0; this.joyDz = 0;
    this.joyBaseX = 0; this.joyBaseY = 0;
    this.fireTouchId = null;

    this._kd = function(e) {
      var k = e.key.toLowerCase();
      self.keys[k] = true;
      if (k==='shift') self.keys['shift']=true;
      var nav = ['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'];
      if (nav.indexOf(k) >= 0) e.preventDefault();
      if (e.key === 'Escape') { e.stopPropagation(); window.closeCrimsonGame(); }
      if ((e.key === 'Enter' || e.key === ' ') && (self.s.over || self.s.won)) {
        self._resetState(); e.preventDefault();
      }
    };
    this._ku = function(e) {
      var k = e.key.toLowerCase();
      self.keys[k] = false;
      if (k==='shift') self.keys['shift']=false;
    };
    this._mm = function(e) {
      var r = self.canvas.getBoundingClientRect();
      self.mx = e.clientX - r.left;
      self.my = e.clientY - r.top;
    };
    this._md = function(e) {
      if (e.button === 0) { self.mdown = true; e.preventDefault(); }
      if ((self.s.over || self.s.won) && e.button === 0) self._resetState();
    };
    this._mu = function(e) { if (e.button === 0) self.mdown = false; };

    this._ts = function(e) {
      e.preventDefault();
      var r = self.canvas.getBoundingClientRect();
      for (var i=0;i<e.changedTouches.length;i++) {
        var t = e.changedTouches[i];
        var tx = t.clientX - r.left;
        if (tx < self.canvas.clientWidth / 2) {
          if (self.joyId === null) {
            self.joyId = t.identifier;
            self.joyBaseX = tx;
            self.joyBaseY = t.clientY - r.top;
          }
        } else {
          self.fireTouchId = t.identifier;
          self.mdown = true;
          self.mx = tx;
          self.my = t.clientY - r.top;
          if (self.s.over || self.s.won) self._resetState();
        }
      }
    };
    this._tm = function(e) {
      e.preventDefault();
      var r = self.canvas.getBoundingClientRect();
      for (var i=0;i<e.changedTouches.length;i++) {
        var t = e.changedTouches[i];
        if (t.identifier === self.joyId) {
          var dx = (t.clientX - r.left) - self.joyBaseX;
          var dy = (t.clientY - r.top)  - self.joyBaseY;
          var len = Math.sqrt(dx*dx+dy*dy), mx=40;
          if (len > mx) { dx=dx/len*mx; dy=dy/len*mx; len=mx; }
          self.joyDx = len>5 ? dx/mx : 0;
          self.joyDz = len>5 ? dy/mx : 0;
        } else if (t.identifier === self.fireTouchId) {
          self.mx = t.clientX - r.left;
          self.my = t.clientY - r.top;
        }
      }
    };
    this._te = function(e) {
      e.preventDefault();
      for (var i=0;i<e.changedTouches.length;i++) {
        var t = e.changedTouches[i];
        if (t.identifier === self.joyId)       { self.joyId=null; self.joyDx=0; self.joyDz=0; }
        if (t.identifier === self.fireTouchId) { self.fireTouchId=null; self.mdown=false; }
      }
    };

    document.addEventListener('keydown',      this._kd);
    document.addEventListener('keyup',        this._ku);
    this.canvas.addEventListener('mousemove', this._mm);
    this.canvas.addEventListener('mousedown', this._md);
    this.canvas.addEventListener('mouseup',   this._mu);
    this.canvas.addEventListener('touchstart',this._ts, {passive:false});
    this.canvas.addEventListener('touchmove', this._tm, {passive:false});
    this.canvas.addEventListener('touchend',  this._te, {passive:false});
    this.canvas.addEventListener('contextmenu',function(e){e.preventDefault();});
  };

  CrimsonGame.prototype.destroy = function() {
    this.running = false;
    document.removeEventListener('keydown', this._kd);
    document.removeEventListener('keyup',   this._ku);
    this.canvas.removeEventListener('mousemove', this._mm);
    this.canvas.removeEventListener('mousedown',  this._md);
    this.canvas.removeEventListener('mouseup',    this._mu);
    this.canvas.removeEventListener('touchstart', this._ts);
    this.canvas.removeEventListener('touchmove',  this._tm);
    this.canvas.removeEventListener('touchend',   this._te);
  };

  CrimsonGame.prototype.start = function() {
    if (this.running) return;
    this.running = true;
    this._last = performance.now();
    var self = this;
    requestAnimationFrame(function loop(ts) {
      if (!self.running) return;
      var dt = Math.min((ts - self._last) / 1000, 0.05);
      self._last = ts;
      if (dt > 0) { self._update(dt); self._render(); }
      requestAnimationFrame(loop);
    });
  };

  // ── Update ─────────────────────────────────────────────────────────
  CrimsonGame.prototype._update = function(dt) {
    var s = this.s;
    if (s.msgT > 0) s.msgT -= dt;
    if (s.over || s.won) {
      if (this.mdown || this.keys['enter'] || this.keys[' ']) this._resetState();
      return;
    }
    this._updatePlayer(dt);
    this._updateEnemies(dt);
    this._updateProjs(dt);
    this._updateParticles(dt);
    this._updatePowerups(dt);
    this._checkHits();
    this._updateWave(dt);
    this.trauma = Math.max(0, this.trauma - dt*3);
    this._updateHUD();
  };

  CrimsonGame.prototype._updatePlayer = function(dt) {
    var s=this.s, p=s.p, K=this.keys;
    var dx=0, dz=0;
    if (K['w']||K['arrowup'])    dz-=1;
    if (K['s']||K['arrowdown'])  dz+=1;
    if (K['a']||K['arrowleft'])  dx-=1;
    if (K['d']||K['arrowright']) dx+=1;
    if (this.joyDx||this.joyDz) { dx=this.joyDx; dz=this.joyDz; }

    var moving = (dx!==0||dz!==0);
    if (moving) { var l=Math.sqrt(dx*dx+dz*dz); dx/=l; dz/=l; }

    // Dash
    if (K['shift'] && !this._shiftWasDown && p.dashCd<=0 && moving) {
      p.dashTimer=0.15; p.dashDx=dx; p.dashDz=dz; p.dashCd=0.9;
      p.inv = Math.max(p.inv, 0.18);
      SFX.dash();
    }
    this._shiftWasDown = !!K['shift'];

    p.dashCd   = Math.max(0, p.dashCd   - dt);
    p.dashTimer= Math.max(0, p.dashTimer - dt);
    p.inv      = Math.max(0, p.inv       - dt);
    p.ft       = Math.max(0, p.ft        - dt);
    p.fireModeTimer = Math.max(0, p.fireModeTimer - dt);
    p.speedTimer    = Math.max(0, p.speedTimer    - dt);
    if (p.fireModeTimer<=0) p.fireMode='normal';

    var speedMult = (p.speedTimer>0) ? 1.5 : 1.0;
    var moveSpd = p.spd * speedMult;

    if (p.dashTimer > 0) {
      // Dash movement (extra speed in dash direction)
      p.x = clamp(p.x + p.dashDx * 18 * dt, -9.2, 9.2);
      p.z = clamp(p.z + p.dashDz * 18 * dt, -9.2, 9.2);
      // Dash trail particles
      if (Math.random() < 0.6) {
        s.particles.push({
          x:p.x, y:0.5, z:p.z,
          vx:(Math.random()-0.5)*1.5, vy:Math.random()*2+0.5, vz:(Math.random()-0.5)*1.5,
          r:0.6,g:0.3,b:1.0, life:0.25, maxLife:0.25, scale:0.18
        });
      }
    } else if (moving) {
      p.x = clamp(p.x + dx * moveSpd * dt, -9.2, 9.2);
      p.z = clamp(p.z + dz * moveSpd * dt, -9.2, 9.2);
    }

    // Pillar pushback for player
    for (var pi=0;pi<PILLARS.length;pi++) {
      var pl=PILLARS[pi], pdx=p.x-pl.x, pdz=p.z-pl.z;
      var pdist=Math.sqrt(pdx*pdx+pdz*pdz);
      if (pdist < PILLAR_R+0.4 && pdist>0.01) {
        var push = PILLAR_R+0.4-pdist;
        p.x += pdx/pdist*push; p.z += pdz/pdist*push;
      }
    }

    // Aim
    var wm = this._unproject(this.mx, this.my);
    var adx=wm[0]-p.x, adz=wm[2]-p.z;
    if (Math.abs(adx)>0.01||Math.abs(adz)>0.01) p.ang=Math.atan2(adx,-adz);

    // Fire
    if (this.mdown && p.ft<=0) {
      var fRate = (p.fireMode==='rapid') ? 0.08 : 0.2;
      p.ft = fRate;
      var ax=Math.sin(p.ang), az=-Math.cos(p.ang);
      var spd=22;
      if (p.fireMode==='triple') {
        [-0.3,0,0.3].forEach(function(spread){
          var sa=p.ang+spread;
          s.projs.push({x:p.x+Math.sin(sa)*0.6, z:p.z-Math.cos(sa)*0.6,
            dx:Math.sin(sa)*spd, dz:-Math.cos(sa)*spd, own:'p', life:1.8});
        });
      } else {
        s.projs.push({x:p.x+ax*0.6, z:p.z+az*0.6, dx:ax*spd, dz:az*spd, own:'p', life:1.8});
      }
      SFX.shoot();
    }

    // Bomb
    if (K['q'] && !this._bombKeyHeld) {
      this._bombKeyHeld = true;
      if (p.bombCharges > 0) this._detonateBomb();
    }
    if (!K['q']) this._bombKeyHeld = false;

    if (s.bombFlash > 0) s.bombFlash = Math.max(0, s.bombFlash - dt*2);

    // Walk phase for animation
    var isMoving = (moving || p.dashTimer > 0);
    var targetWalkSpd = isMoving ? (p.dashTimer > 0 ? 14 : 7 * speedMult) : 0;
    p.walkSpeed += (targetWalkSpd - p.walkSpeed) * Math.min(1, dt * 12);
    p.walkPhase += p.walkSpeed * dt;
  };

  CrimsonGame.prototype._detonateBomb = function() {
    var s=this.s, p=s.p, self=this;
    p.bombCharges--;
    s.bombFlash = 0.4;
    this.trauma = 1.0;
    SFX.bomb();
    var toKill=[], toKnock=[];
    s.enemies.forEach(function(e){
      var dx=e.x-p.x, dz=e.z-p.z, d=Math.sqrt(dx*dx+dz*dz);
      if (d<7) toKill.push(e);
      else toKnock.push({e:e, dx:dx, dz:dz, d:d});
    });
    toKill.forEach(function(e){ self._killEnemy(e); });
    s.enemies = s.enemies.filter(function(e){ return !e._dead; });
    toKnock.forEach(function(item){
      var e=item.e, push=3/item.d;
      e.x = clamp(e.x+item.dx*push, -9.2, 9.2);
      e.z = clamp(e.z+item.dz*push, -9.2, 9.2);
    });
  };

  CrimsonGame.prototype._updateEnemies = function(dt) {
    var s=this.s, p=s.p, self=this, now=Date.now();
    s.enemies.forEach(function(e) {
      if (e._dead) return;
      var dx=p.x-e.x, dz=p.z-e.z;
      var dist=Math.sqrt(dx*dx+dz*dz);
      e.ang = Math.atan2(dx,-dz);
      e.bob = Math.sin(now*0.003 + e.id*1.3) * 0.08;
      // walk phase: advance for moving types, idle cycle for others
      if (e.ai==='teleport') {
        e.walkPhase = (e.walkPhase||0) + 1.2*dt; // slow idle spin
      } else if (e.ai==='necro') {
        e.walkPhase = (e.walkPhase||0) + 1.5*dt; // glide sway
      } else {
        e.walkPhase = (e.walkPhase||0) + e.spd * 1.4 * dt;
      }

      if (e.ai==='chase') {
        if (dist>0.01) { e.x+=dx/dist*e.spd*dt; e.z+=dz/dist*e.spd*dt; }
      } else if (e.ai==='rush') {
        e.zigzagPhase = (e.zigzagPhase||0) + 4*dt;
        if (dist>0.01) {
          var nx=-dz/dist, nz=dx/dist; // perpendicular
          var zz=Math.sin(e.zigzagPhase)*3;
          var mx2=dx/dist+nx*zz*dt, mz2=dz/dist+nz*zz*dt;
          var ml=Math.sqrt(mx2*mx2+mz2*mz2); if(ml>0){mx2/=ml;mz2/=ml;}
          e.x+=mx2*e.spd*dt; e.z+=mz2*e.spd*dt;
        }
      } else if (e.ai==='teleport') {
        e.teleTimer = (e.teleTimer||2) - dt;
        if (e.teleTimer<=0) {
          var ang2=Math.random()*Math.PI*2, rad=1.5+Math.random()*1.5;
          e.x = clamp(p.x+Math.cos(ang2)*rad, -9.0, 9.0);
          e.z = clamp(p.z+Math.sin(ang2)*rad, -9.0, 9.0);
          e.teleTimer = 2.0+Math.random();
          SFX.teleport();
          for (var tp=0;tp<8;tp++) {
            s.particles.push({
              x:e.x,y:0.5,z:e.z,
              vx:(Math.random()-0.5)*4,vy:Math.random()*3+1,vz:(Math.random()-0.5)*4,
              r:0.65,g:0.1,b:0.95, life:0.5, maxLife:0.5, scale:0.15
            });
          }
        }
      } else if (e.ai==='necro') {
        // Maintain distance: 7-9 units
        if (dist<6 && dist>0.01) {
          e.x -= dx/dist*e.spd*dt;
          e.z -= dz/dist*e.spd*dt;
        } else if (dist>10 && dist>0.01) {
          e.x += dx/dist*e.spd*dt;
          e.z += dz/dist*e.spd*dt;
        }
        // Summon grunts
        e.summonTimer = (e.summonTimer||5) - dt;
        if (e.summonTimer<=0 && s.enemies.filter(function(x){return !x._dead;}).length < 12) {
          var count = 1+Math.floor(Math.random()*2);
          for (var si=0;si<count;si++) {
            var sa2=Math.random()*Math.PI*2;
            self._spawnEnemyAt(0, e.x+Math.cos(sa2)*1.5, e.z+Math.sin(sa2)*1.5);
          }
          e.summonTimer = 5+Math.random()*2;
          SFX.summon();
        }
        // Homing shots
        e.necroShootTimer = (e.necroShootTimer||3) - dt;
        if (e.necroShootTimer<=0) {
          if (dist>0.01) {
            s.projs.push({x:e.x,z:e.z, dx:dx/dist*10,dz:dz/dist*10, own:'en', life:3.0});
          }
          e.necroShootTimer = 3+Math.random()*2;
        }
      }

      // Brute shoots
      if (e.shoots) {
        e.shootTimer = (e.shootTimer||2.5+Math.random()) - dt;
        if (e.shootTimer<=0 && dist<18) {
          if (dist>0.01) {
            s.projs.push({x:e.x,z:e.z, dx:dx/dist*9,dz:dz/dist*9, own:'e', life:2.5});
          }
          e.shootTimer = 2.5+Math.random();
        }
      }

      // Pillar pushback
      for (var pi=0;pi<PILLARS.length;pi++) {
        var pl=PILLARS[pi], epx=e.x-pl.x, epz=e.z-pl.z;
        var epd=Math.sqrt(epx*epx+epz*epz);
        if (epd < PILLAR_R+e.w && epd>0.01) {
          var epush=PILLAR_R+e.w-epd;
          e.x=clamp(e.x+epx/epd*epush,-9.2,9.2);
          e.z=clamp(e.z+epz/epd*epush,-9.2,9.2);
        }
      }
      // Arena bounds
      e.x=clamp(e.x,-9.2,9.2); e.z=clamp(e.z,-9.2,9.2);
    });
  };

  CrimsonGame.prototype._updateProjs = function(dt) {
    var s=this.s, p=s.p;
    s.projs.forEach(function(pr) {
      // Homing necro shots
      if (pr.own==='en') {
        var tx=p.x-pr.x, tz=p.z-pr.z, td=Math.sqrt(tx*tx+tz*tz);
        if (td>0.01) {
          var curAng=Math.atan2(pr.dx,-pr.dz);
          var tarAng=Math.atan2(tx,-tz);
          var diff=tarAng-curAng;
          while(diff> Math.PI) diff-=Math.PI*2;
          while(diff<-Math.PI) diff+=Math.PI*2;
          curAng += diff*2*dt;
          var spd=Math.sqrt(pr.dx*pr.dx+pr.dz*pr.dz);
          pr.dx=Math.sin(curAng)*spd; pr.dz=-Math.cos(curAng)*spd;
        }
      }
      pr.x+=pr.dx*dt; pr.z+=pr.dz*dt; pr.life-=dt;
      // Pillar collision
      for (var pi=0;pi<PILLARS.length;pi++) {
        var pl=PILLARS[pi], pdx=pr.x-pl.x, pdz=pr.z-pl.z;
        if (Math.sqrt(pdx*pdx+pdz*pdz) < PILLAR_R+0.15) pr.life=0;
      }
      if (Math.abs(pr.x)>10.5||Math.abs(pr.z)>10.5) pr.life=0;
    });
    s.projs = s.projs.filter(function(pr){return pr.life>0;});
  };

  CrimsonGame.prototype._updateParticles = function(dt) {
    this.s.particles.forEach(function(pt) {
      pt.x+=pt.vx*dt; pt.y+=pt.vy*dt; pt.z+=pt.vz*dt;
      pt.vy-=6*dt;
      pt.life-=dt; pt.scale*=0.95;
    });
    this.s.particles = this.s.particles.filter(function(pt){return pt.life>0;});
  };

  CrimsonGame.prototype._updatePowerups = function(dt) {
    this.s.powerups.forEach(function(pu) {
      pu.bobPhase = (pu.bobPhase||0) + dt*2;
      pu.y = 0.4 + Math.sin(pu.bobPhase)*0.12;
      pu.rot = (pu.rot||0) + dt*2;
      pu.life = (pu.life||8) - dt;
    });
    this.s.powerups = this.s.powerups.filter(function(pu){return pu.life>0 && !pu._collected;});
  };

  CrimsonGame.prototype._checkHits = function() {
    var s=this.s, p=s.p, self=this;
    // Player bullets vs enemies
    s.projs.forEach(function(pr) {
      if (pr.own!=='p') return;
      s.enemies.forEach(function(e) {
        if (e._dead) return;
        var dx=pr.x-e.x, dz=pr.z-e.z;
        if (Math.sqrt(dx*dx+dz*dz) < e.w+0.1) {
          e.hp--; pr.life=0; SFX.hit();
          if (e.hp<=0) { self._killEnemy(e); }
        }
      });
    });
    s.enemies = s.enemies.filter(function(e){return !e._dead;});

    // Enemy contact + bullets vs player
    if (p.inv>0) return;
    s.enemies.forEach(function(e) {
      if (e._dead) return;
      var dx=p.x-e.x, dz=p.z-e.z;
      if (Math.sqrt(dx*dx+dz*dz) < e.w+0.3) self._hitPlayer();
    });
    s.projs.forEach(function(pr) {
      if (pr.own!=='e' && pr.own!=='en') return;
      var dx=p.x-pr.x, dz=p.z-pr.z;
      if (Math.sqrt(dx*dx+dz*dz) < 0.45) { pr.life=0; self._hitPlayer(); }
    });

    // Player vs powerups
    s.powerups.forEach(function(pu) {
      if (pu._collected) return;
      var dx=p.x-pu.x, dz=p.z-pu.z;
      if (Math.sqrt(dx*dx+dz*dz) < 0.8) self._collectPowerup(pu);
    });
  };

  CrimsonGame.prototype._killEnemy = function(e) {
    var s=this.s;
    e._dead = true;
    s.score += e.score || 10;
    SFX.death();
    // Blood splats
    var nSplats = 3+Math.floor(Math.random()*3);
    for (var k=0;k<nSplats;k++)
      s.splats.push({x:e.x+(Math.random()-.5)*2.5, z:e.z+(Math.random()-.5)*2.5,
                     sz:0.35+Math.random()*1.0, a:0.65+Math.random()*.3});
    // Particle burst
    var nParts = 12+Math.floor(Math.random()*5);
    for (var pp=0;pp<nParts;pp++) {
      s.particles.push({
        x:e.x, y:e.h*0.5, z:e.z,
        vx:(Math.random()-0.5)*8, vy:Math.random()*5+1, vz:(Math.random()-0.5)*8,
        r:e.r, g:e.g, b:e.b, life:0.6, maxLife:0.6, scale:0.15
      });
    }
    // Splitter: spawn 2 mini-grunts
    if (e.splits) {
      for (var ms=0;ms<2;ms++) {
        var mang=Math.random()*Math.PI*2;
        var me = {
          id:this._eid++, x:e.x+Math.cos(mang)*0.5, z:e.z+Math.sin(mang)*0.5,
          hp:1, maxHp:1, spd:4.5, type:0, w:0.3, h:0.45,
          r:0.95,g:0.7,b:0.1, score:5, ai:'chase',
          ang:0, bob:0, mini:true
        };
        s.enemies.push(me);
      }
    }
    // Powerup drop
    var roll = Math.random();
    if (roll < 0.20) {
      var idx = weightedPick(PU_CFG);
      var cfg = PU_CFG[idx];
      s.powerups.push({x:e.x, z:e.z, y:0.4, type:cfg.name,
        r:cfg.r, g:cfg.g, b:cfg.b, bobPhase:0, rot:0, life:8});
    }
  };

  CrimsonGame.prototype._hitPlayer = function() {
    var s=this.s, p=s.p;
    p.hp--; p.inv=1.2; SFX.playerHit();
    this.trauma = Math.min(1.0, this.trauma+0.5);
    if (p.hp<=0) {
      s.over=true;
      s.msg='GAME OVER\nScore: '+s.score+'\n\nPress Enter or tap to restart';
      s.msgT=99; SFX.gameOver();
    }
  };

  CrimsonGame.prototype._collectPowerup = function(pu) {
    var p=this.s.p;
    SFX.pickup();
    pu._collected = true;
    switch(pu.type) {
      case 'heart':  p.hp = Math.min(p.hp+1, p.maxHp); break;
      case 'speed':  p.speedTimer = 8; break;
      case 'rapid':  p.fireMode='rapid'; p.fireModeTimer=8; break;
      case 'triple': p.fireMode='triple'; p.fireModeTimer=8; break;
      case 'bomb':   p.bombCharges = Math.min(p.bombCharges+1, 3); break;
    }
  };

  CrimsonGame.prototype._updateWave = function(dt) {
    var s=this.s;
    var alive = s.enemies.filter(function(e){return !e._dead;}).length;

    if (!s.queue && s.wave===0) {
      s.wt-=dt;
      if (s.wt<=0) this._startWave(1);
      return;
    }
    if (s.queue && s.queue.length>0) {
      s.queue[0].delay-=dt;
      while (s.queue.length>0 && s.queue[0].delay<=0) {
        this._spawnEnemy(s.queue.shift().t);
      }
    }
    if (s.queue && s.queue.length===0 && alive===0) {
      if (s.wave >= WAVES.length) {
        s.won=true;
        s.msg='TOWN PAINTED CRIMSON!\nScore: '+s.score+'\n\nPress Enter or tap to restart';
        s.msgT=99; SFX.win(); return;
      }
      s.wt-=dt;
      if (s.wt<=0) this._startWave(s.wave+1);
    }
  };

  CrimsonGame.prototype._startWave = function(n) {
    var s=this.s;
    s.wave=n; s.wt=3.5;
    s.msg='— WAVE '+n+' / '+WAVES.length+' —'; s.msgT=2.2;
    SFX.wave();
    var wdef=WAVES[n-1]; s.queue=[];
    var announceDelay = 2.2; // wait for the wave banner to clear before spawning
    wdef.forEach(function(entry){
      for (var i=0;i<entry.n;i++)
        s.queue.push({t:entry.t, delay: announceDelay + (i+Math.random()*0.3)*0.45});
    });
    s.queue.sort(function(a,b){return a.delay-b.delay;});
  };

  CrimsonGame.prototype._spawnEnemy = function(type) {
    var cfg=ENEMY_CFG[type];
    var side=Math.floor(Math.random()*4), x, z;
    if      (side===0){x=-9.5+Math.random()*19; z=-11;}
    else if (side===1){x=-9.5+Math.random()*19; z= 11;}
    else if (side===2){x=-11; z=-9.5+Math.random()*19;}
    else              {x= 11; z=-9.5+Math.random()*19;}
    this._spawnEnemyAt(type, x, z);
  };

  CrimsonGame.prototype._spawnEnemyAt = function(type, x, z) {
    var cfg=ENEMY_CFG[type];
    var e={
      id:this._eid++, x:x, z:z,
      hp:cfg.hp, maxHp:cfg.hp, spd:cfg.spd,
      type:type, w:cfg.w, h:cfg.h,
      r:cfg.r, g:cfg.g, b:cfg.b,
      score:cfg.score, ai:cfg.ai,
      ang:0, bob:0,
    };
    if (cfg.shoots)  { e.shoots=true; e.shootTimer=2.5+Math.random(); }
    if (cfg.splits)  { e.splits=true; }
    if (cfg.ai==='rush')      { e.zigzagPhase=Math.random()*6; }
    if (cfg.ai==='teleport')  { e.teleTimer=1.5+Math.random(); }
    if (cfg.ai==='necro')     { e.summonTimer=5+Math.random()*2; e.necroShootTimer=3+Math.random()*2; }
    this.s.enemies.push(e);
  };

  CrimsonGame.prototype._updateHUD = function() {
    var s=this.s, p=s.p;
    var sc=document.getElementById('cg-score');
    var hp=document.getElementById('cg-hp');
    var wv=document.getElementById('cg-wave');
    var bomb='';
    for (var b=0;b<p.bombCharges;b++) bomb+='💣';
    var powerIcon = '';
    if (p.fireMode==='rapid')  powerIcon='⚡';
    if (p.fireMode==='triple') powerIcon='✦';
    if (p.speedTimer>0)        powerIcon+='💨';
    if (sc) sc.textContent = 'score: '+s.score + (bomb?' '+bomb:'') + (powerIcon?' '+powerIcon:'');
    if (wv) wv.textContent = s.wave>0 ? 'wave '+s.wave+'/'+WAVES.length : '';
    if (hp) {
      var h='';
      for (var i=0;i<p.maxHp;i++) h+='<span class="'+(i<p.hp?'cg-hf':'cg-he')+'">'+(i<p.hp?'♥':'♡')+'</span>';
      hp.innerHTML=h;
    }
    var msg=document.getElementById('cg-msg');
    if (msg) {
      if (s.msgT>0||s.over||s.won) {
        msg.style.display='flex';
        var lines=s.msg.split('\n');
        msg.innerHTML=lines.map(function(l,i){
          return '<span class="'+(i===0?'cg-mh':'cg-ml')+'">'+l+'</span>';
        }).join('');
      } else { msg.style.display='none'; }
    }
  };

  // ── Render ──────────────────────────────────────────────────────────
  CrimsonGame.prototype._render = function() {
    var gl=this.gl, s=this.s, now=Date.now();
    var wrap=document.getElementById('cg-canvas-wrap');
    if (wrap) {
      var W=wrap.clientWidth, H=wrap.clientHeight;
      if (W!==this._W||H!==this._H) {
        this.canvas.width=W; this.canvas.height=H;
        this._W=W; this._H=H;
        gl.viewport(0,0,W,H);
      }
    }
    var W=this.canvas.width, H=this.canvas.height;
    gl.clearColor(0.065,0.055,0.08,1);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

    var px=s.p.x, pz=s.p.z;
    var shakeX = this.trauma*this.trauma * Math.sin(now*0.05)*0.8;
    var shakeZ = this.trauma*this.trauma * Math.cos(now*0.07)*0.6;
    var eX=px+shakeX, eY=17, eZ=pz+11+shakeZ;

    m4persp(this.mProj, Math.PI/4, W/H, 0.1, 120);
    m4look(this.mView, eX,eY,eZ, px,0,pz);
    m4mul(this.mVP, this.mProj, this.mView);
    m4inv(this.mInv, this.mVP);

    gl.uniform3f(this.loc.uEye, eX, eY, eZ);
    gl.uniform3f(this.loc.uE, 0,0,0);
    gl.uniform1f(this.loc.uRim, 0);

    var self=this;

    // Floor
    this._draw(this.quadBuf, this.quadCount, 0,0,0, 0, 22,1,22, 0, [0.1,0.085,0.12,1], [0,0,0], 0, this.stoneTex, 0.55, 0.18);

    // Walls
    this._draw(this.boxBuf,this.boxCount,  0, 0.5,-10.5, 0, 22,1,1,  0, [0.14,0.11,0.17,1],[0,0,0],0, this.wallTex, 0.45, 0.28);
    this._draw(this.boxBuf,this.boxCount,  0, 0.5, 10.5, 0, 22,1,1,  0, [0.14,0.11,0.17,1],[0,0,0],0, this.wallTex, 0.45, 0.28);
    this._draw(this.boxBuf,this.boxCount,-10.5,0.5,0,    0, 1,1,22,  0, [0.14,0.11,0.17,1],[0,0,0],0, this.wallTex, 0.45, 0.28);
    this._draw(this.boxBuf,this.boxCount, 10.5,0.5,0,    0, 1,1,22,  0, [0.14,0.11,0.17,1],[0,0,0],0, this.wallTex, 0.45, 0.28);
    // Wall accent
    this._draw(this.boxBuf,this.boxCount,  0,1.05,-10.5, 0, 22,0.1,1.1, 0, [0.35,0.22,0.52,1],[0,0,0],0);
    this._draw(this.boxBuf,this.boxCount,  0,1.05, 10.5, 0, 22,0.1,1.1, 0, [0.35,0.22,0.52,1],[0,0,0],0);
    this._draw(this.boxBuf,this.boxCount,-10.5,1.05,0,   0, 1.1,0.1,22, 0, [0.35,0.22,0.52,1],[0,0,0],0);
    this._draw(this.boxBuf,this.boxCount, 10.5,1.05,0,   0, 1.1,0.1,22, 0, [0.35,0.22,0.52,1],[0,0,0],0);

    // Pillars
    PILLARS.forEach(function(pl){
      self._draw(self.cylBuf,self.cylCount, pl.x,0.75,pl.z, 0, 1.4,1.5,1.4, 0, [0.22,0.2,0.25,1],[0,0,0],0.1, self.wallTex, 0.4, 0.35);
      self._draw(self.boxBuf,self.boxCount, pl.x,1.55,pl.z, 0, 1.5,0.15,1.5,0, [0.28,0.24,0.32,1],[0,0,0],0,   self.wallTex, 0.35, 0.35);
    });

    // Bomb flash overlay (drawn at y=0.1 as a bright quad)
    if (s.bombFlash > 0) {
      var fa = s.bombFlash * 0.7;
      gl.depthMask(false);
      this._draw(this.quadBuf,this.quadCount, 0,0.1,0, 0, 24,1,24, 0, [1.0,0.9,0.6,fa],[0,0,0],0);
      gl.depthMask(true);
    }

    // Blood splats
    s.splats.forEach(function(sp){
      self._draw(self.quadBuf,self.quadCount, sp.x,0.005,sp.z, 0, sp.sz*2,1,sp.sz*2, 0, [0.82,0.04,0.04,sp.a],[0,0,0],0);
    });

    // Powerups
    s.powerups.forEach(function(pu){
      var pulse=0.04*Math.sin(now*0.006+pu.bobPhase);
      self._draw(self.discBuf,self.discCount, pu.x,pu.y,pu.z, pu.rot, 0.55,0.15,0.55, 0,
        [pu.r,pu.g,pu.b,0.9], [pu.r*0.4,pu.g*0.4,pu.b*0.4], 0.5);
      self._draw(self.sphereBuf,self.sphereCount, pu.x,pu.y+0.18,pu.z, 0, 0.28+pulse,0.28+pulse,0.28+pulse, 0,
        [pu.r,pu.g,pu.b,1.0], [pu.r*0.6,pu.g*0.6,pu.b*0.6], 0.8);
    });

    // Enemies
    s.enemies.forEach(function(e){
      if (e._dead) return;
      var flash=(e.hp<e.maxHp) && (Math.floor(now/80)%2===0);
      var er=flash?Math.min(e.r+0.4,1):e.r;
      var eg=flash?Math.min(e.g+0.3,1):e.g;
      var eb=flash?Math.min(e.b+0.4,1):e.b;
      var by=e.bob||0;

      // Animation helpers for this enemy
      var wp   = e.walkPhase || 0;
      var fwdX = Math.sin(e.ang), fwdZ = -Math.cos(e.ang);
      var sdX  = Math.cos(e.ang), sdZ  =  Math.sin(e.ang);

      if (e.type===0) {
        // Grunt: body bob + two leg cylinders + two arm boxes
        var gBob = Math.abs(Math.sin(wp)) * 0.07;
        var lSwing = Math.sin(wp) * 0.22, rSwing = -lSwing;
        var lLift  = Math.max(0, Math.sin(wp))   * 0.12;
        var rLift  = Math.max(0, Math.sin(wp+Math.PI)) * 0.12;
        // Legs
        self._draw(self.cylBuf,self.cylCount,
          e.x+sdX*0.18+fwdX*lSwing, 0.22+lLift, e.z+sdZ*0.18+fwdZ*lSwing,
          e.ang, 0.16,0.44,0.16, 0,[er*0.7,eg*0.5,eb*0.5,1],[0,0,0],0);
        self._draw(self.cylBuf,self.cylCount,
          e.x-sdX*0.18+fwdX*rSwing, 0.22+rLift, e.z-sdZ*0.18+fwdZ*rSwing,
          e.ang, 0.16,0.44,0.16, 0,[er*0.7,eg*0.5,eb*0.5,1],[0,0,0],0);
        // Body
        self._draw(self.cylBuf,self.cylCount, e.x,e.h/2*0.6+0.44+gBob,e.z, e.ang, e.w*1.8,e.h*0.6,e.w*1.8, 0,[er,eg,eb,1],[0,0,0],0.15);
        // Arms (swing opposite to legs)
        var laSwing = -lSwing * 0.8, raSwing = -rSwing * 0.8;
        self._draw(self.boxBuf,self.boxCount,
          e.x+sdX*0.38+fwdX*laSwing, e.h*0.5+gBob, e.z+sdZ*0.38+fwdZ*laSwing,
          e.ang, 0.14,0.38,0.14, 0,[er*0.85,eg*0.7,eb*0.7,1],[0,0,0],0);
        self._draw(self.boxBuf,self.boxCount,
          e.x-sdX*0.38+fwdX*raSwing, e.h*0.5+gBob, e.z-sdZ*0.38+fwdZ*raSwing,
          e.ang, 0.14,0.38,0.14, 0,[er*0.85,eg*0.7,eb*0.7,1],[0,0,0],0);
        // Head
        self._draw(self.sphereBuf,self.sphereCount, e.x,e.h+0.18+gBob,e.z, 0, 0.22,0.22,0.22, 0,[er*1.1,eg,eb,1],[0,0,0],0.2);

      } else if (e.type===1) {
        // Rusher: spinning wheels + forward lean based on speed
        var lean = Math.sin(e.zigzagPhase||0) * 0.08; // slight zigzag tilt
        var wheelSpin = wp * 2.5;
        self._draw(self.cylBuf,self.cylCount, e.x,e.h/2+by,e.z, e.ang, e.w*2,e.h,e.w*2, 0,[er,eg,eb,1],[0,0,0],0.2);
        // Two spinning wheel rings
        self._draw(self.cylBuf,self.cylCount, e.x,e.h/2+by,e.z, e.ang+Math.PI/2+wheelSpin, 0.08,e.w*2.1,0.08, 0,[1,0.6,0.1,1],[0,0,0],0);
        self._draw(self.cylBuf,self.cylCount, e.x,e.h/2+by,e.z, e.ang+wheelSpin,           0.08,e.w*2.1,0.08, 0,[1,0.6,0.1,1],[0,0,0],0);
        // Spoke detail
        self._draw(self.boxBuf,self.boxCount, e.x+fwdX*e.w*0.9,e.h/2+by,e.z+fwdZ*e.w*0.9, e.ang, 0.1,0.1,e.w*1.8, 0,[0.9,0.5,0.05,1],[0,0,0],0);

      } else if (e.type===2) {
        // Brute: heavy stomp — big bob, arm swing, head nod
        var bBob = Math.abs(Math.sin(wp * 0.8)) * 0.14; // slow heavy stomp
        var sa3  = e.ang + Math.PI/2;
        var so   = e.w * 0.9;
        var aSwL = Math.sin(wp * 0.8) * 0.3;       // arm swing
        var aSwR = -aSwL;
        // Legs (heavy stumps)
        var blLift = Math.max(0, Math.sin(wp*0.8))   * 0.18;
        var brLift = Math.max(0, Math.sin(wp*0.8+Math.PI)) * 0.18;
        self._draw(self.cylBuf,self.cylCount,
          e.x+sdX*0.28+fwdX*Math.sin(wp*0.8)*0.25, 0.28+blLift, e.z+sdZ*0.28+fwdZ*Math.sin(wp*0.8)*0.25,
          e.ang, 0.28,0.56,0.28, 0,[er*0.75,eg*0.3,eb*0.3,1],[0,0,0],0);
        self._draw(self.cylBuf,self.cylCount,
          e.x-sdX*0.28+fwdX*Math.sin(wp*0.8+Math.PI)*0.25, 0.28+brLift, e.z-sdZ*0.28+fwdZ*Math.sin(wp*0.8+Math.PI)*0.25,
          e.ang, 0.28,0.56,0.28, 0,[er*0.75,eg*0.3,eb*0.3,1],[0,0,0],0);
        // Body
        self._draw(self.cylBuf,self.cylCount, e.x,e.h/2+0.2+bBob,e.z, e.ang, e.w*2,e.h*0.7,e.w*2, 0,[er,eg,eb,1],[0,0,0],0.1);
        // Arms (big swinging shoulder-blocks)
        self._draw(self.boxBuf,self.boxCount,
          e.x+Math.sin(sa3)*so+fwdX*aSwL*0.5, e.h*0.75+bBob, e.z-Math.cos(sa3)*so+fwdZ*aSwL*0.5,
          e.ang+aSwL, 0.3,0.4,0.3, 0,[0.45,0.02,0.06,1],[0,0,0],0);
        self._draw(self.boxBuf,self.boxCount,
          e.x-Math.sin(sa3)*so+fwdX*aSwR*0.5, e.h*0.75+bBob, e.z+Math.cos(sa3)*so+fwdZ*aSwR*0.5,
          e.ang+aSwR, 0.3,0.4,0.3, 0,[0.45,0.02,0.06,1],[0,0,0],0);
        // Head (nods with stomp)
        var headNod = Math.sin(wp*0.8) * 0.06;
        self._draw(self.boxBuf,self.boxCount, e.x+fwdX*headNod,e.h+0.2+bBob,e.z+fwdZ*headNod, e.ang, 0.35,0.3,0.35, 0,[0.6,0.05,0.1,1],[0,0,0],0.1);
        // HP bar
        if (e.hp<e.maxHp) {
          var frac=e.hp/e.maxHp;
          self._draw(self.boxBuf,self.boxCount, e.x-(0.4*(1-frac)),e.h+0.55+bBob,e.z, 0, frac*0.8,0.1,0.1, 0,[0.1,0.9,0.2,0.9],[0,0,0],0);
          self._draw(self.boxBuf,self.boxCount, e.x+(frac*0.4),e.h+0.55+bBob,e.z, 0, (1-frac)*0.8,0.1,0.1, 0,[0.6,0.1,0.1,0.6],[0,0,0],0);
        }

      } else if (e.type===3) {
        // Teleporter: levitate + slow spin + orbiting rings
        var levitate = Math.sin(wp * 1.5) * 0.12 + 0.15;
        var pulse2   = 0.05*Math.sin(now*0.007+e.id);
        var rs = e.w + pulse2;
        self._draw(self.sphereBuf,self.sphereCount, e.x,e.h/2+levitate,e.z, 0, rs*2,rs*2,rs*2, 0,[er,eg,eb,0.9],[er*0.4,eg*0.1,eb*0.5],0.7);
        // Two counter-rotating rings at offset angles
        self._draw(self.cylBuf,self.cylCount, e.x,e.h/2+levitate,e.z, wp*0.8,          1.1,0.07,1.1, 0,[0.8,0.4,1.0,0.7],[0,0,0],0.5);
        self._draw(self.cylBuf,self.cylCount, e.x,e.h/2+levitate,e.z, wp*0.8+Math.PI/3,0.9,0.07,0.9, 0,[0.6,0.2,1.0,0.5],[0,0,0],0.3);

      } else if (e.type===4) {
        // Splitter: spin top + wobble
        var wobble = Math.sin(wp * 2) * 0.05;
        self._draw(self.cylBuf,self.cylCount, e.x,e.h/2+by+wobble,e.z, wp, e.w*2,e.h,e.w*2, 0,[er,eg,eb,1],[0,0,0],0.2);
        self._draw(self.discBuf,self.discCount, e.x,e.h+0.02+by+wobble,e.z, wp*1.3,       e.w*1.7,0.1,e.w*1.7, 0,[1.0,0.95,0.3,0.8],[0,0,0],0);
        self._draw(self.discBuf,self.discCount, e.x,e.h+0.1+by+wobble, e.z, wp*1.3+0.4,   e.w*1.2,0.1,e.w*1.2, 0,[1.0,0.6,0.1,0.8],[0,0,0],0);

      } else if (e.type===5) {
        // Necromancer: gliding hover + staff swing + robe sway
        var nHover = Math.sin(wp * 1.2) * 0.1 + 0.1;
        var nSway  = Math.sin(wp * 0.7) * 0.08;
        self._draw(self.cylBuf,self.cylCount,  e.x+fwdX*nSway, e.h/2+nHover,       e.z+fwdZ*nSway, e.ang, e.w*2,e.h,e.w*2, 0,[er,eg,eb,1],[er*0.1,eg*0.15,eb*0.15],0.3);
        self._draw(self.discBuf,self.discCount, e.x+fwdX*nSway, e.h+0.02+nHover,   e.z+fwdZ*nSway, 0, 0.7,0.1,0.7, 0,[0.08,0.7,0.6,1],[0,0,0],0);
        self._draw(self.coneBuf,self.coneCount, e.x+fwdX*nSway, e.h+0.5+nHover,    e.z+fwdZ*nSway, e.ang, 0.38,0.75,0.38, 0,[0.06,0.6,0.5,1],[0,0,0.1],0.2);
        // Staff swings with opposing arm
        var stSwing = Math.sin(wp * 0.7 + Math.PI) * 0.3;
        var stoff = e.ang + 1.0 + stSwing;
        var sx2 = e.x+Math.sin(stoff)*0.4, sz2 = e.z-Math.cos(stoff)*0.4;
        self._draw(self.cylBuf,self.cylCount,   sx2, 0.9+nHover, sz2, e.ang+stSwing, 0.06,1.8,0.06, 0,[0.3,0.5,0.3,1],[0,0,0],0);
        self._draw(self.sphereBuf,self.sphereCount, sx2, 1.85+nHover, sz2, 0, 0.22,0.22,0.22, 0,[0.1,1.0,0.9,1],[0.1,0.7,0.6],0.9);

      } else if (e.mini) {
        // Mini-grunt: small hopping
        var miniBob = Math.abs(Math.sin(wp * 1.5)) * 0.1;
        self._draw(self.cylBuf,self.cylCount, e.x,e.h/2+miniBob,e.z, e.ang, e.w*2,e.h,e.w*2, 0,[er,eg,eb,1],[0,0,0],0.2);
      }
    });

    // ── Player ──────────────────────────────────────────────────────
    var p    = s.p;
    var wp   = p.walkPhase;
    var fwdX = Math.sin(p.ang), fwdZ = -Math.cos(p.ang);
    var sdX  = Math.cos(p.ang), sdZ  =  Math.sin(p.ang);

    // body bob: twice per stride
    var pBob     = Math.abs(Math.sin(wp)) * 0.07;
    // leg swing
    var pLSwing  = Math.sin(wp)          * 0.2;
    var pRSwing  = Math.sin(wp + Math.PI)* 0.2;
    var pLLift   = Math.max(0, Math.sin(wp))           * 0.13;
    var pRLift   = Math.max(0, Math.sin(wp + Math.PI)) * 0.13;
    // robe hem squash on landing
    var pRobeFlr = 1.0 + Math.abs(Math.sin(wp)) * 0.06;
    // staff arm swings counter to lead foot
    var staffSwing = Math.sin(wp + Math.PI) * 0.22;

    var pFlash = p.inv>0 && (Math.floor(now/60)%2===0);
    if (!pFlash) {
      // Boot tips peeking from under robe
      self._draw(self.sphereBuf,self.sphereCount,
        p.x+sdX*0.2+fwdX*pLSwing, 0.1+pLLift, p.z+sdZ*0.2+fwdZ*pLSwing,
        0, 0.18,0.14,0.22, 0,[0.12,0.08,0.18,1],[0,0,0],0);
      self._draw(self.sphereBuf,self.sphereCount,
        p.x-sdX*0.2+fwdX*pRSwing, 0.1+pRLift, p.z-sdZ*0.2+fwdZ*pRSwing,
        0, 0.18,0.14,0.22, 0,[0.12,0.08,0.18,1],[0,0,0],0);
      // Robe (bobs + hem squash)
      self._draw(self.cylBuf,self.cylCount, p.x,0.52+pBob,p.z, p.ang, 0.9,1.0,0.9, 0,[0.52,0.32,0.88,1],[0,0,0],0.2);
      // Robe base flare (squash on landing)
      self._draw(self.discBuf,self.discCount, p.x,0.02,p.z, p.ang, pRobeFlr,0.1,pRobeFlr, 0,[0.38,0.22,0.65,1],[0,0,0],0);
      // Hat brim
      self._draw(self.discBuf,self.discCount, p.x,1.1+pBob,p.z, p.ang, 1.05,0.1,1.05, 0,[0.22,0.1,0.4,1],[0,0,0],0.1);
      // Hat cone
      self._draw(self.coneBuf,self.coneCount, p.x,1.58+pBob,p.z, p.ang, 0.38,0.9,0.38, 0,[0.18,0.08,0.35,1],[0,0,0],0.1);
      // Hat tip sphere (glowing)
      self._draw(self.sphereBuf,self.sphereCount, p.x,2.08+pBob,p.z, 0, 0.14,0.14,0.14, 0,[0.85,0.6,1.0,1],[0.3,0.1,0.5],0.8);
      // Staff (arm swing)
      var sang = p.ang + 1.1 + staffSwing;
      var stx  = p.x + Math.sin(sang)*0.42, stz = p.z - Math.cos(sang)*0.42;
      self._draw(self.cylBuf,self.cylCount, stx, 0.75+pBob, stz, p.ang+staffSwing, 0.07,1.5,0.07, 0,[0.55,0.38,0.12,1],[0,0,0],0);
      // Staff orb
      var orbPulse = 0.04*Math.sin(now*0.005);
      self._draw(self.sphereBuf,self.sphereCount, stx, 1.6+pBob, stz, 0, 0.22+orbPulse,0.22+orbPulse,0.22+orbPulse, 0,[0.95,0.7,1.0,1],[0.4,0.15,0.6],0.9);
    }

    // Projectiles
    s.projs.forEach(function(pr){
      if (pr.own==='p') {
        self._draw(self.sphereBuf,self.sphereCount, pr.x,0.32,pr.z, 0, 0.22,0.22,0.22, 0,[0.98,0.1,0.18,1],[0.5,0.0,0.0],0.6);
        // Trail
        self._draw(self.sphereBuf,self.sphereCount, pr.x-pr.dx*0.028,0.32,pr.z-pr.dz*0.028, 0, 0.13,0.13,0.13, 0,[0.98,0.1,0.18,0.4],[0.2,0,0],0);
      } else if (pr.own==='en') {
        // Homing: cyan sphere
        self._draw(self.sphereBuf,self.sphereCount, pr.x,0.32,pr.z, 0, 0.2,0.2,0.2, 0,[0.1,0.9,0.9,1],[0.0,0.3,0.3],0.5);
      } else {
        // Enemy: orange cube
        self._draw(self.boxBuf,self.boxCount, pr.x,0.3,pr.z, now*0.003,0.2,0.2,0.2, 0,[1.0,0.5,0.05,1],[0.2,0.05,0],0.3);
      }
    });

    // Death particles
    s.particles.forEach(function(pt){
      var a=Math.max(0, pt.life/pt.maxLife);
      self._draw(self.boxBuf,self.boxCount, pt.x,pt.y,pt.z, pt.life*8, pt.scale,pt.scale,pt.scale, 0,[pt.r,pt.g,pt.b,a],[0,0,0],0);
    });
  };

  // Draw call: bind buffer, set uniforms, draw
  // tex/texAmt/texScale are optional — pass to texture floor/walls
  CrimsonGame.prototype._draw = function(buf, count, tx,ty,tz, ry, sx,sy,sz, _r2, rgba, emit, rim, tex, texAmt, texScale) {
    var gl=this.gl;
    m4trs(this.mM, tx,ty,tz, ry||0, sx,sy,sz);
    m4mul(this.mMVP, this.mVP, this.mM);
    gl.uniformMatrix4fv(this.loc.uMVP, false, this.mMVP);
    gl.uniformMatrix4fv(this.loc.uM,   false, this.mM);
    gl.uniform4f(this.loc.uC, rgba[0],rgba[1],rgba[2],rgba[3]);
    gl.uniform3f(this.loc.uE, emit[0],emit[1],emit[2]);
    gl.uniform1f(this.loc.uRim, rim||0);
    if (tex && texAmt) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1f(this.loc.uTexAmt,   texAmt);
      gl.uniform1f(this.loc.uTexScale, texScale||0.25);
    } else {
      gl.uniform1f(this.loc.uTexAmt, 0);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(this.loc.aP, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(this.loc.aN, 3, gl.FLOAT, false, 24, 12);
    gl.drawArrays(gl.TRIANGLES, 0, count);
  };

  // Unproject screen pixel → world XZ (Y=0 plane)
  CrimsonGame.prototype._unproject = function(mx, my) {
    var W=this.canvas.width, H=this.canvas.height;
    var ndx=(2*mx/W)-1, ndy=1-(2*my/H);
    var iv=this.mInv;
    function xfm(x,y,z,w) {
      var rx=iv[0]*x+iv[4]*y+iv[8]*z +iv[12]*w;
      var ry=iv[1]*x+iv[5]*y+iv[9]*z +iv[13]*w;
      var rz=iv[2]*x+iv[6]*y+iv[10]*z+iv[14]*w;
      var rw=iv[3]*x+iv[7]*y+iv[11]*z+iv[15]*w;
      if (Math.abs(rw)>1e-8){rx/=rw;ry/=rw;rz/=rw;}
      return [rx,ry,rz];
    }
    var nr=xfm(ndx,ndy,-1,1), fr=xfm(ndx,ndy,1,1);
    var dy=fr[1]-nr[1];
    if (Math.abs(dy)<1e-8) return [nr[0],0,nr[2]];
    var t=-nr[1]/dy;
    return [nr[0]+t*(fr[0]-nr[0]), 0, nr[2]+t*(fr[2]-nr[2])];
  };

  // ──────────────────────────────────────────────────────────────────
  //  Public API & DOM wiring
  // ──────────────────────────────────────────────────────────────────
  var _g = null;

  window.openCrimsonGame = function() {
    var modal = document.getElementById('crimson-modal');
    if (!modal) return;
    modal.classList.add('open');
    var cv = document.getElementById('cg-canvas');

    function resize() {
      var box = document.getElementById('cg-canvas-wrap');
      if (!box||!cv) return;
      cv.width  = box.clientWidth;
      cv.height = box.clientHeight;
      if (_g&&_g.gl) _g.gl.viewport(0,0,cv.width,cv.height);
    }
    resize();

    if (!_g) {
      _g = new CrimsonGame(cv);
    } else {
      _g.running = false;
      _g._resetState();
    }
    setTimeout(function(){
      resize();
      _g.running = false;
      _g.start();
    }, 60);
  };

  window.closeCrimsonGame = function() {
    var modal = document.getElementById('crimson-modal');
    if (modal) modal.classList.remove('open');
    if (_g) _g.running = false;
  };

  // Click handler on wizard element
  document.addEventListener('DOMContentLoaded', function() {
    var mage = document.querySelector('.mage.mage-lg');
    if (mage) {
      mage.style.cursor = 'pointer';
      mage.title = 'Play Paint the Town Crimson!';
      mage.addEventListener('click', function(e) {
        e.preventDefault(); e.stopPropagation();
        window.openCrimsonGame();
      });
    }
  });
  // Also try immediately if DOM is already ready
  (function(){
    var mage = document.querySelector('.mage.mage-lg');
    if (mage && !mage._cgBound) {
      mage._cgBound = true;
      mage.style.cursor = 'pointer';
      mage.title = 'Play Paint the Town Crimson!';
      mage.addEventListener('click', function(e) {
        e.preventDefault(); e.stopPropagation();
        window.openCrimsonGame();
      });
    }
  })();

})();
