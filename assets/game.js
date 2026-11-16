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
  function blip(f,t){if(!window.gtSound)return;
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


/* --- GEORGIA STORIES: побуквенный заголовок, плеер, заставка, «миссия выбрана», «экспедиция собрана» --- */
(function(){
  'use strict';
  var d=document,lang=d.documentElement.lang||'ru',calm=matchMedia('(prefers-reduced-motion:reduce)').matches;
  var me=d.querySelector('script[src*="game.js"]'),base=me?me.src.replace(/game\.js.*$/,''):'assets/';
  var L=function(o){return o[lang]||o.ru};
  var ls={get:function(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

  // заголовок первого экрана по буквам (арабский не делим — буквы там соединяются)
  var h=d.querySelector('[data-g-split]');
  if(h&&lang!=='ar'){var i=0;[].forEach.call(h.querySelectorAll('.ln>span'),function(sp){var t=sp.textContent;sp.setAttribute('aria-label',t);
    sp.innerHTML=t.split(' ').map(function(w){return '<span style="white-space:nowrap">'+w.split('').map(function(c){return '<span class="ch" aria-hidden="true" style="--i:'+(i++)+'">'+c+'</span>'}).join('')+'</span>'}).join('<span class="sp"> </span>')})}

  // плеер: три своих трека, громкость, память между страницами
  var TR=[['drive','Batumi Drive'],['night','Tbilisi Night'],['run','Caucasus Run']];
  var st=ls.get('gt_g_music')||{on:false,vol:.55,tr:0,t:0};
  var au=new Audio();au.preload='none';au.volume=st.vol;
  var pl=d.createElement('div');pl.className='g-player';
  pl.innerHTML='<button type="button" data-a="toggle" aria-pressed="false" aria-label="'+L({ru:'Музыка',en:'Music',ar:'الموسيقى'})+'"><span class="g-player__bars"><i></i><i></i><i></i><i></i></span></button>'+
    '<div class="g-player__t"><small>'+L({ru:'Радио GeoTrip',en:'GeoTrip Radio',ar:'راديو GeoTrip'})+'</small><b></b></div>'+
    '<button type="button" data-a="next" aria-label="'+L({ru:'Следующий трек',en:'Next track',ar:'المقطع التالي'})+'"><svg viewBox="0 0 24 24"><path d="M5 4l10 8-10 8zM17 4h3v16h-3z"/></svg></button>'+
    '<input type="range" min="0" max="1" step="0.05" value="'+st.vol+'" aria-label="'+L({ru:'Громкость',en:'Volume',ar:'مستوى الصوت'})+'">';
  d.body.appendChild(pl);
  var nameEl=pl.querySelector('b'),tog=pl.querySelector('[data-a=toggle]');
  function load(keepTime){var t=TR[st.tr%TR.length];au.src=base+'audio/'+t[0]+'.mp3';nameEl.textContent=t[1];if(keepTime&&st.t)au.addEventListener('loadedmetadata',function f(){au.removeEventListener('loadedmetadata',f);try{au.currentTime=st.t}catch(e){}})}
  function ui(){pl.classList.toggle('is-on',st.on);tog.setAttribute('aria-pressed',st.on);window.gtSound=st.on}
  function save(){st.t=au.currentTime||0;ls.set('gt_g_music',st)}
  function play(){st.on=true;ui();var p=au.play();if(p&&p.catch)p.catch(function(){var once=function(){d.removeEventListener('pointerdown',once);if(st.on)au.play().catch(function(){})};d.addEventListener('pointerdown',once)});save()}
  function stop(){st.on=false;au.pause();ui();save()}
  window.gtMusic={play:play,stop:stop};
  load(true);ui();if(st.on)play();
  au.addEventListener('ended',function(){st.tr=(st.tr+1)%TR.length;st.t=0;load();play()});
  pl.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
    if(b.dataset.a==='toggle'){if(innerWidth<=760&&!pl.classList.contains('open')&&st.on){pl.classList.add('open');return}st.on?stop():play();pl.classList.toggle('open',st.on&&innerWidth<=760)}
    else{st.tr=(st.tr+1)%TR.length;st.t=0;load();play()}});
  pl.querySelector('input').addEventListener('input',function(){st.vol=+this.value;au.volume=st.vol;save()});
  addEventListener('pagehide',save);

  // общий экран-баннер
  var pass=d.createElement('div');pass.className='g-pass';pass.setAttribute('aria-hidden','true');d.body.appendChild(pass);
  function banner(small,title,sub,solid,ms,cb){pass.className='g-pass'+(solid?' solid':'');pass.innerHTML='<small>'+small+'</small><b>'+title+'</b>'+(sub?'<span>'+sub+'</span>':'');
    void pass.offsetWidth;pass.classList.add('is-on');setTimeout(function(){if(cb)cb();else pass.classList.remove('is-on')},ms)}

  // «миссия выбрана» перед переходом к программе
  d.addEventListener('click',function(e){var a=e.target.closest('.atlas--first .atlas__list a');
    if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.button)return;
    var name=(a.querySelector('span')||a).textContent,days=a.querySelector('b'),href=a.href;e.preventDefault();
    banner(L({ru:'Миссия выбрана',en:'Mission selected',ar:'تم اختيار المهمة'}),name,days?days.textContent+' '+L({ru:'дней в Грузии',en:'days in Georgia',ar:'أيام في جورجيا'}):'',true,calm?300:1150,function(){location.href=href})});
  addEventListener('pageshow',function(e){if(e.persisted)pass.classList.remove('is-on')});

  // «экспедиция собрана» на последнем шаге опросника
  var form=d.querySelector('form.calc');
  if(form){var shown=false;new MutationObserver(function(){if(!shown&&form.classList.contains('wiz-last')){shown=true;
      banner('Mission ready',L({ru:'Твоя экспедиция собрана',en:'Your expedition is ready',ar:'رحلتك جاهزة'}),L({ru:'Проверь итог и отправь заявку',en:'Check the summary and send your request',ar:'راجع الملخص وأرسل طلبك'}),false,2200)}})
    .observe(form,{attributes:true,attributeFilter:['class']})}

  // заставка — только на главной и не чаще раза в 12 часов
  var hero=d.querySelector('.hero');
  if(hero&&!location.hash){var seen=ls.get('gt_g_intro')||0;
    if(Date.now()-seen>12*3600e3){
      var IM=['gm-fire','gm-earth','gm-air','gm-water','gm-hero'],logo=d.querySelector('.preload svg');
      var x=d.createElement('div');x.className='g-intro';x.style.setProperty('--n',IM.length);x.setAttribute('role','dialog');x.setAttribute('aria-label','GeoTrip');
      x.innerHTML=IM.map(function(n,i){return '<div class="g-intro__sc'+(i===IM.length-1?' last':'')+'" style="--i:'+i+'"><img src="'+base+'img/'+n+'.webp" alt=""></div>'}).join('')+
        '<div class="g-intro__logo">'+(logo?logo.outerHTML:'')+'</div>'+
        '<div class="g-intro__end"><small>GeoTrip · Georgia Stories</small><b>'+L({ru:'Грузия — твоя история начинается здесь',en:'Georgia — your story starts here',ar:'جورجيا — قصتك تبدأ هنا'})+'</b>'+
        '<button type="button" class="btn btn--red" data-go="1">'+L({ru:'Начать приключение',en:'Start the adventure',ar:'ابدأ المغامرة'})+'</button>'+
        '<button type="button" class="g-intro__mute" data-go="0">'+L({ru:'Войти без музыки',en:'Enter without music',ar:'ادخل بلا موسيقى'})+'</button></div>'+
        '<button type="button" class="g-intro__skip" data-go="0">'+L({ru:'Пропустить',en:'Skip',ar:'تخطٍّ'})+'</button>';
      d.body.appendChild(x);d.documentElement.classList.add('g-lock');
      if(calm)x.classList.add('done');else{requestAnimationFrame(function(){x.classList.add('play')});setTimeout(function(){x.classList.add('done')},1700+IM.length*520+800)}
      x.addEventListener('click',function(e){var b=e.target.closest('[data-go]');if(!b)return;ls.set('gt_g_intro',Date.now());
        if(b.dataset.go==='1')play();x.classList.add('is-out');d.documentElement.classList.remove('g-lock');setTimeout(function(){x.remove()},950)});
      var first=x.querySelector('.btn');if(first)setTimeout(function(){first.focus({preventScroll:true})},calm?0:4800);
    }}
})();
