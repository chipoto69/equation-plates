// RelicForge · Metanomicon Plate · EPOCH 0000 · Tessera
// MIT License. (c) 2026 Metanomicon / RelicForge. Every formula here is MIT.
// Parent technique: Clifford attractor (Pickover) rendered as point density, folded through
//   the abs-fold kaleidoscope of #つぶやきGLSL (Yohei Nishitsuji, abs(p+p)-2.), mutated to abs(p+p)-1.
// Delta 0000: one extra fold over the plain abs-fold parent (folds 1 -> 2).
// Seed: sha256("0000"+"METANOMICON") = d730583960d2c32d736ece7c02351e32f1c66e0fd7d72b43bb7eeb42cbca3c62
//   seed d73058 · uSeed = 0xd73058/2^24 = 0.8406
//   uPlate a,b,c,d = render.py seed_floats("0000METANOMICON") (its sha256 bytes above) = -2.113, 1.281, 1.412, -0.616
// Host (twigl geekest): FC r t o hsv rotate2D rotate3D · page: uEpoch uSeed uPlate uPatina uPointer
// Prior-epoch register: empty at 0000. Patina starts empty, rgb mixed at .96, never wiped.
// Ink ledger (alpha): running density of the folded orbit (.999), sub-pixel jittered, tanh tonemap. Density is ink.
#define SG(a,b) length(g-(a)-((b)-(a))*clamp(dot(g-(a),(b)-(a))/dot((b)-(a),(b)-(a)),0.,1.))
vec4 P=texture(uPatina,FC.xy/r);
float px=2./min(r.x,r.y),n=floor(t*60.+.5),D=0.,e=9.,k;
vec2 j=fract(sin(vec2(n*.7548+uSeed,n*.5698-uSeed))*43758.5453)-.5; // supersample: jitter the sheet each frame
vec2 p=((FC.xy+j)*2.-r)/min(r.x,r.y),q,u,v,S=.75/(1.+abs(uPlate.zw));
float s2=2.2+9.*exp(-n/240.);
p*=rotate2D(.035*exp(-5.*dot(p-uPointer,p-uPointer))); // thumb on vellum: local phase shear only
for(int m=0;m<2;m++){
  v=fract(sin(vec2(n*12.9898+float(m)*4.1414+uSeed*78.233,n*39.346+float(m)*7.31+uSeed*11.135))*43758.5453)*2.-1.;
  for(int i=0;i<120;i++){
    v=vec2(sin(uPlate.x*v.y)+uPlate.z*cos(uPlate.x*v.x),sin(uPlate.y*v.x)+uPlate.w*cos(uPlate.y*v.y)); // x'=sin(ay)+c cos(ax), y'=sin(bx)+d cos(by)
    if(i<10)continue;                    // burn-in
    q=v*S;                               // Clifford drives the domain
    for(int f=0;f<2;f++)q=abs(q+q)-1.;   // then the fold: parent abs-fold + 1 (delta 0000)
    u=p-q*.9;k=dot(u,u);e=min(e,k);
    D+=exp(-k/(px*px*s2))*2.2/s2;       // progressive kernel: soft while the ledger is young, 1px-fine once settled
  }
}
float L=mix(D,P.a,.999),W=r.x*r.y*.000658/(1.-pow(.999,n+1.)),I=tanh(L*W*.16);
vec3 g0=vec3(.047,.043,.035),ink=vec3(.914,.898,.863),gilt=vec3(.784,.635,.294),c=mix(g0,ink,I);
c+=ink*.1*exp(-sqrt(e)/px*.45);         // glow from exp(-e*k) on the fold edge
// glyph atlas: .y [[. ]] ⌘ ☉ ᚠ ᛟ and the equation's marks (x ′ = + ( ) a b c d s i n o), SDF strokes, low opacity, only where the fold is thin
float cl=floor(min(r.x,r.y)/34.),sg=9.;
vec2 ci=floor(FC.xy/cl),cc=(ci+.5)*cl,g=(FC.xy-cc)/cl;
float Lc=tanh(texture(uPatina,cc/r).a*W*.16),h=fract(sin(dot(ci,vec2(12.9898,78.233))+uSeed*91.7)*43758.5453);
float gate=smoothstep(.04,.08,Lc)*(1.-smoothstep(.22,.30,Lc))*(1.-smoothstep(.36,.42,h));
int gid=Lc<.12?0:1+int(h*997.)%19;     // `.y` holds the thinnest band
if(gid==0){sg=min(sg,length(g-vec2(-.26,-.3))-.045);sg=min(sg,SG(vec2(-.02,.22),vec2(.1,-.04)));sg=min(sg,SG(vec2(.24,.22),vec2(-.06,-.4)));} // .y
else if(gid==1){sg=min(sg,SG(vec2(-.46,.24),vec2(-.46,-.24)));sg=min(sg,SG(vec2(-.46,.24),vec2(-.4,.24)));sg=min(sg,SG(vec2(-.46,-.24),vec2(-.4,-.24)));sg=min(sg,SG(vec2(-.34,.24),vec2(-.34,-.24)));sg=min(sg,SG(vec2(-.34,.24),vec2(-.28,.24)));sg=min(sg,SG(vec2(-.34,-.24),vec2(-.28,-.24)));sg=min(sg,length(g-vec2(-.16,-.2))-.04);sg=min(sg,SG(vec2(.46,.24),vec2(.46,-.24)));sg=min(sg,SG(vec2(.46,.24),vec2(.4,.24)));sg=min(sg,SG(vec2(.46,-.24),vec2(.4,-.24)));sg=min(sg,SG(vec2(.34,.24),vec2(.34,-.24)));sg=min(sg,SG(vec2(.34,.24),vec2(.28,.24)));sg=min(sg,SG(vec2(.34,-.24),vec2(.28,-.24)));} // [[. ]]
else if(gid==2){sg=min(sg,abs(length(g-vec2(-.2,.2))-.1));sg=min(sg,abs(length(g-vec2(.2,.2))-.1));sg=min(sg,abs(length(g-vec2(-.2,-.2))-.1));sg=min(sg,abs(length(g-vec2(.2,-.2))-.1));sg=min(sg,SG(vec2(-.2,.1),vec2(.2,.1)));sg=min(sg,SG(vec2(-.2,-.1),vec2(.2,-.1)));sg=min(sg,SG(vec2(.1,-.2),vec2(.1,.2)));sg=min(sg,SG(vec2(-.1,-.2),vec2(-.1,.2)));} // ⌘
else if(gid==3){sg=min(sg,abs(length(g-vec2(0.,0.))-.3));sg=min(sg,length(g-vec2(0.,0.))-.05);} // ☉
else if(gid==4){sg=min(sg,SG(vec2(-.14,-.42),vec2(-.14,.42)));sg=min(sg,SG(vec2(-.14,.16),vec2(.2,.4)));sg=min(sg,SG(vec2(-.14,-.08),vec2(.2,.16)));} // ᚠ
else if(gid==5){sg=min(sg,SG(vec2(0.,.42),vec2(.2,.2)));sg=min(sg,SG(vec2(0.,.42),vec2(-.2,.2)));sg=min(sg,SG(vec2(-.2,.2),vec2(.24,-.42)));sg=min(sg,SG(vec2(.2,.2),vec2(-.24,-.42)));} // ᛟ
else if(gid==6){sg=min(sg,SG(vec2(-.18,.1),vec2(.18,-.26)));sg=min(sg,SG(vec2(-.18,-.26),vec2(.18,.1)));} // x
else if(gid==7){sg=min(sg,SG(vec2(.02,.34),vec2(-.06,.12)));} // ′
else if(gid==8){sg=min(sg,SG(vec2(-.24,.08),vec2(.24,.08)));sg=min(sg,SG(vec2(-.24,-.1),vec2(.24,-.1)));} // =
else if(gid==9){sg=min(sg,SG(vec2(-.22,-.08),vec2(.22,-.08)));sg=min(sg,SG(vec2(0.,.14),vec2(0.,-.3)));} // +
else if(gid==10){sg=min(sg,max(abs(length(g-vec2(.04,-.08))-.18),dot(g-vec2(.04,-.08),vec2(1,0.))-(.06)));} // c
else if(gid==11){sg=min(sg,max(abs(length(g-vec2(.32,0.))-.42),dot(g-vec2(.32,0.),vec2(1,0.))-(-.24)));} // (
else if(gid==12){sg=min(sg,max(abs(length(g-vec2(-.32,0.))-.42),dot(g-vec2(-.32,0.),vec2(-1,0.))-(-.24)));} // )
else if(gid==13){sg=min(sg,abs(length(g-vec2(0.,-.1))-.16));sg=min(sg,SG(vec2(.16,.06),vec2(.16,-.26)));} // a
else if(gid==14){sg=min(sg,SG(vec2(-.16,.38),vec2(-.16,-.26)));sg=min(sg,abs(length(g-vec2(0.,-.1))-.16));} // b
else if(gid==15){sg=min(sg,abs(length(g-vec2(0.,-.1))-.16));sg=min(sg,SG(vec2(.16,.38),vec2(.16,-.26)));} // d
else if(gid==16){sg=min(sg,max(abs(length(g-vec2(0.,.02))-.12),dot(g-vec2(0.,.02),vec2(1,0.))-(.03)));sg=min(sg,max(abs(length(g-vec2(0.,-.2))-.12),dot(g-vec2(0.,-.2),vec2(-1,0.))-(.03)));} // s
else if(gid==17){sg=min(sg,SG(vec2(0.,.1),vec2(0.,-.3)));sg=min(sg,length(g-vec2(0.,.26))-.035);} // i
else if(gid==18){sg=min(sg,SG(vec2(-.14,.1),vec2(-.14,-.3)));sg=min(sg,max(abs(length(g-vec2(0.,-.04))-.14),dot(g-vec2(0.,-.04),vec2(0.,-1))-(0.)));sg=min(sg,SG(vec2(.14,-.04),vec2(.14,-.3)));} // n
else if(gid==19){sg=min(sg,abs(length(g-vec2(0.,-.1))-.17));} // o
c=mix(c,ink,.11*gate*smoothstep(.04,.08,I)*(1.-smoothstep(.2,.32,I))*(1.-smoothstep(.03-.8/cl,.03+.8/cl,sg))); // per-fragment thin band: never on empty ground, never over thick ink
// prior-epoch register (2px off, 12%): empty while uEpoch==0
vec2 bq=abs(FC.xy-r*.5)-(r*.5-min(r.x,r.y)*.03);
float rd=abs(max(bq.x,bq.y)+1.2*sin(t*.5+uSeed*6.283)),hw=max(.5,min(r.x,r.y)/1800.);
c+=gilt*(.6*clamp(hw+.5-rd,0.,1.)+.05*exp(-rd*.35)); // rim: gilt hairline, inset ~12px, breathing with the fold clock
if(t<.134){float dl=dot(p,vec2(cos(uSeed*6.283),sin(uSeed*6.283)))/px;
  c+=vec3(.78,.9,.55)*.5*exp(-vec3((dl-.6)*(dl-.6),dl*dl,(dl+.6)*(dl+.6)));} // epoch-boundary filament, 8 frames
P.rgb=mix(P.rgb,vec3(dot(P.rgb,vec3(.333))),.004);
o=vec4(mix(c,P.rgb,.96),L);
