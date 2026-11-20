/* Knight Lights — win moment (Artist, Nov 20 2026). No dependencies. Works on any board whose squares are the
   board element's children in reading order and whose clue squares have class "clue".
   API:
     KLWin.play(boardEl, {origin:"r,c", title, sub, nextLabel, onNext, after:Element})  -> starts the sequence once
     KLWin.settle(boardEl, opts)  -> same final look without motion (call on re-render after play)
     KLWin.reset()                -> remove banner + classes (call when a level starts)
   Storyboards/tests: set window.KL_WIN_FREEZE = <ms> before play() to freeze the whole sequence at that time. */
(function(){
 var RIPPLE=1000, STEP_MAX=260, GLOW_AFTER=300, BANNER_AFTER=250; // ripple always ~1 s across the board, whatever its size
 var BANNER_DUR=420; // must match klBanner in win.css
 // Next arms on the banner animationend (full opacity), not on a fixed timer; armAt() is only the KL_WIN_FREEZE storyboard threshold.
 var BANNER_80=Math.round(BANNER_DUR*0.245), RM_ARM=200, armTimer=null, armed=false;
 function rm(){return window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;}
 function armAt(bd){return rm()?RM_ARM:(bd+BANNER_80);}
 function clearArm(){if(armTimer){clearTimeout(armTimer);armTimer=null;}}
 function setArmed(el,on){armed=!!on;if(!el)return;el.classList.toggle("kl-armed",armed);var btn=el.querySelector("button");if(!btn)return;
  btn.disabled=!armed;if(armed)btn.removeAttribute("aria-disabled");else btn.setAttribute("aria-disabled","true");btn.setAttribute("data-armed",armed?"1":"0");}
 function scheduleArm(el,bd,immediate){clearArm();var t=immediate?0:armAt(bd);
  if(window.KL_WIN_FREEZE!=null){setArmed(el,window.KL_WIN_FREEZE>=t);return;}
  if(t<=0){setArmed(el,true);return;}
  // Deterministic arming: Next arms only once the banner has fully faded in (animationend of klBanner/klFade).
  // Fallback for engines that skip animation events: after the nominal end, arm as soon as computed opacity reaches 1.
  setArmed(el,false);var done=false;function arm(){if(done||!el.isConnected)return;done=true;clearArm();setArmed(el,true);}
  el.addEventListener("animationend",function(e){if(e.target===el&&(e.animationName==="klBanner"||e.animationName==="klFade"))arm();});
  function poll(){armTimer=null;if(done||!el.isConnected)return;if(parseFloat(getComputedStyle(el).opacity)>=0.999)arm();else armTimer=setTimeout(poll,50);}
  armTimer=setTimeout(poll,(rm()?RM_ARM:bd+BANNER_DUR)+150);}
 function lantern(){return '<svg class="kl-b-ico" viewBox="0 0 30 40" aria-hidden="true"><circle cx="15" cy="4" r="3" fill="none" stroke="#C9934A" stroke-width="2"/><path d="M5 12 Q15 5 25 12 Z" fill="#C9934A" stroke="#2A1407" stroke-width="1.4"/><rect x="6" y="12" width="18" height="20" rx="1.5" fill="#FFD98A" stroke="#2A1407" stroke-width="1.4"/><path d="M15 15 C19 20 19 24 15 28 C11 24 11 20 15 15Z" fill="#fff" stroke="#E07A1E" stroke-width="1"/><path d="M10.5 12V32M19.5 12V32" stroke="#C9934A" stroke-width="1.6"/><path d="M5 32H25L22 37H8Z" fill="#C9934A" stroke="#2A1407" stroke-width="1.4"/></svg>';}
 function cells(b){var c=[].slice.call(b.children),n=Math.round(Math.sqrt(c.length));return{c:c,n:n};}
 function apply(b,o){
  var g=cells(b),n=g.n,or=(n-1)/2,oc=(n-1)/2;
  if(o.origin){var p=String(o.origin).split(",").map(Number);if(p.length===2&&!isNaN(p[0])){or=p[0];oc=p[1];}}
  var maxd=0,i,d;for(i=0;i<g.c.length;i++){d=Math.hypot(Math.floor(i/n)-or,i%n-oc);if(d>maxd)maxd=d;}
  var step=rm()?0:Math.min(STEP_MAX,maxd?RIPPLE/maxd:0),ripple=maxd*step;
  for(i=0;i<g.c.length;i++){var e=g.c[i];d=Math.hypot(Math.floor(i/n)-or,i%n-oc);
   e.style.setProperty("--kl-wd",Math.round(d*step)+"ms");e.classList.add(e.classList.contains("clue")?"kl-wl":"kl-ws");}
  var gd=Math.round(ripple+GLOW_AFTER);b.style.setProperty("--kl-gd",gd+"ms");b.classList.add("kl-win");
  return{gd:gd,bd:gd+BANNER_AFTER};}
 function banner(b,o,bd){
  var old=document.getElementById("klWinBanner");if(old)old.remove();
  var el=document.createElement("div");el.id="klWinBanner";el.className="kl-banner";el.setAttribute("role","status");
  el.style.setProperty("--kl-bd",bd+"ms");
  el.innerHTML=lantern()+'<div class="kl-b-txt"><div class="kl-b-h"></div><div class="kl-b-s"></div></div><button class="primary" type="button"></button>';
  el.querySelector(".kl-b-h").textContent=o.title||"All lanterns lit!";
  el.querySelector(".kl-b-s").textContent=o.sub||"";
  var btn=el.querySelector("button");btn.textContent=o.nextLabel||"Next";
  btn.onclick=function(){if(armed&&o.onNext)o.onNext();};
  var after=o.after||b;after.insertAdjacentElement("afterend",el);document.body.classList.add("kl-won");return el;}
 function freeze(){if(window.KL_WIN_FREEZE!=null){var r=document.documentElement.style;r.setProperty("--kl-t",window.KL_WIN_FREEZE+"ms");r.setProperty("--kl-play","paused");}}
 window.KLWin={
  play:function(b,o){o=o||{};freeze();var t=apply(b,o);var el=banner(b,o,t.bd);scheduleArm(el,t.bd,false);return t;},
  settle:function(b,o){o=o||{};apply(b,o);b.classList.add("kl-settled");
   if(!document.getElementById("klWinBanner"))banner(b,o,0);var el=document.getElementById("klWinBanner");el.style.animation="none";scheduleArm(el,0,true);},
  reset:function(){clearArm();setArmed(null,false);var e=document.getElementById("klWinBanner");if(e)e.remove();document.body.classList.remove("kl-won");}
 };
})();
