// RelicForge · Metanomicon Plate · EPOCH 0000 · Tessera
// MIT License. (c) 2026 Metanomicon / RelicForge. Every formula here is MIT.
// Parent technique: Clifford attractor (Pickover) rendered as point density, folded through
//   the abs-fold kaleidoscope of #つぶやきGLSL (Yohei Nishitsuji, abs(p+p)-2.), mutated to abs(p+p)-1.
// Delta 0000: one extra fold over the plain abs-fold parent (folds 1 -> 2).
// Seed: sha256("0000"+"METANOMICON") = d730583960d2c32d736ece7c02351e32f1c66e0fd7d72b43bb7eeb42cbca3c62
//   seed d73058 · uSeed = 0xd73058/2^24 = 0.8406
//   uPlate a,b,c,d via render.py seed_floats(digest) = -2.113, 1.281, 1.412, -0.616
// Host (twigl geekest): FC r t o hsv rotate2D rotate3D · page: uEpoch uSeed uPlate uPatina uPointer
// Prior-epoch register: empty at 0000. Patina starts empty, rgb mixed at .96, never wiped.
// Ink ledger (alpha): running density of the folded orbit (.997), tanh tonemap. Density is ink.
vec4 P=texture(uPatina,FC.xy/r);
vec2 p=(FC.xy*2.-r)/min(r.x,r.y),q,u,v,S=1./(1.+abs(uPlate.zw));
float px=2./min(r.x,r.y),n=floor(t*60.+.5),D=0.,e=9.,k;
p*=rotate2D(.035*exp(-5.*dot(p-uPointer,p-uPointer))); // thumb on vellum: local phase shear only
v=fract(sin(vec2(n*12.9898+uSeed*78.233,n*39.346+uSeed*11.135))*43758.5453)*2.-1.;
for(int i=0;i<176;i++){
  v=vec2(sin(uPlate.x*v.y)+uPlate.z*cos(uPlate.x*v.x),sin(uPlate.y*v.x)+uPlate.w*cos(uPlate.y*v.y)); // x'=sin(ay)+c cos(ax), y'=sin(bx)+d cos(by)
  if(i<16)continue;                    // burn-in
  q=v*S*.75;                           // Clifford drives the domain
  for(int j=0;j<2;j++)q=abs(q+q)-1.;   // then the fold: parent abs-fold + 1 (delta 0000)
  u=p-q*.9;k=dot(u,u);e=min(e,k);
  D+=exp(-k/(px*px*3.5));
}
float L=mix(D,P.a,.997),W=r.x*r.y*.00057/(1.-pow(.997,n+1.)),I=tanh(L*W*.16),th=sqrt(e)/px;
vec3 g0=vec3(.047,.043,.035),ink=vec3(.914,.898,.863),gilt=vec3(.784,.635,.294),c=mix(g0,ink,I);
c+=ink*.18*exp(-th*.45);                // glow from exp(-e*k) on the fold edge
vec2 cc=(floor(FC.xy/22.)+.5)*22.,g=(FC.xy-cc)/22.;
float Lc=tanh(texture(uPatina,cc/r).a*W*.16);
float gate=exp(-pow((Lc-.16)/.07,2.))*smoothstep(0.,.05,Lc); // `.y` only where the distance field is thinnest
vec2 a1=g-vec2(-.02,.22),b1=vec2(.12,-.26),a2=g-vec2(.24,.22),b2=vec2(-.3,-.62);
float sy=min(length(a1-b1*clamp(dot(a1,b1)/dot(b1,b1),0.,1.)),length(a2-b2*clamp(dot(a2,b2)/dot(b2,b2),0.,1.)));
sy=min(sy,length(g-vec2(-.26,-.3))-.03);
c=mix(c,ink,.15*gate*exp(-pow(max(sy-.035,0.)*18.,2.)));
// prior-epoch register (2px off, 12%): empty while uEpoch==0
vec2 bq=abs(FC.xy-r*.5)-(r*.5-min(r.x,r.y)*.03+1.2*sin(t*.5+L*3.));
c+=gilt*.42*exp(-abs(max(bq.x,bq.y))*.9); // rim: distance-field gilt hairline, inset ~12px, breathing
if(t<.134){float dl=dot(p,vec2(cos(uSeed*6.283),sin(uSeed*6.283)))/px;
  c+=vec3(.78,.9,.55)*.5*exp(-vec3((dl-.6)*(dl-.6),dl*dl,(dl+.6)*(dl+.6)));} // epoch-boundary filament, 8 frames
P.rgb=mix(P.rgb,vec3(dot(P.rgb,vec3(.333))),.02);
o=vec4(mix(c,P.rgb,.96),L);
