/* Эффекты второй версии («игра в Грузии»): подсказки на экране загрузки, бегущая строка, наклон карточек,
   параллакс первого экрана, фонарь за курсором, плашка с названием раздела, кнопка «радио». */
(function(){
  'use strict';
  var d=document,calm=matchMedia('(prefers-reduced-motion:reduce)').matches,fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  var lang=d.documentElement.lang||'ru';

  // подсказка на экране загрузки
  var tip=d.querySelector('.gload [data-tips]');
  if(tip){var t=tip.getAttribute('data-tips').split('|');tip.textContent=t[Math.floor(Math.random()*t.length)]}

  // бегущая строка под первым экраном
  var hero=d.querySelector('.hero');
  if(hero){
    var W={ru:['Тбилиси','Батуми','Казбеги','Сванетия','Кахетия','Тушетия','Вардзия','Мартвили','Ушгули','Чёрное море'],
           en:['Tbilisi','Batumi','Kazbegi','Svaneti','Kakheti','Tusheti','Vardzia','Martvili','Ushguli','Black Sea'],
           ar:['تبليسي','باتومي','كازبيغي','سفانيتي','كاخيتي','توشيتي','فاردزيا','مارتفيلي','أوشغولي','البحر الأسود']}[lang]||[];
    var tick=d.createElement('div');tick.className='g-tick';tick.setAttribute('aria-hidden','true');
    var row=W.map(function(w){return '<span>'+w+'</span>'}).join('');
    tick.innerHTML='<div>'+row+row+row+row+'</div>';
    hero.parentNode.insertBefore(tick,hero.nextSibling);
  }

  // параллакс постера от мыши
  var poster=d.querySelector('.hero__poster');
  if(poster&&fine&&!calm){
    var wrap=d.querySelector('.hero .wrap');
    hero.addEventListener('pointermove',function(e){var r=hero.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      poster.style.translate=(-x*26)+'px '+(-y*18)+'px';if(wrap)wrap.style.translate=(x*10)+'px '+(y*6)+'px'});
    hero.addEventListener('pointerleave',function(){poster.style.translate='';if(wrap)wrap.style.translate=''});
    poster.style.transition='translate .5s cubic-bezier(.2,.8,.2,1)';if(wrap)wrap.style.transition='translate .5s cubic-bezier(.2,.8,.2,1)';
  }

  // наклон карточек за курсором
  if(fine&&!calm){
    [].forEach.call(d.querySelectorAll('.fmt__item,.el__stage'),function(c){
      var k=c.classList.contains('el__stage')?3:8;
      c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
        c.style.transform='perspective(900px) rotateY('+(x*k)+'deg) rotateX('+(-y*k)+'deg) translateZ(0)'});
      c.addEventListener('pointerleave',function(){c.style.transform=''});
    });
    // фонарь за курсором
    var glow=d.createElement('div');glow.className='g-glow';glow.setAttribute('aria-hidden','true');d.body.appendChild(glow);
    var gx=0,gy=0,tx=0,ty=0,run=false;
    function step(){gx+=(tx-gx)*.14;gy+=(ty-gy)*.14;glow.style.transform='translate3d('+gx+'px,'+gy+'px,0)';
      if(Math.abs(tx-gx)+Math.abs(ty-gy)>.5)requestAnimationFrame(step);else run=false}
    addEventListener('pointermove',function(e){tx=e.clientX;ty=e.clientY;if(!run){run=true;requestAnimationFrame(step)}},{passive:true});
  }

  // плашка «локация»: название раздела при входе на экран
  var names={};[].forEach.call(d.querySelectorAll('.trail a'),function(a){var s=a.querySelector('span');if(s)names[a.getAttribute('href').slice(1)]=s.textContent});
  var secs=[].slice.call(d.querySelectorAll('main > section[id]')).filter(function(s){return names[s.id]});
  if(secs.length&&'IntersectionObserver' in window){
    var hud=d.createElement('div');hud.className='g-hud';hud.setAttribute('aria-hidden','true');
    hud.innerHTML='<i></i><span>'+({ru:'Локация',en:'Location',ar:'الموقع'}[lang]||'')+'</span><b></b>';d.body.appendChild(hud);
    var hb=hud.querySelector('b'),timer,last='';
    var io=new IntersectionObserver(function(es){es.forEach(function(en){
      if(!en.isIntersecting||en.target.id===last)return;last=en.target.id;if(last==='start'){hud.classList.remove('is-on');return}
      hb.textContent=names[last];hud.classList.add('is-on');clearTimeout(timer);timer=setTimeout(function(){hud.classList.remove('is-on')},2200)})},{threshold:.55});
    secs.forEach(function(s){io.observe(s)});
  }

  // кнопка «радио» на первом экране включает ту же музыку, что и эквалайзер
  var radio=d.querySelector('[data-g-radio]'),eq=d.querySelector('.eq[data-music]');
  if(radio){
    if(!eq){radio.hidden=true}
    else{
      radio.addEventListener('click',function(){eq.click()});
      var sync=function(){radio.classList.toggle('is-on',eq.getAttribute('aria-pressed')==='true')};
      new MutationObserver(sync).observe(eq,{attributes:true,attributeFilter:['aria-pressed']});sync();
    }
  }
})();

/* --- погружение: искры, прогресс, «достижения», звуки интерфейса --- */
(function(){
  'use strict';
  var d=document,calm=matchMedia('(prefers-reduced-motion:reduce)').matches,lang=d.documentElement.lang||'ru';
  var TX={ru:{open:'Стихия открыта',all:'Пятый элемент открыт',allS:'Четыре стихии собраны. Осталось приехать.',earth:'Земля',air:'Воздух',water:'Вода',fire:'Огонь'},
          en:{open:'Element unlocked',all:'Fifth element unlocked',allS:'All four elements collected. Now just arrive.',earth:'Earth',air:'Air',water:'Water',fire:'Fire'},
          ar:{open:'تم فتح العنصر',all:'تم فتح العنصر الخامس',allS:'اكتملت العناصر الأربعة. بقي أن تصل.',earth:'الأرض',air:'الهواء',water:'الماء',fire:'النار'}}[lang];
  if(!TX)return;

  // искры над первым экраном
  var hero=d.querySelector('.hero');
  if(hero&&!calm){var sp=d.createElement('div');sp.className='g-sparks';sp.setAttribute('aria-hidden','true');var h='';
    for(var i=0;i<26;i++)h+='<i style="left:'+(Math.random()*100).toFixed(1)+'%;--dx:'+((Math.random()-.5)*160).toFixed(0)+'px;animation-duration:'+(7+Math.random()*9).toFixed(1)+'s;animation-delay:-'+(Math.random()*14).toFixed(1)+'s"></i>';
    sp.innerHTML=h;hero.appendChild(sp)}

  // полоса прогресса исследования страницы
  var pr=d.createElement('div');pr.className='g-prog';pr.setAttribute('aria-hidden','true');pr.innerHTML='<i></i>';d.body.appendChild(pr);
  var bar=pr.firstChild,tick=false;
  function prog(){tick=false;var m=d.documentElement.scrollHeight-innerHeight;bar.style.transform='scaleX('+(m>0?Math.min(1,scrollY/m):0)+')'}
  addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(prog)}},{passive:true});prog();

  // звуки интерфейса — только когда включено «радио»
  var ac=null,eq=d.querySelector('.eq[data-music]');
  function blip(f,t){if(!eq||eq.getAttribute('aria-pressed')!=='true')return;
    try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();var o=ac.createOscillator(),g=ac.createGain();o.type='square';o.frequency.setValueAtTime(f,ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(f*1.6,ac.currentTime+(t||.08));g.gain.setValueAtTime(.05,ac.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+(t||.08)+.05);
      o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+(t||.08)+.06)}catch(e){}}
  d.addEventListener('click',function(e){if(e.target.closest('.btn,.el__tab,.fmt__item,[data-el-act],.dirchips button'))blip(520)},true);

  // «достижение открыто» в блоке пяти элементов
  var box=d.querySelector('[data-el]');if(!box)return;
  var GL={earth:'<path d="M24 41 42 9H6Z"/><path d="M11 20h26"/>',air:'<path d="M24 7 42 39H6Z"/><path d="M11 28h26"/>',water:'<path d="M24 41 42 9H6Z"/>',fire:'<path d="M24 7 42 39H6Z"/>'};
  var COL={earth:'#ffb23e',air:'#6fc3ff',water:'#2fe6d0',fire:'#ff5a3c'};
  var toast=d.createElement('div');toast.className='g-toast';toast.setAttribute('role','status');d.body.appendChild(toast);
  var pass=d.createElement('div');pass.className='g-pass';pass.setAttribute('aria-hidden','true');pass.innerHTML='<b>'+TX.all+'</b><span>'+TX.allS+'</span>';d.body.appendChild(pass);
  var tt,pt,lit={},was=false,first=true;
  function state(){var s={};[].forEach.call(box.querySelectorAll('[data-el-act]:checked'),function(c){s[c.getAttribute('data-el-act')]=1});return s}
  function check(){var s=state(),n=Object.keys(s).length;
    if(!first){Object.keys(s).forEach(function(k){if(!lit[k]){toast.style.setProperty('--c',COL[k]);toast.innerHTML='<svg viewBox="0 0 48 48">'+GL[k]+'</svg><small>'+TX.open+' · '+n+'/4</small><b>'+TX[k]+'</b>';
        toast.classList.add('is-on');clearTimeout(tt);tt=setTimeout(function(){toast.classList.remove('is-on')},2400);blip(660,.12)}});
      if(n===4&&!was){setTimeout(function(){pass.classList.add('is-on');blip(880,.3);clearTimeout(pt);pt=setTimeout(function(){pass.classList.remove('is-on')},2600)},700)}}
    lit=s;was=n===4;first=false}
  box.addEventListener('change',check);check();
})();
