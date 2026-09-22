(() => {
  'use strict';
  const figure = document.querySelector('.constellation');
  if (!figure) return;
  const canvas = figure.querySelector('canvas');
  const stage = figure.querySelector('.constellation-stage');
  const links = [...figure.querySelectorAll('.star-node')];
  const controls = figure.querySelector('.constellation-controls');
  const pauseButton = figure.querySelector('[data-star-pause]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const caption = figure.querySelector('.star-caption');
  let gl, program, sphere, paths, ring, uniforms, attributes, textures = [];
  let width = 1, height = 1, camera = 6, yaw = .08, pitch = -.08, targetYaw = .08, targetPitch = -.08;
  let frame = 0, last = 0, ticks = 0, phase = 0, visible = true, hovering = false, paused = false, ready = false;
  let drag = null, active = 0, page = 0, positions = [], nodes = [], beads = [];
  const images = new Map();
  const focal = 2.41421356;
  const pageSize = 6;
  const totalPages = Math.ceil(links.length / pageSize);
  const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
  const vertexSource = `
    attribute vec3 position; attribute vec3 normal;
    uniform vec3 center; uniform float radius; uniform vec2 rotation;
    uniform float aspect; uniform float camera;
    varying vec3 surfaceNormal; varying vec3 localNormal;
    vec3 turn(vec3 p) {
      float cy=cos(rotation.x),sy=sin(rotation.x),cx=cos(rotation.y),sx=sin(rotation.y);
      p=vec3(cy*p.x+sy*p.z,p.y,-sy*p.x+cy*p.z);
      return vec3(p.x,cx*p.y-sx*p.z,sx*p.y+cx*p.z);
    }
    void main(){
      vec3 p=turn(position*radius+center); float z=p.z-camera;
      gl_Position=vec4(p.x*2.41421356/aspect,p.y*2.41421356,-1.002002*z-.2002002,-z);
      surfaceNormal=turn(normal); localNormal=normal;
    }`;
  const fragmentSource = `
    precision mediump float;
    uniform vec3 color; uniform vec3 accent; uniform float opacity;
    uniform bool lit; uniform bool mapped; uniform sampler2D imageMap;
    varying vec3 surfaceNormal; varying vec3 localNormal;
    void main(){
      if(!lit){gl_FragColor=vec4(color,opacity);return;}
      vec3 n=normalize(surfaceNormal); vec3 light=normalize(vec3(-.5,.7,1.5));
      float diffuse=max(dot(n,light),0.0);
      float rim=pow(1.0-max(n.z,0.0),2.8);
      float spec=pow(max(dot(reflect(-light,n),vec3(0,0,1)),0.0),36.0);
      vec3 base=color;
      if(mapped){ vec2 uv=localNormal.xy*.5+.5; base=mix(color,texture2D(imageMap,uv).rgb,.90); }
      else{float vein=sin(localNormal.y*34.0+sin(localNormal.x*11.0)*1.2);base*=.95+vein*.05;}
      vec3 result=base*(.26+.74*diffuse)+vec3(spec*.30)+accent*rim*.3;
      gl_FragColor=vec4(result,opacity);
    }`;
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error('Shader unavailable');
    return shader;
  }
  function mesh(vertices, indices, mode) {
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    let index;
    if (indices) { index = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW); }
    return {buffer,index,count:indices ? indices.length : vertices.length/6,mode};
  }
  function makeSphere() {
    const v=[],i=[],lat=24,lon=36;
    for(let y=0;y<=lat;y++) for(let x=0;x<=lon;x++) {
      const a=y/lat*Math.PI,b=x/lon*Math.PI*2;
      const p=[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];v.push(...p,...p);
    }
    for(let y=0;y<lat;y++) for(let x=0;x<lon;x++){const a=y*(lon+1)+x,b=a+lon+1;i.push(a,b,a+1,b,b+1,a+1);}
    return mesh(v,i,gl.TRIANGLES);
  }
  function rotate(p, ry=yaw, rx=pitch) {
    const x=Math.cos(ry)*p[0]+Math.sin(ry)*p[2],z=-Math.sin(ry)*p[0]+Math.cos(ry)*p[2];
    return [x,Math.cos(rx)*p[1]-Math.sin(rx)*z,Math.sin(rx)*p[1]+Math.cos(rx)*z];
  }
  function line(points) {return mesh(points.flatMap(p=>[...p,0,0,1]),null,gl.LINE_STRIP);}
  function disposePath(p) {gl.deleteBuffer(p.buffer);if(p.index)gl.deleteBuffer(p.index);}
  function layout() {
    nodes=links.slice(page*pageSize,(page+1)*pageSize);
    const four=[[-1.32,.72,.50],[1.08,1.24,-.28],[1.48,-.93,.12],[-.74,-1.20,-.38]];
    const six=[[-1.60,.92,.28],[.04,1.52,-.24],[1.66,.70,.08],[1.46,-.94,-.30],[-.22,-1.48,.18],[-1.72,-.43,-.10]];
    positions=nodes.map((_,i)=>({center:(nodes.length<=4?four:six)[i],radius:nodes.length<=4?([.48,.40,.35,.38][i]):.29}));
    if(paths) paths.forEach(disposePath);
    paths=[];beads=[];
    // Orbital curves describe the shared creative space, not extra products.
    for(let r=0;r<4;r++) {
      const points=[];
      for(let j=0;j<=180;j++) {
        const a=j/180*Math.PI*2;
        points.push(rotate([Math.cos(a)*(2.12+r*.15),Math.sin(a)*(1.40+r*.13),0],r*.53-.7,r*.45+.32));
      }
      paths.push(line(points));
      for(let j=0;j<5;j++) beads.push({center:points[(j*31+r*17)%180],radius:.015+(j%3)*.008});
    }
    positions.forEach(({center:c},i)=>{
      const points=[];
      for(let k=0;k<=48;k++){const t=k/48,arch=Math.sin(t*Math.PI);points.push([c[0]*t+.22*arch*(i%2?-1:1),c[1]*t,c[2]*t+.35*arch]);}
      paths.push(line(points));
    });
    active=page*pageSize;
    links.forEach((link,i)=>{link.hidden=i<page*pageSize||i>=(page+1)*pageSize;});
    select(active);request();
  }
  function texture(source, mark) {
    const value=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,value);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([114,81,64,255]));
    function upload(image) {
      if(gl.isContextLost())return;
      gl.bindTexture(gl.TEXTURE_2D,value);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);request();
    }
    if(source) {
      const image=images.get(source)||new Image();
      images.set(source,image);
      if(image.complete&&image.naturalWidth)upload(image);
      else{image.onload=()=>upload(image);image.src=source;}
    } else {
      const tile=document.createElement('canvas');tile.width=256;tile.height=256;
      const ctx=tile.getContext('2d');ctx.fillStyle='#e2d8c5';ctx.fillRect(0,0,256,256);ctx.fillStyle='#8d422b';ctx.font='100px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(mark,128,128);upload(tile);
    }
    return value;
  }
  function init() {
    try {
      gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power'});
      if(!gl) return fallback();
      program=gl.createProgram();
      const vs=compile(gl.VERTEX_SHADER,vertexSource),fs=compile(gl.FRAGMENT_SHADER,fragmentSource);
      gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Renderer unavailable');
      gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(program);
      attributes={position:gl.getAttribLocation(program,'position'),normal:gl.getAttribLocation(program,'normal')};
      uniforms=Object.fromEntries(['center','radius','rotation','aspect','camera','color','accent','opacity','lit','mapped','imageMap'].map(key=>[key,gl.getUniformLocation(program,key)]));
      sphere=makeSphere();ring=line(Array.from({length:97},(_,i)=>[Math.cos(i/96*Math.PI*2),Math.sin(i/96*Math.PI*2),0]));
      gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0,0,0,0);
      textures=links.map(link=>texture(link.dataset.starImage,link.dataset.starMark));
      paths=null;ready=true;figure.dataset.renderer='webgl';controls.hidden=false;
      figure.querySelector('.star-drag-hint').hidden=false;
      layout();resize();
    } catch { fallback(); }
  }
  function fallback() {
    ready=false;cancelAnimationFrame(frame);frame=0;delete figure.dataset.renderer;
    controls.hidden=true;figure.querySelector('.star-drag-hint').hidden=true;
    links.forEach(link=>{link.hidden=false;link.style.removeProperty('transform');link.style.removeProperty('--orb-size');});
  }
  function draw(mesh,center,radius,color,opacity=1,lit=false,map=null) {
    gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);
    gl.enableVertexAttribArray(attributes.position);gl.vertexAttribPointer(attributes.position,3,gl.FLOAT,false,24,0);
    gl.enableVertexAttribArray(attributes.normal);gl.vertexAttribPointer(attributes.normal,3,gl.FLOAT,false,24,12);
    gl.uniform3fv(uniforms.center,center);gl.uniform1f(uniforms.radius,radius);gl.uniform3fv(uniforms.color,color);
    gl.uniform1f(uniforms.opacity,opacity);gl.uniform1i(uniforms.lit,lit);gl.uniform1i(uniforms.mapped,!!map);
    if(map){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,map);gl.uniform1i(uniforms.imageMap,0);}
    if(mesh.index){gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.index);gl.drawElements(mesh.mode,mesh.count,gl.UNSIGNED_SHORT,0);}else gl.drawArrays(mesh.mode,0,mesh.count);
  }
  function render() {
    if(!ready)return;
    const dark=document.documentElement.dataset.theme==='dark';
    const gold=dark?[.75,.63,.45]:[.47,.34,.21],jade=dark?[.42,.63,.58]:[.23,.39,.32],accent=dark?[.95,.48,.30]:[.68,.22,.13];
    gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);
    gl.uniform2f(uniforms.rotation,yaw,pitch);gl.uniform1f(uniforms.aspect,width/height);gl.uniform1f(uniforms.camera,camera);gl.uniform3fv(uniforms.accent,accent);
    paths.forEach((mesh,i)=>draw(mesh,[0,0,0],1,i%2?jade:gold,i>=4?.55:.28));
    beads.forEach((bead,i)=>draw(sphere,bead.center,bead.radius,i%3?gold:jade,.95,true));
    draw(sphere,[0,0,0],.12,accent,1,true);
    draw(ring,[0,0,0],.24,gold,.5);
    positions.forEach((node,i)=>{
      const selected=active===page*pageSize+i;
      draw(sphere,node.center,node.radius,i%2?gold:jade,1,true,textures[page*pageSize+i]);
      draw(ring,node.center,node.radius*1.13,selected?accent:gold,selected?.95:.48);
      if(selected)draw(ring,node.center,node.radius*1.25,accent,.18);
      const p=rotate(node.center),scale=focal/(camera-p[2]),size=node.radius*scale*height;
      const labelWidth=window.innerWidth<=760?130:160;
      const x=clamp(width/2+p[0]*scale*height/2,labelWidth/2,width-labelWidth/2),y=height/2-p[1]*scale*height/2;
      const link=nodes[i];link.style.setProperty('--orb-size',`${size}px`);
      link.style.transform=`translate3d(${x-labelWidth/2}px,${y-size/2}px,0)`;
      link.style.zIndex=String(Math.round((p[2]+4)*10));
    });
    canvas.dataset.frames=String(++ticks);
  }
  function tick(time) {
    frame=0;if(!ready||!visible||document.hidden)return;
    if(time-last<30){frame=requestAnimationFrame(tick);return;}
    const delta=Math.min((time-last)/1000,.05);last=time;
    const auto=!paused&&!reduced.matches&&!hovering&&!drag;
    if(auto){phase+=delta;targetYaw=.08+Math.sin(phase*.25)*.17;targetPitch=-.08+Math.sin(phase*.19)*.08;}
    const settle=reduced.matches?1:.18;
    yaw+=(targetYaw-yaw)*settle;pitch+=(targetPitch-pitch)*settle;
    render();
    if(auto||Math.abs(targetYaw-yaw)+Math.abs(targetPitch-pitch)>.001)request();
  }
  function request() {if(ready&&visible&&!document.hidden&&!frame)frame=requestAnimationFrame(tick);}
  function resize() {
    const box=stage.getBoundingClientRect();width=box.width;height=box.height;
    if(!width||!height)return;
    const dpr=Math.min(devicePixelRatio||1,width<430?1.25:1.5);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    camera=Math.max(5.7,height*focal*2.7/(width*.92));
    request();
  }
  function select(index) {
    active=index;links.forEach((link,i)=>{if(i===index)link.dataset.selected='true';else delete link.dataset.selected;});
    const chosen=links[index];if(!chosen)return;
    caption.querySelector('strong').textContent=chosen.querySelector('.star-label').textContent.replace('↗','').trim();
    caption.querySelector('p').textContent=chosen.dataset.starDescription;request();
  }
  function syncPause() {
    pauseButton.disabled=reduced.matches;
    pauseButton.textContent=reduced.matches?'静态模式':paused?'继续转动':'暂停转动';
    pauseButton.setAttribute('aria-pressed',String(paused||reduced.matches));
  }
  links.forEach((link,i)=>{
    link.addEventListener('pointerenter',()=>select(i));
    link.addEventListener('focus',()=>{hovering=true;select(i);});
  });
  stage.addEventListener('pointerenter',()=>{hovering=true;});
  stage.addEventListener('pointerleave',()=>{hovering=false;request();});
  figure.addEventListener('focusout',event=>{if(!figure.contains(event.relatedTarget)){hovering=false;request();}});
  canvas.addEventListener('pointerdown',event=>{
    if(!ready)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY,yaw:targetYaw,pitch:targetPitch};canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    targetYaw=clamp(drag.yaw+(event.clientX-drag.x)*.003,-.48,.48);
    targetPitch=clamp(drag.pitch+(event.clientY-drag.y)*.002,-.26,.20);request();
  });
  const endDrag=()=>{drag=null;};canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);
  figure.querySelectorAll('[data-star-rotate]').forEach(button=>button.addEventListener('click',()=>{targetYaw=clamp(targetYaw+(button.dataset.starRotate==='left'?-.16:.16),-.48,.48);request();}));
  pauseButton.addEventListener('click',()=>{paused=!paused;syncPause();request();});
  figure.querySelector('[data-star-reset]').addEventListener('click',()=>{targetYaw=.08;targetPitch=-.08;phase=0;request();});
  if(totalPages>1) {
    const next=document.createElement('button');next.type='button';next.textContent=`更多作品 1/${totalPages}`;
    next.addEventListener('click',()=>{page=(page+1)%totalPages;next.textContent=`更多作品 ${page+1}/${totalPages}`;layout();});controls.append(next);
  }
  reduced.addEventListener('change',()=>{syncPause();request();});
  new MutationObserver(request).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(stage);else addEventListener('resize',resize);
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)request();else{cancelAnimationFrame(frame);frame=0;}},{threshold:0}).observe(stage);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else request();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fallback();});
  canvas.addEventListener('webglcontextrestored',init);
  addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;});
  addEventListener('pageshow',request);
  syncPause();init();
})();
