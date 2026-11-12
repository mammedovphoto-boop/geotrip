/* GeoTrip — интерактив сайта */
document.documentElement.classList.add('js');

/* Каждая страница открывается с самого начала (браузер не восстанавливает старую позицию) */
(function(){
  /* логотип: на главной — плавно наверх, без перезагрузки */
  document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('.logo');if(!a)return;
    var u;try{u=new URL(a.href,location.href)}catch(x){return}
    if(u.pathname===location.pathname){e.preventDefault();if(location.hash)history.replaceState(null,'',location.pathname+location.search);
      if(window.GT_GO)window.GT_GO(0);else window.scrollTo({top:0,behavior:'smooth'})}},true);
})();

/* Медленный плавный переход между страницами: тёмная «шторка» растворяется при входе и проявляется при уходе */
(function(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var D=document.documentElement;
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href]');if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    if(a.target&&a.target!=='_self')return;if(a.hasAttribute('download'))return;
    var u;try{u=new URL(a.href,location.href)}catch(x){return}
    if(u.origin!==location.origin||u.protocol.indexOf('http')!==0)return;
    if(u.pathname===location.pathname&&u.search===location.search&&u.hash)return; /* якорь на той же странице */
    if(a.hasAttribute('data-back'))return; /* «Назад» по истории — у него своя шторка */
    e.preventDefault();D.classList.add('leaving');
    setTimeout(function(){location.href=u.href},420);
  });
})();
(function(){
  var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  var LG=document.documentElement.lang,RU=LG==='ru',tr=function(r,e,a){return LG==='ru'?r:LG==='ar'?a:e};

  /* Эффект как у Apple: при уходе с первого экрана заголовок отдаляется и растворяется, видео приближается */
  var heroEl=$('.hero');
  if(heroEl&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    var hw=$('.wrap',heroEl),hv=$$('video, .hero__poster',heroEl),hq=false,hd=document.createElement('i');hd.className='hero__dim';heroEl.insertBefore(hd,hw);
    var heroFx=function(){hq=false;var k=Math.max(0,Math.min(1,scrollY/heroEl.offsetHeight));
      if(hw){hw.style.transform='translate3d(0,'+(-k*90)+'px,0) scale('+(1-k*0.12)+')';hw.style.opacity=String(1-k*1.25)}
      hv.forEach(function(v){v.style.transform='scale('+(1+k*0.1)+')'});if(hd)hd.style.opacity=String(k*0.6)};
    window.addEventListener('scroll',function(){if(!hq){hq=true;requestAnimationFrame(heroFx)}},{passive:true});heroFx();
  }

  /* Направления: при наведении подсвечивается часть Грузии на карте */
  var gm=$('.dirs4__map');
  if(gm){$$('.dirs4 [data-zone]').forEach(function(a){if(a===gm)return;var z=a.dataset.zone;
    a.addEventListener('mouseenter',function(){gm.dataset.zone=z});a.addEventListener('focus',function(){gm.dataset.zone=z});
    a.addEventListener('mouseleave',function(){gm.dataset.zone=''});a.addEventListener('blur',function(){gm.dataset.zone=''})})}

  /* Переход по ссылке с якорем: точно к началу раздела */
  if(location.hash&&location.hash.length>1){var hj=function(){var el=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(el)window.scrollTo(0,Math.round(el.getBoundingClientRect().top+scrollY))};
    if('scrollRestoration' in history)history.scrollRestoration='manual';hj();window.addEventListener('load',function(){hj();setTimeout(hj,120)})}
  /* Страница маршрутов: выбранное направление — сразу под шапкой страницы, остальные ниже */
  try{var rq=new URLSearchParams(location.search).get('r'),rs=rq&&document.getElementById('r-'+rq);
    if(rs){var first=document.querySelector('section.region');if(first&&first!==rs)first.parentNode.insertBefore(rs,first);rs.classList.add('region--focus')}}catch(x){}

  /* Шапка темнеет при прокрутке */
  var top=$('.top');
  var onScroll=function(){if(top)top.classList.toggle('is-solid',window.scrollY>60)};
  onScroll();window.addEventListener('scroll',onScroll,{passive:true});

  /* Кнопка «Назад»: возвращает на предыдущую страницу сайта, а если её нет — в раздел выше */
  /* свой журнал переходов: «Назад» возвращает ровно на ту страницу и то место, откуда пришли */
  var NAV=null,here=location.pathname+location.search;
  try{NAV=JSON.parse(sessionStorage.getItem('gt_nav')||'[]');
    var sync=function(){var n=[];try{n=JSON.parse(sessionStorage.getItem('gt_nav')||'[]')}catch(x){}
      var at=-1;for(var q=n.length-1;q>=0;q--)if(n[q].u===here){at=q;break}
      if(at>=0)n=n.slice(0,at+1);else n.push({u:here,y:0});   /* вернулись на страницу из журнала — всё, что после неё, отбрасываем */
      if(n.length>40)n=n.slice(-40);NAV=n;sessionStorage.setItem('gt_nav',JSON.stringify(n))};
    sync();addEventListener('pageshow',function(e){if(e.persisted)sync()});
    var saveY=function(){try{var n=JSON.parse(sessionStorage.getItem('gt_nav')||'[]');if(n.length&&n[n.length-1].u===here){n[n.length-1].y=Math.round(scrollY);sessionStorage.setItem('gt_nav',JSON.stringify(n))}}catch(x){}};
    addEventListener('pagehide',saveY);document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(a)saveY()},true);
    if(sessionStorage.getItem('gt_back')==='1'){sessionStorage.removeItem('gt_back');var y0=NAV[NAV.length-1].y||0;if(y0>0){var tries=0,put=function(){window.scrollTo(0,y0);if(++tries<6&&Math.abs(scrollY-y0)>4)setTimeout(put,120)};setTimeout(put,60)}}
  }catch(x){NAV=null}
  var back=$('[data-back]');
  if(back)back.addEventListener('click',function(e){
    var cu=document.documentElement,go=null;
    try{NAV=JSON.parse(sessionStorage.getItem('gt_nav')||'[]')}catch(x){}
    if(NAV&&NAV.length>1&&NAV[NAV.length-1].u===here){var prev=NAV[NAV.length-2].u;go=function(){try{sessionStorage.setItem('gt_back','1')}catch(x){}location.href=prev}}
    else{var ref=document.referrer,same=false;try{same=ref&&new URL(ref).origin===location.origin&&ref!==location.href}catch(x){}
      if(same&&history.length>1)go=function(){history.back()}}
    if(go){e.preventDefault();cu.classList.add('leaving');setTimeout(go,420)}
  });

  /* Меню: иллюстрация меняется при наведении на пункт */
  var burger=$('.burger');
  if(burger){
    burger.addEventListener('click',function(){
      var open=document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded',open);
    });
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&document.body.classList.contains('menu-open')){document.body.classList.remove('menu-open');burger.setAttribute('aria-expanded','false');burger.focus()}});
    var arts=$$('.menu__art img');
    var show=function(i){arts.forEach(function(a,n){a.classList.toggle('is-on',n===i)})};
    $$('.menu__list a[data-i]').forEach(function(a){
      var i=+a.dataset.i;a.addEventListener('mouseenter',function(){show(i)});a.addEventListener('focus',function(){show(i)});
    });
    var cur=$('.menu__list a[aria-current=page]');show(cur?+cur.dataset.i:0);
    $$('.menu__list a[data-i]').forEach(function(a){a.addEventListener('click',function(){if(a.getAttribute('href').charAt(0)==='#'){document.body.classList.remove('menu-open');burger.setAttribute('aria-expanded','false')}})});
  }

  /* «Рисование» линий: длину каждой линии считаем заранее */
  $$('.rt__line, .rt__case').forEach(function(p){try{p.style.setProperty('--len',Math.ceil(p.getTotalLength()))}catch(e){}});
  $$('.draw').forEach(function(svg){
    $$('path',svg).forEach(function(p){try{var l=Math.ceil(p.getTotalLength());p.style.setProperty('--len',l)}catch(e){}});
  });
  var drawOnView=$$('.draw[data-reveal]');
  if('IntersectionObserver' in window&&drawOnView.length){
    drawOnView.forEach(function(s){s.classList.add('pre')});
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.remove('pre');e.target.classList.add('go');io.unobserve(e.target)}})},{threshold:.25});
    drawOnView.forEach(function(s){io.observe(s)});
    setTimeout(function(){drawOnView.forEach(function(s){if(s.classList.contains('pre')){s.classList.remove('pre')}})},9000);
  }

  /* Тропа-навигация: точки стоят на извилистом маршруте, пройденный путь прорисовывается красным */
  var trailNav=$('.trail'),trail=$$('.trail a');
  if(trailNav&&trail.length){
    var road=$('.trail__road',trailNav),done=$('.trail__done',trailNav),L=road.getTotalLength(),n=trail.length;
    done.style.strokeDasharray=L;done.style.strokeDashoffset=L;
    trail.forEach(function(a,i){var pt=road.getPointAtLength(L*i/(n-1));a.style.left=pt.x+'px';a.style.top=pt.y+'px'});
    var tsecs=trail.map(function(a){return document.getElementById(a.getAttribute('href').slice(1))});
    var tick=false;
    function trailUpd(){tick=false;var mid=scrollY+innerHeight*0.5,idx=0,f=0;
      tsecTop.forEach(function(o,i){if(o<=mid)idx=i});
      var o0=tsecTop[idx],o1=tsecTop[idx+1];if(o1!=null){f=Math.max(0,Math.min(1,(mid-o0)/Math.max(1,o1-o0)))}
      done.style.strokeDashoffset=L*(1-Math.min(1,(idx+f)/(n-1)));
      trail.forEach(function(a,i){a.classList.toggle('is-on',i===idx);a.classList.toggle('is-past',i<idx)});
      /* цвет каждой точки — по фону под ней (геометрия считается один раз, при прокрутке — только арифметика) */
      var sy=scrollY;
      trail.forEach(function(a,i){var y=sy+TY[i],ink=PR.some(function(q){return y>=q[0]&&y<=q[1]});if(a._ink!==ink){a._ink=ink;a.classList.toggle('ink',ink)}});
      var mid=sy+TM,il=PR.some(function(q){return mid>=q[0]&&mid<=q[1]});if(trailNav._il!==il){trailNav._il=il;trailNav.classList.toggle('ink-line',il)}}
    var PR=[],TY=[],TM=0;
    function trailGeo(){var sy=scrollY;PR=$$('main > section.paper').map(function(s){var r=s.getBoundingClientRect();return [r.top+sy,r.bottom+sy]});
      TY=trail.map(function(a){var r=a.getBoundingClientRect();return r.top+r.height/2});var tr=trailNav.getBoundingClientRect();TM=tr.top+tr.height/2;
      tsecTop=tsecs.map(function(el){return el?el.offsetTop:0})}
    var tsecTop=[];
    window.addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(trailUpd)}},{passive:true});
    window.addEventListener('resize',function(){trailGeo();trailUpd()});window.addEventListener('load',function(){trailGeo();trailUpd()});trailGeo();trailUpd();
  }

  /* Фильм на весь экран: фоном, без рамок, со звуком */
  var modal=$('.video-modal');
  if(modal){
    var mv=$('video',modal),closeB=$('button',modal);
    mv.removeAttribute('controls');mv.muted=false;mv.volume=1;mv.preload='auto';
    var LGv=document.documentElement.lang,tv=function(r,e,a){return LGv==='ru'?r:LGv==='ar'?a:e};
    var bar=document.createElement('div');bar.className='vm__bar';bar.innerHTML='<i></i>';modal.appendChild(bar);
    var snd=document.createElement('button');snd.type='button';snd.className='vm__snd';modal.appendChild(snd);
    var setS=function(){snd.textContent=mv.muted?tv('Включить звук','Sound on','تشغيل الصوت'):tv('Выключить звук','Sound off','كتم الصوت');snd.setAttribute('aria-pressed',String(!mv.muted))};setS();
    snd.addEventListener('click',function(e){e.stopPropagation();mv.muted=!mv.muted;setS()});
    mv.addEventListener('timeupdate',function(){if(mv.duration)bar.firstChild.style.transform='scaleX('+(mv.currentTime/mv.duration)+')'});
    mv.addEventListener('click',function(){if(mv.paused)mv.play();else mv.pause()});
    var bgv=$$('video[autoplay]');
    var openV=function(){modal.classList.add('is-open');document.documentElement.classList.add('vm-lock');bgv.forEach(function(v){v.pause()});
      mv.currentTime=0;mv.muted=false;setS();var pr=mv.play();if(pr&&pr.catch)pr.catch(function(){mv.muted=true;setS();mv.play()});
      requestAnimationFrame(function(){modal.classList.add('is-in')});
      try{if(modal.requestFullscreen&&window.matchMedia('(pointer:fine)').matches)modal.requestFullscreen().catch(function(){});else if(mv.webkitEnterFullscreen&&!modal.requestFullscreen)mv.webkitEnterFullscreen()}catch(x){}
      closeB.focus()};
    $$('[data-play]').forEach(function(b){b.addEventListener('click',openV)});
    var closeV=function(){modal.classList.remove('is-in');document.documentElement.classList.remove('vm-lock');
      try{if(document.fullscreenElement)document.exitFullscreen()}catch(x){}
      setTimeout(function(){modal.classList.remove('is-open');mv.pause();bgv.forEach(function(v){var p=v.play();if(p&&p.catch)p.catch(function(){})})},700)};
    closeB.addEventListener('click',closeV);
    mv.addEventListener('ended',closeV);
    document.addEventListener('fullscreenchange',function(){if(!document.fullscreenElement&&modal.classList.contains('is-in'))closeV()});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&modal.classList.contains('is-open'))closeV()});
  }

  /* Слайдер впечатлений */
  $$('[data-slider]').forEach(function(sl){
    var imgs=$$('.slides__img img',sl),txt=$$('.slides__text>div',sl),n=imgs.length,i=0,cnt=$('.slider__count b',sl),timer;
    var go=function(k){i=(k+n)%n;imgs.forEach(function(im,j){im.classList.toggle('is-on',j===i)});txt.forEach(function(t,j){t.classList.toggle('is-on',j===i)});if(cnt)cnt.textContent=i+1};
    $('[data-prev]',sl).onclick=function(){go(i-1);clearInterval(timer)};
    $('[data-next]',sl).onclick=function(){go(i+1);clearInterval(timer)};
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)timer=setInterval(function(){go(i+1)},7000);
    go(0);
  });

  /* Просмотр фото */
  var zoom=$$('[data-zoom]');
  if(zoom.length){
    var lb=document.createElement('div');lb.className='lightbox';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');
    lb.innerHTML='<button class="lb-close" aria-label="'+tr('Закрыть','Close','إغلاق')+'">×</button><button class="lb-prev" aria-label="'+tr('Назад','Previous','السابق')+'">‹</button><img alt=""><button class="lb-next" aria-label="'+tr('Вперёд','Next','التالي')+'">›</button><p></p>';
    document.body.appendChild(lb);
    var big=$('img',lb),cap=$('p',lb),k=0;
    var show2=function(n){k=(n+zoom.length)%zoom.length;var el=zoom[k];big.src=el.dataset.zoom||el.src;big.alt=el.alt;cap.textContent=el.alt};
    var open=function(n){show2(n);lb.classList.add('is-open');$('.lb-close',lb).focus()};
    zoom.forEach(function(el,n){el.tabIndex=0;el.addEventListener('click',function(){open(n)});el.addEventListener('keydown',function(e){if(e.key==='Enter')open(n)})});
    var close=function(){lb.classList.remove('is-open')};
    $('.lb-close',lb).onclick=close;$('.lb-prev',lb).onclick=function(){show2(k-1)};$('.lb-next',lb).onclick=function(){show2(k+1)};
    lb.addEventListener('click',function(e){if(e.target===lb)close()});
    document.addEventListener('keydown',function(e){if(!lb.classList.contains('is-open'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')show2(k-1);if(e.key==='ArrowRight')show2(k+1)});
  }

  /* Форма заявки: открывает WhatsApp или почту с готовым текстом */
  $$('form[data-wa]:not([data-calc])').forEach(function(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();if(!f.reportValidity())return;
      var lines=[f.dataset.title];
      $$('[name]',f).forEach(function(el){if((el.type==='radio'||el.type==='checkbox')&&!el.checked)return;if(!el.dataset.label)return;var v=(el.value||'').trim();if(v)lines.push(el.dataset.label+': '+v)});
      var text=lines.join('\n');
      if(e.submitter&&e.submitter.value==='mail')location.href='mailto:'+f.dataset.mail+'?subject='+encodeURIComponent(f.dataset.title)+'&body='+encodeURIComponent(text);
      else window.open('https://wa.me/'+f.dataset.wa+'?text='+encodeURIComponent(text),'_blank','noopener');
    });
  });

  /* Заголовки: слова мягко поднимаются из-под маски по очереди */
  $$('.split').forEach(function(h){
    if(h.children.length)return;
    var words=h.textContent.trim().split(/\s+/);h.setAttribute('aria-label',h.textContent.trim());h.textContent='';
    words.forEach(function(w,i){var o=document.createElement('span');o.className='w';o.setAttribute('aria-hidden','true');var s=document.createElement('span');s.textContent=w;s.style.transitionDelay=(i*70)+'ms';o.appendChild(s);h.appendChild(o);if(i<words.length-1)h.appendChild(document.createTextNode(' '))});
  });
  /* Появление разделов при прокрутке */
  var rv=$$('.rv, .split');
  if('IntersectionObserver' in window&&rv.length){
    var rio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');rio.unobserve(e.target)}})},{rootMargin:'0px 0px -12% 0px'});
    rv.forEach(function(el){rio.observe(el)});
  } else rv.forEach(function(el){el.classList.add('in')});

  /* Фото в силуэтах сменяют друг друга */
  var REDUCE=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('[data-cycle]').forEach(function(box,n){
    var ims=$$('img',box);if(ims.length<2||REDUCE)return;var k=0;
    setTimeout(function(){setInterval(function(){ims[k].classList.remove('is-on');k=(k+1)%ims.length;ims[k].classList.add('is-on')},6000)},n*1300);
  });

  /* Пунктирный путь между услугами прорисовывается при прокрутке, острова плывут с параллаксом */
  var pathBox=$('[data-path]'),reveal=pathBox&&$('.svc__reveal',pathBox),par=$$('[data-par]'),ticking=false;
  function onScrollFx(){
    ticking=false;var vh=innerHeight;
    if(reveal){var r=pathBox.getBoundingClientRect(),t=Math.min(1,Math.max(0,(vh*0.75-r.top)/r.height));reveal.style.strokeDashoffset=String(REDUCE?0:1-t)}
    if(!REDUCE){var rs=par.map(function(el){return el.parentNode.getBoundingClientRect()});par.forEach(function(el,i){var r=rs[i];if(r.bottom<0||r.top>vh)return;el.style.transform='translate3d(0,'+((r.top+r.height/2-vh/2)*parseFloat(el.dataset.par)*0.5).toFixed(1)+'px,0)'})}
  }
  if(reveal||par.length){onScrollFx();window.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(onScrollFx)}},{passive:true});window.addEventListener('resize',onScrollFx)}

  /* На светлых разделах боковая навигация и языки становятся тёмными */
  var papers=$$('.paper');
  if(papers.length&&'IntersectionObserver' in window){
    var onP=new Set();
    var pio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)onP.add(e.target);else onP.delete(e.target)});document.body.classList.toggle('on-paper',onP.size>0)},{rootMargin:'-50% 0px -50% 0px'});
    papers.forEach(function(el){pio.observe(el)});
  }

  /* Транспорт: вкладки с фото */
  $$('[data-tabs]').forEach(function(box){
    var tabs=$$('[role=tab]',box),panes=$$('[role=tabpanel]',box);
    var sel=function(i,focus){tabs.forEach(function(t,j){t.setAttribute('aria-selected',j===i);t.tabIndex=j===i?0:-1});panes.forEach(function(p,j){p.classList.toggle('is-on',j===i)});if(focus)tabs[i].focus()};
    tabs.forEach(function(t,i){t.addEventListener('click',function(){sel(i)});t.addEventListener('mouseenter',function(){if(matchMedia('(hover:hover)').matches)sel(i)});
      t.addEventListener('keydown',function(e){var d=e.key==='ArrowDown'||e.key==='ArrowRight'?1:e.key==='ArrowUp'||e.key==='ArrowLeft'?-1:0;if(d){e.preventDefault();sel((i+d+tabs.length)%tabs.length,true)}})});
    sel(0);
  });

  /* Интерактивная карта направлений */
  $$('[data-atlas]').forEach(function(box){
    var mapEl=$('.atlas__map',box),links=$$('.atlas__list a',box);
    var focus=function(layer){
      $$('g.rt',mapEl).forEach(function(g){g.classList.toggle('is-on',g.dataset.layer===layer)});
      mapEl.classList.toggle('has-focus',!!layer);
      /* на телефоне карта приближается к выбранному маршруту */
      var svg=$('svg.geo--sat',mapEl),g=layer&&$('g.rt[data-layer="'+layer+'"]',mapEl);
      if(svg&&g){var full=svg.dataset.vb||(svg.dataset.vb=svg.getAttribute('viewBox')),F=full.split(' ').map(Number),to=F;
        if(false){try{var bb=g.getBBox(),pad=40,R=(svg.clientHeight||1)/(svg.clientWidth||1),w=Math.max(bb.width+pad*2,(bb.height+pad*2)/R,360),h=w*R;if(h>F[3]){h=F[3];w=h/R}
          var x=Math.max(0,Math.min(F[2]-w,bb.x+bb.width/2-w/2)),y=Math.max(0,Math.min(F[3]-h,bb.y+bb.height/2-h/2));to=[x,y,Math.min(w,F[2]),Math.min(h,F[3])]}catch(e){}}
        var from=svg.getAttribute('viewBox').split(' ').map(Number),t0=performance.now();cancelAnimationFrame(svg._vbr);
        (function st(now){var k=Math.min(1,(now-t0)/900),e=1-Math.pow(1-k,3);svg.setAttribute('viewBox',from.map(function(v,i){return (v+(to[i]-v)*e).toFixed(1)}).join(' '));if(k<1)svg._vbr=requestAnimationFrame(st)})(t0)}
      links.forEach(function(a){a.classList.toggle('is-on',a.dataset.layer===layer)});
    };
    var hov=window.matchMedia('(hover: hover)').matches;
    links.forEach(function(a){
      a.addEventListener('pointerdown',function(e){a._touch=e.pointerType!=='mouse';a._wasOn=a.classList.contains('is-on')});
      a.addEventListener('click',function(e){if((a._touch||!hov)&&!a._wasOn){e.preventDefault();focus(a.dataset.layer);a._wasOn=true}});
      a.addEventListener('mouseenter',function(){focus(a.dataset.layer)});
      a.addEventListener('focus',function(){focus(a.dataset.layer)});
    });
    if(links.length)focus(links[0].dataset.layer);
    /* выбор направления в шапке страницы: показываем только его маршруты и сразу первый на карте */
    $$('[data-pick]',box).forEach(function(btn){btn.addEventListener('click',function(e){e.preventDefault();var k=btn.dataset.pick,first=null;
      $$('.atlas__list li',box).forEach(function(li){var on=li.dataset.region===k;li.hidden=!on;if(on&&!first)first=li.querySelector('a')});
      $$('[data-pick],[data-pick-all]',box).forEach(function(x){x.classList.toggle('is-on',x===btn)});
      if(first)focus(first.dataset.layer)})});
    var ab0=$('[data-pick-all]',box);if(ab0)ab0.addEventListener('click',function(){$$('.atlas__list li',box).forEach(function(li){li.hidden=false});$$('[data-pick]',box).forEach(function(x){x.classList.remove('is-on')});ab0.classList.add('is-on');if(links.length)focus(links[0].dataset.layer)});
  });
})();

/* Картинки ниже первого экрана подгружаем заранее, чтобы при перелистывании раздел приезжал уже с фото */
(function(){
  var warm=function(){[].slice.call(document.querySelectorAll('img[loading=lazy]')).forEach(function(im,i){setTimeout(function(){im.loading='eager'},i*40)})};
  var go=function(){('requestIdleCallback' in window)?requestIdleCallback(warm,{timeout:1500}):setTimeout(warm,600)};
  if(document.readyState==='complete')go();else window.addEventListener('load',go);
  setTimeout(go,2500);
})();

/* Плавная постраничная прокрутка: раздел «доезжает» до экрана и останавливается */
(function(){
  var root=document.documentElement;
  var REDUCE=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE=window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var secs=[].slice.call(document.querySelectorAll('main > section, main > .scene, body > footer')).filter(function(el){return el.offsetHeight>40});
  if(REDUCE||secs.length<2)return;
  if(document.querySelector('.j3d-page'))return;
  var TOUCH=!FINE;
  root.classList.add('pager');
  /* Постраничное листание: один жест — один экран. Страница трогается сразу и медленно, мягко докатывается до места */
  var busy=false,raf=0,lastT=0,lastAbs=0,queued=0,prog=0,until=0,animDir=0,lastDir=0,animEnd=0,gDir=0,gUsed=false,gMin=0;
  var bez=function(p1x,p1y,p2x,p2y){return function(x){var t=x,i,cx,dx;for(i=0;i<8;i++){cx=((1-3*p2x+3*p1x)*t+(3*p2x-6*p1x))*t*t+3*p1x*t-x;dx=(3*(1-3*p2x+3*p1x)*t+2*(3*p2x-6*p1x))*t+3*p1x;if(Math.abs(cx)<1e-5||!dx)break;t-=cx/dx}t=Math.min(1,Math.max(0,t));return ((1-3*p2y+3*p1y)*t+(3*p2y-6*p1y))*t*t+3*p1y*t}};
  var ease=bez(.42,0,.12,1); /* мягкий старт и долгое «доплывание» без удара */
  function go(to,done){
    to=Math.max(0,Math.min(to,root.scrollHeight-innerHeight));var from=scrollY,d=to-from;
    if(Math.abs(d)<2){done&&done();return}
    var dur=Math.min(1250,Math.max(1050,Math.abs(d)*1.1)),t0=performance.now();busy=true;cancelAnimationFrame(raf);
    (function step(now){var k=Math.min(1,(now-t0)/dur);prog=k;window.scrollTo(0,from+d*ease(k));if(k<1)raf=requestAnimationFrame(step);else{busy=false;animEnd=performance.now();until=animEnd+120;if(queued){var q=queued;queued=0;next(q)}else done&&done()}})(t0);
  }
  window.GT_GO=go;
  /* если содержимое раздела не помещается в экран (открыты ответы, низкий экран) — раздел растёт, ничего не обрезается */
  function fit(){secs.forEach(function(s){var w=s.querySelector(':scope > .wrap');if(!w)return;s.classList.remove('tall');var cs=getComputedStyle(s),pad=parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom);if(w.scrollHeight+pad>s.clientHeight+80)s.classList.add('tall')})}
  fit();window.addEventListener('load',fit);window.addEventListener('resize',fit);
  /* вопросы: открыт один ответ за раз */
  document.querySelectorAll('#faq details').forEach(function(d,_,all){d.addEventListener('toggle',function(){if(d.open)all.forEach(function(o){if(o!==d)o.open=false});setTimeout(fit,30)})});
  function tops(){return secs.map(function(el){var r=el.getBoundingClientRect();return {top:Math.round(r.top+scrollY),bottom:Math.round(r.bottom+scrollY)}})}
  function next(dir){
    animDir=dir;
    var y=scrollY,vh=innerHeight,T=tops(),i=0;
    for(var j=0;j<T.length;j++)if(T[j].top<=y+4)i=j;
    var cur=T[i];
    if(dir>0){
      if(cur.bottom>y+vh+120)return go(Math.min(cur.bottom-vh,y+vh));          /* высокий раздел — целый экран внутри него */
      if(T[i+1])return go(T[i+1].top);
      return go(root.scrollHeight);
    } else {
      if(y>cur.top+120)return go(Math.max(cur.top,y-vh));
      var p=T[i-1];if(!p)return go(0);
      return go(p.bottom-p.top>vh+6?p.bottom-vh:p.top);
    }
  }
  function scrollableInside(el,dy){
    while(el&&el!==document.body){
      var cs=getComputedStyle(el);
      if(/(auto|scroll)/.test(cs.overflowY)&&el.scrollHeight>el.clientHeight+2){if(dy>0?el.scrollTop+el.clientHeight<el.scrollHeight-1:el.scrollTop>0)return true}
      el=el.parentElement;
    }
    return false;
  }
  function blocked(){var b=document.body;return b.classList.contains('menu-open')||!!document.querySelector('.lightbox.is-open,.video-modal.is-open')}
  window.addEventListener('wheel',function(e){
    if(e.ctrlKey||blocked()||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
    if(scrollableInside(e.target,e.deltaY))return;
    e.preventDefault();
    var now=performance.now(),a=Math.abs(e.deltaY),gap=now-lastT,dir=e.deltaY>0?1:-1;lastT=now;
    /* Один жест — один экран. Жест = непрерывный поток событий колеса/тачпада (паузы < 230 мс).
       Инерция тачпада и долгое вращение колеса остаются тем же жестом и ничего не перелистывают сами.
       Новый жест: пауза, смена направления или явный новый толчок посреди затухающей инерции. */
    var newG=gap>=230||dir!==gDir||(a>40&&a>gMin*2.2&&now-animEnd>300);
    if(newG){gDir=dir;gUsed=false;gMin=a}else gMin=Math.min(gMin,a);
    lastAbs=a;
    if(a<2)return;
    if(busy){
      /* развернули колесо во время движения — сразу едем обратно */
      if(dir!==animDir&&!gUsed){gUsed=true;cancelAnimationFrame(raf);busy=false;queued=0;lastDir=dir;next(dir)}
      /* отдельный новый жест (после паузы) ближе к концу движения — следующий экран сразу за этим */
      else if(dir===animDir&&!gUsed&&gap>=230&&prog>0.55){gUsed=true;queued=dir}
      return;
    }
    if(gUsed||now<until)return;
    gUsed=true;lastDir=dir;next(dir);
  },{passive:false});
  /* телефон: свайп — тот же мягкий переход к следующему экрану, что и колесо на компьютере */
  if(TOUCH){
    var ty0=0,tx0=0,tt0=0,tmode=0,tsc=null;
    window.addEventListener('touchstart',function(e){if(e.touches.length!==1||blocked())return;ty0=e.touches[0].clientY;tx0=e.touches[0].clientX;tt0=performance.now();tmode=0;
      tsc=e.target.closest&&e.target.closest('.tr__list,.stars,.film,.acts,.chips2,input,textarea,select,.atlas__map,.drum__list,.cal');},{passive:true});
    window.addEventListener('touchmove',function(e){if(blocked()||tsc)return;var dy=e.touches[0].clientY-ty0,dx=e.touches[0].clientX-tx0;
      if(!tmode&&(Math.abs(dy)>6||Math.abs(dx)>6))tmode=Math.abs(dy)>Math.abs(dx)?1:2;
      if(tmode===1)e.preventDefault()},{passive:false});
    window.addEventListener('touchend',function(e){if(tmode!==1||tsc||blocked())return;var dy=(e.changedTouches[0].clientY-ty0);if(Math.abs(dy)<30)return;if(busy)return;next(dy<0?1:-1)},{passive:true});
  }
  window.addEventListener('keydown',function(e){
    var t=e.target,tag=t&&t.tagName;if(blocked()||/INPUT|SELECT|TEXTAREA|BUTTON/.test(tag)||(t&&t.isContentEditable))return;
    var dir={ArrowDown:1,PageDown:1,' ':1,ArrowUp:-1,PageUp:-1}[e.key];if(e.key===' '&&e.shiftKey)dir=-1;
    if(dir){e.preventDefault();if(!busy)next(dir)}
    if(e.key==='Home'){e.preventDefault();go(0)}if(e.key==='End'){e.preventDefault();go(root.scrollHeight)}
  });
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;var id=a.getAttribute('href').slice(1);var el=id&&document.getElementById(id);if(!el)return;
    e.preventDefault();go(Math.round(el.getBoundingClientRect().top+scrollY));
  });
})();

/* Калькулятор тура и конструктор своего маршрута. Цены, даты и места берутся из content/tours.py */
(function(){
  var form=document.querySelector('[data-calc]'),src=document.getElementById('calc-data');
  if(!form||!src)return;
  var D=JSON.parse(src.textContent),LG=document.documentElement.lang,RU=LG==='ru',AR=LG==='ar',P=D.program,TW=D.towns;
  var LOC=RU?'ru-RU':AR?'ar-u-ca-gregory-nu-latn':'en-GB';
  var $=function(s){return form.querySelector(s)},$$=function(s){return [].slice.call(form.querySelectorAll(s))};
  var T=AR?{group:'رحلة جماعية',priv:'رحلة خاصة',ask:'السعر عند الطلب',pp:'السعر للشخص الواحد',total:'الإجمالي لمجموعتك: ',
      approx:'سعر تقديري: تغيَّر المسار أو عدد الأيام، وسنرسل إليك السعر الدقيق عبر واتساب.',days:function(n){return n===1?'يوم واحد':n===2?'يومان':n+' '+(n%100>=3&&n%100<=10?'أيام':n%100>=11?'يومًا':'يوم')},
      noDate:'اختر تاريخًا',route:'المسار',mode:'نوع الرحلة',dates:'التواريخ',hotels:'الفنادق',people:'عدد المسافرين',price:'السعر',dur:'عدد الأيام',
      months:['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],wd:['ن','ث','ر','خ','ج','س','ح'],
      msg:'مرحبًا! أرغب في حجز رحلة',msgC:'مرحبًا! أرغب في رحلة خاصة وفق مساري الخاص',saved:'حُفِظ طلبك في حسابك.',
      daysHint:'مدة برنامج الرحلة {n}، ويمكنك تقصيرها أو تمديدها.',daysHintC:'كم يومًا تريد أن تقضي في جورجيا؟',remove:'حذف',
      comma:'، ',arrow:' ← ',q:['«','»'],noD:'لم تُحدَّد بعد',askP:'يُرجى حساب السعر',est:' (تقديري)',ppl:'السعر للشخص',tot:'الإجمالي'}
    :RU?{group:'Групповой тур',priv:'Индивидуальный тур',ask:'Цену рассчитает ведущий экспедиции',pp:'цена за 1 человека',total:'Итого за всех: ',
      approx:'Ориентировочно: маршрут или число дней изменены. Точную цену пришлём в WhatsApp.',days:function(n){var a=n%10,b=n%100;return n+' '+(a===1&&b!==11?'день':a>=2&&a<=4&&(b<12||b>14)?'дня':'дней')},
      noDate:'выберите дату',route:'Маршрут',mode:'Формат',dates:'Даты',hotels:'Отели',people:'Человек',price:'Цена',dur:'Дней',
      months:['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'],wd:['пн','вт','ср','чт','пт','сб','вс'],
      msg:'Здравствуйте! Хочу забронировать тур',msgC:'Здравствуйте! Хочу индивидуальный тур по своему маршруту',saved:'Заявка сохранена в личном кабинете.',
      daysHint:'В программе тура {n}. Можно сделать короче или длиннее.',daysHintC:'Сколько дней вы хотите провести в Грузии.',remove:'Убрать',
      comma:', ',arrow:' → ',q:['«','»'],noD:'пока не выбраны',askP:'прошу рассчитать',est:' (ориентировочно)'}
    :{group:'Group tour',priv:'Private tour',ask:'Price on request',pp:'price per person',total:'Total for your group: ',
      approx:'Estimate: the route or length has changed. We’ll send the exact price on WhatsApp.',days:function(n){return n+' '+(n===1?'day':'days')},
      noDate:'select a date',route:'Route',mode:'Tour type',dates:'Dates',hotels:'Hotels',people:'Travellers',price:'Price',dur:'Days',
      months:['January','February','March','April','May','June','July','August','September','October','November','December'],wd:['Mo','Tu','We','Th','Fr','Sa','Su'],
      msg:'Hello! I would like to book a tour',msgC:'Hello! I would like a private tour on my own route',saved:'Your request has been saved to your account.',
      daysHint:'The tour itinerary has {n}. You can make it shorter or longer.',daysHintC:'How many days you’d like to spend in Georgia.',remove:'Remove',
      comma:', ',arrow:' → ',q:['“','”'],noD:'not chosen yet',askP:'please send a quote',est:' (estimate)'};
  var iso=function(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
  var parse=function(s){var a=s.split('-');return new Date(+a[0],+a[1]-1,+a[2])};
  var add=function(s,n){var d=parse(s);d.setDate(d.getDate()+n);return iso(d)};
  var fmtD=function(s,y){return parse(s).toLocaleDateString(LOC,y?{day:'numeric',month:'long',year:'numeric'}:{day:'numeric',month:'long'})};
  var fmt=function(n){return Math.round(n).toLocaleString(AR?'en-US':RU?'ru-RU':'en-US')};
  var today=iso(new Date());
  var base=P.stops.slice(),airports=D.airports;
  var uniq=function(a){var o=[];a.forEach(function(x){if(o.indexOf(x)<0)o.push(x)});return o};
  var I=JSON.parse((document.getElementById('calc-i18n')||{}).textContent||'{}');
  var state={rooms:{dbl:1,twn:0,sgl:0},roomsTouched:false,modified:!!D.custom,mode:D.custom?'private':'group',stars:$('[name=stars]:checked').value,n:2,gdate:null,pdate:null,days:P.days,
    arrive:base[0],depart:base[base.length-1],places:uniq(base).filter(function(x,i,a){return !(airports.indexOf(x)>=0&&(x===base[0]||x===base[base.length-1]))})};
  var range=function(s,len){return fmtD(s)+' — '+fmtD(add(s,(len||P.days)-1),true)};

  /* --- маршрут: пока клиент ничего не менял — маршрут тура; иначе самый короткий путь через выбранные места --- */
  var dist=function(a,b){return Math.hypot(TW[a].x-TW[b].x,TW[a].y-TW[b].y)};
  function ordered(){
    if(!state.modified)return base.slice();
    var left=state.places.filter(function(x){return x!==state.arrive&&x!==state.depart}),path=[state.arrive,state.depart];
    while(left.length){ /* дешёвая вставка */
      var bi=0,bp=1,bc=1e9;
      left.forEach(function(n,i){for(var k=1;k<path.length;k++){var c=dist(path[k-1],n)+dist(n,path[k])-(path[k-1]===path[k]?0:dist(path[k-1],path[k]));if(c<bc){bc=c;bi=i;bp=k}}});
      path.splice(bp,0,left.splice(bi,1)[0]);
    }
    var improved=true,guard=0; /* 2-opt */
    while(improved&&guard++<50){improved=false;
      for(var i=1;i<path.length-2;i++)for(var j=i+1;j<path.length-1;j++){
        var d0=dist(path[i-1],path[i])+dist(path[j],path[j+1]),d1=dist(path[i-1],path[j])+dist(path[i],path[j+1]);
        if(d1+0.01<d0){path=path.slice(0,i).concat(path.slice(i,j+1).reverse(),path.slice(j+1));improved=true}}}
    return path;
  }
  function smooth(pts){
    if(pts.length<2)return '';var d='M'+pts[0][0]+' '+pts[0][1];
    for(var i=0;i<pts.length-1;i++){var p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;
      d+=' C'+(p1[0]+(p2[0]-p0[0])/6).toFixed(1)+' '+(p1[1]+(p2[1]-p0[1])/6).toFixed(1)+' '+(p2[0]-(p3[0]-p1[0])/6).toFixed(1)+' '+(p2[1]-(p3[1]-p1[1])/6).toFixed(1)+' '+p2[0]+' '+p2[1]}
    return d;
  }
  var NS='http://www.w3.org/2000/svg';
  /* карта конструктора: спутниковая подложка, линии — по настоящим дорогам между городами */
  var RD=null,rsvg=form.querySelector('svg[data-roads]');
  if(rsvg){fetch(rsvg.getAttribute('data-roads')).then(function(r){return r.json()}).then(function(j){RD=j;drawMap()}).catch(function(){})}
  function roadPts(a,b){if(!RD)return null;var r=RD.roads[a+'|'+b];if(r)return r;r=RD.roads[b+'|'+a];return r?r.slice().reverse():null}
  function drawMap(){
    var g=form.querySelector('.rt--custom');if(!g)return;
    var path=ordered(),d='';
    if(RD){for(var i=0;i<path.length-1;i++){if(path[i]===path[i+1])continue;var seg=roadPts(path[i],path[i+1])||[RD.towns[path[i]],RD.towns[path[i+1]]];
        seg.forEach(function(p,k){if(!p)return;d+=(d&&!(k===0)?' L':(d?' L':'M'))+p[0]+' '+p[1]})}}
    else{path.forEach(function(n,i){var t=TW[n];d+=(i?' L':'M')+t.x+' '+t.y})}
    ['.rt__case','.rt__line'].forEach(function(s){var l=g.querySelector(s);if(!l)return;l.setAttribute('d',d);
      try{var L=Math.ceil(l.getTotalLength());l.style.setProperty('--len',L);l.style.strokeDasharray=L;l.animate([{strokeDashoffset:L},{strokeDashoffset:0}],{duration:1100,easing:'cubic-bezier(.4,.1,.2,1)'})}catch(e){}});
    var st=g.querySelector('.rt__stops');st.innerHTML='';
    uniq(path).forEach(function(n){var t=TW[n],p=RD&&RD.towns[n]?RD.towns[n]:[t.x,t.y],air=airports.indexOf(n)>=0;
      var c=document.createElementNS(NS,'circle');c.setAttribute('cx',p[0]);c.setAttribute('cy',p[1]);c.setAttribute('r',air?7:4.6);
      c.setAttribute('fill',air?'#fff':'#000');c.setAttribute('stroke',air?'#000':'#fff');c.setAttribute('stroke-width','2');st.appendChild(c);
      var tx=document.createElementNS(NS,'text');tx.setAttribute('x',p[0]+t.l[0]);tx.setAttribute('y',p[1]+t.l[1]);tx.setAttribute('text-anchor',t.l[2]);tx.textContent=t.name;st.appendChild(tx)});
  }
  function chips(){
    var ul=$('.chips2');ul.innerHTML='';
    uniq(ordered().slice(1,-1)).filter(function(n){return n!==state.arrive&&n!==state.depart}).forEach(function(n){var li=document.createElement('li');li.textContent=TW[n].name;
      var b=document.createElement('button');b.type='button';b.setAttribute('aria-label',T.remove+': '+TW[n].name);b.textContent='×';
      b.onclick=function(){state.modified=true;state.places=state.places.filter(function(x){return x!==n});refresh()};li.appendChild(b);ul.appendChild(li)});
    $$('#b-add option').forEach(function(o){if(o.value)o.disabled=state.places.indexOf(o.value)>=0||o.value===state.arrive||o.value===state.depart});
  }
  var changed=function(){return state.days!==P.days||!!state.modified};
  function uniqNoBack(a){/* маршрут тура без возвратов, для сравнения */var o=[a[0]];a.slice(1,-1).forEach(function(x){if(o.indexOf(x)<0)o.push(x)});o.push(a[a.length-1]);return o}

  /* --- цена --- */
  function priceFor(){
    if(state.mode==='group')return P.group[state.stars]||null;
    var row=P.private[state.stars]||{};var v=row[state.n];
    if(!v){var best=null;Object.keys(row).map(Number).sort(function(a,b){return a-b}).forEach(function(k){if(k<=state.n)best=row[k]});v=best}
    if(!v)return null;
    if(state.mode==='private'&&state.days!==P.days)v=Math.ceil(v/P.days*state.days/10)*10;
    return v;
  }
  /* --- барабан дат групп --- */
  var list=$('.drum__list'),gdates=P.dates.filter(function(d){return d>=today});
  if(!gdates.length){$('.drum').hidden=true;$('.drum__empty').hidden=false}
  gdates.forEach(function(d){var li=document.createElement('li'),b=document.createElement('button');b.type='button';b.setAttribute('role','radio');b.dataset.d=d;b.textContent=range(d);b.onclick=function(){state.gdate=d;mark();upd()};li.appendChild(b);list.appendChild(li)});
  function mark(){$$('.drum__list button').forEach(function(b){b.setAttribute('aria-checked',b.dataset.d===state.gdate)})}
  if(gdates.length){state.gdate=gdates[0];mark()}
  $('[data-up]').onclick=function(){list.scrollBy({top:-48,behavior:'smooth'})};
  $('[data-down]').onclick=function(){list.scrollBy({top:48,behavior:'smooth'})};
  /* --- календарь --- */
  var view=new Date();view.setDate(1);
  function cal(){
    $('.cal__title').textContent=T.months[view.getMonth()]+' '+view.getFullYear();
    var grid=$('.cal__grid');grid.innerHTML=T.wd.map(function(w){return '<i>'+w+'</i>'}).join('');
    var first=(view.getDay()+6)%7,dn=new Date(view.getFullYear(),view.getMonth()+1,0).getDate();
    for(var i=0;i<first;i++)grid.appendChild(document.createElement('span'));
    var end=state.pdate?add(state.pdate,state.days-1):null;
    for(var d=1;d<=dn;d++){var s=iso(new Date(view.getFullYear(),view.getMonth(),d)),b=document.createElement('button');b.type='button';b.textContent=d;b.dataset.d=s;
      if(s<today)b.disabled=true;
      if(state.pdate){if(s===state.pdate)b.classList.add('start');else if(s===end)b.classList.add('end');else if(s>state.pdate&&s<end)b.classList.add('in')}
      b.setAttribute('aria-label',fmtD(s,true));b.onclick=function(){state.pdate=this.dataset.d;cal();upd()};grid.appendChild(b)}
    var now=new Date();$('[data-prev-m]').disabled=view.getFullYear()===now.getFullYear()&&view.getMonth()===now.getMonth();
  }
  $('[data-prev-m]').onclick=function(){view.setMonth(view.getMonth()-1);cal()};
  $('[data-next-m]').onclick=function(){view.setMonth(view.getMonth()+1);cal()};

  function upd(){
    $$('[data-for]').forEach(function(el){el.hidden=el.dataset.for!==state.mode});
    var priv=state.mode==='private',len=priv?state.days:P.days,start=priv?state.pdate:state.gdate,price=priceFor();
    $('.sum__route').textContent=P.name+T.comma+T.days(len);
    $('[data-s=mode]').textContent=priv?T.priv:T.group;
    $('[data-s=dates]').textContent=start?fmtD(start)+' — '+fmtD(add(start,len-1),true):T.noDate;
    $('[data-s=hotels]').textContent=state.stars+'★';
    $('[data-s=people]').textContent=state.n;
    var R=state.rooms,beds=2*(R.dbl+R.twn)+R.sgl;['dbl','twn','sgl'].forEach(function(k){$('#r-'+k).textContent=R[k]});
    $('[data-s=rooms]').textContent=roomsText()||'—';
    var rh=$('[data-rooms-hint]');rh.textContent=I.r_ok.replace('{a}',beds).replace('{n}',state.n)+(beds<state.n?' '+I.r_lack:beds>state.n+1?' '+I.r_more:'');rh.classList.toggle('warn',beds<state.n);
    var A=actsList(),sa=$('[data-s=acts]'),st=$('[data-s=transport]');if(sa)sa.textContent=A.length?A.join(T.comma):I.none;if(st)st.textContent=transText();
    var stops=$('[data-s=stops]');stops.hidden=!priv;if(priv)stops.textContent=uniqNoBack(ordered()).map(function(n){return TW[n].name}).join(T.arrow);
    $('#b-days').textContent=state.days;
    $('[data-days-hint]').textContent=D.custom?T.daysHintC:T.daysHint.replace('{n}',T.days(P.days));
    var pp=$('.sum__pp');
    if(price){pp.textContent=fmt(price)+' $';pp.classList.remove('ask');$('.sum__price small').textContent=T.pp;$('.sum__total').textContent=T.total+fmt(price*state.n)+' $';
      $('.sum__note').textContent=[(priv&&changed())?T.approx:'',A.length?I.x_acts:'',R.sgl>0?I.x_sgl:''].filter(Boolean).join(' ')}
    else{pp.textContent=T.ask;pp.classList.add('ask');$('.sum__price small').textContent='';$('.sum__total').textContent='';$('.sum__note').textContent=[A.length?I.x_acts:'',R.sgl>0?I.x_sgl:''].filter(Boolean).join(' ')}
    form._s={start:start,price:price,len:len};
  }
  function roomsText(){var R=state.rooms;return ['dbl','twn','sgl'].filter(function(k){return R[k]>0}).map(function(k){return I[k]+' × '+R[k]}).join(T.comma)}
  function actsList(){return $$('[name=acts]:checked').map(function(c){return I[c.value]})}
  function transText(){var r=$('[name=transport]:checked');return r?I[r.value==='jeep'?'tjeep':r.value]:''}
  function autoRooms(){if(state.roomsTouched)return;state.rooms={dbl:Math.floor(state.n/2),twn:0,sgl:state.n%2}}
  $$('[data-room]').forEach(function(b){b.onclick=function(){var k=b.dataset.room;state.roomsTouched=true;state.rooms[k]=Math.max(0,Math.min(16,state.rooms[k]+ +b.dataset.d));upd()}});
  try{var addQ=new URLSearchParams(location.search).get('add');if(addQ){addQ.split(',').forEach(function(k){var c=$('#act-'+k);if(c)c.checked=true})}}catch(x){}
  function refresh(){chips();drawMap();cal();upd()}

  form.addEventListener('change',function(e){
    var t=e.target;
    if(t.name==='mode'){state.mode=t.value;if(state.mode==='private')setTimeout(drawMap,30)}
    if(t.name==='stars')state.stars=t.value;
    if(t.name==='people'){state.n=+t.value;autoRooms()}
    if(t.id==='b-arrive'){state.arrive=t.value;state.modified=true}
    if(t.id==='b-depart'){state.depart=t.value;state.modified=true}
    if(t.id==='b-add'&&t.value){state.modified=true;if(state.places.indexOf(t.value)<0)state.places.push(t.value);t.value='';
      if(!D.custom&&state.days<uniq(ordered()).length)state.days=Math.min(21,uniq(ordered()).length)}
    refresh();
  });
  $$('[data-days]').forEach(function(b){b.onclick=function(){state.days=Math.max(2,Math.min(21,state.days+ +b.dataset.days));refresh()}});
  var rs=$('[data-reset]');if(rs)rs.onclick=function(){state.modified=false;state.days=P.days;state.arrive=base[0];state.depart=base[base.length-1];
    state.places=uniq(base).filter(function(x){return !(airports.indexOf(x)>=0&&(x===base[0]||x===base[base.length-1]))});$('#b-arrive').value=state.arrive;$('#b-depart').value=state.depart;refresh()};
  $('#b-arrive').value=state.arrive;$('#b-depart').value=state.depart;autoRooms();

  form.addEventListener('submit',function(e){
    e.preventDefault();var s=form._s,priv=state.mode==='private',price=s.price;
    var q=T.q,noD=T.noD,askP=T.askP;
    var lines=[D.custom?T.msgC:T.msg+(P.name?' '+q[0]+P.name+q[1]:''),T.mode+': '+(priv?T.priv:T.group),T.dur+': '+s.len,
      T.dates+': '+(s.start?fmtD(s.start)+' — '+fmtD(add(s.start,s.len-1),true):noD),T.hotels+': '+state.stars+'★',T.people+': '+state.n];
    if(roomsText())lines.push(I.rooms+': '+roomsText());
    if(priv)lines.push(T.route+': '+uniqNoBack(ordered()).map(function(n){return TW[n].name}).join(T.arrow));
    if(transText())lines.push(I.trans+': '+transText());
    if(actsList().length)lines.push(I.acts+': '+actsList().join(T.comma));
    var wi=$('#c-wish');if(wi&&wi.value.trim())lines.push(I.wish+': '+wi.value.trim());
    if(AR&&price){lines.push(T.ppl+': '+fmt(price)+' $'+(priv&&changed()?T.est:''));lines.push(T.tot+': '+fmt(price*state.n)+' $')}
    else lines.push(T.price+': '+(price?fmt(price)+' $ × '+state.n+' = '+fmt(price*state.n)+' $'+(priv&&changed()?T.est:''):askP));
    window.open('https://wa.me/'+form.dataset.wa+'?text='+encodeURIComponent(lines.join('\n')),'_blank','noopener');
    if(window.GT_ACCOUNT){window.GT_ACCOUNT.saveBooking({program:P.slug,title:P.name,days:s.len,mode:state.mode,start:s.start,stars:+state.stars,persons:state.n,price:price}).then(function(ok){var n=document.querySelector('[data-saved]');if(ok&&n){n.textContent=T.saved;n.hidden=false}})}
  });
  refresh();
})();

/* Личный кабинет: работает через /api на хостинге Cloudflare */
(function(){
  var LG=document.documentElement.lang,RU=LG==='ru',tr=function(r,e,a){return LG==='ru'?r:LG==='ar'?a:e};
  var api=function(path,body){return fetch('/api/'+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},credentials:'same-origin',body:body?JSON.stringify(body):undefined}).then(function(r){return r.json().then(function(j){j._ok=r.ok;return j}).catch(function(){return {_ok:false,_offline:true}})}).catch(function(){return {_ok:false,_offline:true}})};
  var M=LG==='ar'?{offline:'سيعمل الحساب الشخصي بعد نشر الموقع على الاستضافة. تسجيل الدخول غير متاح في هذه المعاينة.',err:'حدث خطأ: ',bad:'البريد الإلكتروني أو كلمة المرور غير صحيحة.',exists:'هذا البريد الإلكتروني مسجَّل بالفعل. يُرجى تسجيل الدخول.'}
          :RU?{offline:'Личный кабинет заработает, когда сайт будет опубликован на хостинге. В этом превью вход недоступен.',err:'Не получилось: ',bad:'Неверная почта или пароль.',exists:'Такая почта уже зарегистрирована — войдите.'}
          :{offline:'Accounts will be available once the site goes live. Signing in isn’t possible in this preview.',err:'Something went wrong: ',bad:'Incorrect email or password.',exists:'An account with this email already exists. Please sign in.'};
  var me=null;
  window.GT_ACCOUNT={saveBooking:function(b){return me?api('bookings',b).then(function(r){return r._ok}):Promise.resolve(false)}};
  var who=document.querySelector('[data-who]');
  api('me').then(function(r){
    if(r._ok&&r.user){me=r.user;if(who){who.textContent=r.user.name||r.user.email;who.hidden=false}}
    var page=document.querySelector('[data-account]');if(!page)return;
    var note=page.querySelector('.notice');
    var say=function(t){if(note){note.textContent=t;note.hidden=false}};
    if(r._offline&&page.dataset.account!=='profile')say(M.offline);
    var form=page.querySelector('form[data-api]');
    if(form)form.addEventListener('submit',function(e){
      e.preventDefault();if(!form.reportValidity())return;
      var data={};[].forEach.call(form.elements,function(el){if(el.name)data[el.name]=el.value.trim()});
      api(form.dataset.api,data).then(function(res){
        if(res._offline)return say(M.offline);
        if(!res._ok)return say(res.error==='bad_login'?M.bad:res.error==='exists'?M.exists:M.err+(res.error||''));
        location.href=page.dataset.next;
      });
    });
    if(page.dataset.account==='profile'){
      if(r._offline){say(M.offline);return}
      if(!r._ok){location.href=page.dataset.login;return}
      page.querySelector('[data-name]').textContent=r.user.name||'';
      page.querySelector('[data-email]').textContent=r.user.email;
      var sf=page.querySelector('form[data-settings]');
      if(sf){sf.elements.name.value=r.user.name||'';sf.elements.phone.value=r.user.phone||'';
        sf.addEventListener('submit',function(e){e.preventDefault();api('settings',{name:sf.elements.name.value,phone:sf.elements.phone.value}).then(function(x){say(x._ok?tr('Сохранено.','Saved.','تم الحفظ.'):M.err)})})}
      page.querySelector('[data-logout]').addEventListener('click',function(){api('logout',{}).then(function(){location.href=page.dataset.login})});
      api('bookings').then(function(b){
        var box=page.querySelector('.bk');if(!b._ok||!b.items||!b.items.length)return;
        box.innerHTML='';
        b.items.forEach(function(it){
          var a=document.createElement('article');
          var st=it.status==='confirmed'?['ok',tr('подтверждена','confirmed','تم التأكيد')]:['new',tr('новая заявка','request received','طلب جديد')];
          a.innerHTML='<h3></h3><span class="st st--'+st[0]+'">'+st[1]+'</span><p></p>';
          a.querySelector('h3').textContent=it.title+' · '+(LG==='ar'?'عدد الأيام: '+it.days:it.days+(RU?' дн.':' d'));
          a.querySelector('p').textContent=[(it.mode==='group'?tr('группа','group','رحلة جماعية'):tr('индивидуально','private','رحلة خاصة')),it.start||'',it.stars+'★',(LG==='ar'?'عدد المسافرين: '+it.persons:it.persons+(RU?' чел.':' ppl')),it.price?it.price+' $':''].filter(Boolean).join(LG==='ar'?'، ':', ');
          box.appendChild(a);
        });
      });
    }
  });
})();
/* 12.11: телефон — вместо видео слайды; музыка; рисунки с «горячим» транспортом */
(function(){
  var $=function(q,r){return (r||document).querySelector(q)},$$=function(q,r){return [].slice.call((r||document).querySelectorAll(q))};
  /* на телефоне фоновое видео не грузим — там фото-слайды */
  if(window.matchMedia('(max-width:760px)').matches){var hv=$('.hero > video');if(hv){hv.removeAttribute('autoplay');try{hv.pause()}catch(e){}$$('source',hv).forEach(function(x){x.remove()});hv.removeAttribute('src');try{hv.load()}catch(e){}}}
  /* фоновая музыка: включается кнопкой-эквалайзером, выбор запоминается */
  var eq=$('[data-music]');
  if(eq){
    var au=null,fade=0,want=false;
    var mk=function(){if(!au){au=new Audio(eq.dataset.music);au.loop=true;au.preload='auto';au.volume=0}return au};
    var ramp=function(to,done){cancelAnimationFrame(fade);var from=au.volume,t0=performance.now();(function st(n){var k=Math.min(1,(n-t0)/1400);au.volume=Math.max(0,Math.min(1,from+(to-from)*k));if(k<1)fade=requestAnimationFrame(st);else done&&done()})(t0)};
    var set=function(on,silent){want=on;eq.setAttribute('aria-pressed',on?'true':'false');eq.setAttribute('aria-label',on?eq.dataset.off:eq.dataset.on);
      if(!silent){try{localStorage.setItem('gt_music',on?'1':'0')}catch(e){}}
      if(on){mk();var pr=au.play();if(pr&&pr.catch)pr.catch(function(){eq.setAttribute('aria-pressed','false');want=false;var once=function(){removeEventListener('pointerdown',once);if(!want)set(true,true)};addEventListener('pointerdown',once)});ramp(0.42)}
      else if(au){ramp(0,function(){au.pause()})}};
    eq.addEventListener('click',function(e){e.stopPropagation();set(!want)});
    var pref=null;try{pref=localStorage.getItem('gt_music')}catch(e){}
    if(pref==='1')set(true,true);
    /* фильм со звуком — музыку на это время приглушаем */
    document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-play]')&&au&&want){ramp(0,function(){au.pause()});eq.setAttribute('aria-pressed','false');want=false}});
    document.addEventListener('visibilitychange',function(){if(!au||!want)return;if(document.hidden)au.pause();else au.play().catch(function(){})});
  }
  /* в рисунках ярко прорисовывается только транспорт */
  var HOT={main_art1:[[14700,22000,35000,34600]],main_art2:[[17800,0,41300,17200],[44000,15200,52200,24900],[46600,25200,65300,38500]],'art-own':'pin'};
  var mark=function(){
    $$('svg[data-art]').forEach(function(svg){var zones=HOT[svg.dataset.art];if(!zones||svg.classList.contains('hotted'))return;
      var ps=$$('path,circle,ellipse,polygon,polyline,line',svg),n=0;
      if(zones==='pin'){var vb=(svg.getAttribute('viewBox')||'0 0 1 1').split(/[ ,]+/).map(Number),area=vb[2]*vb[3];
        ps.forEach(function(p){try{var b=p.getBBox();if(b.width*b.height<area*0.012&&b.width<vb[2]*0.12){p.classList.add('hot');p.setAttribute('pathLength','1');n++}}catch(e){}})}
      else ps.forEach(function(p){try{var b=p.getBBox(),cx=b.x+b.width/2,cy=b.y+b.height/2;
        for(var i=0;i<zones.length;i++){var z=zones[i];if(cx>z[0]&&cx<z[2]&&cy>z[1]&&cy<z[3]&&b.width<=(z[2]-z[0])*1.04&&b.height<=(z[3]-z[1])*1.04){p.classList.add('hot');p.setAttribute('pathLength','1');n++;break}}}catch(e){}});
      if(n)svg.classList.add('hotted')});
    $$('.soon__art svg .hot *').forEach(function(p){p.setAttribute('pathLength','1')});
  };
  mark();addEventListener('load',mark);
})();
/* 12.11: слайдер фото программы и закреплённая цена */
(function(){
  var $=function(q,r){return (r||document).querySelector(q)},$$=function(q,r){return [].slice.call((r||document).querySelectorAll(q))};
  $$('[data-pslider]').forEach(function(box){
    var S=$$('.ps__s',box),D=$$('.ps__dots i',box),n=S.length,cur=0,timer=0,hold=false;if(n<2)return;
    var show=function(i){cur=(i%n+n)%n;S.forEach(function(s,k){var d=((k-cur)%n+n)%n;s.className='ps__s'+(d===0?' is-cur':d===1?' is-next':d===n-1?' is-prev':(d<=n/2?' is-far-r':' is-far-l'))});D.forEach(function(x,k){x.classList.toggle('is-on',k===cur)})};
    var auto=function(){clearInterval(timer);if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;timer=setInterval(function(){if(!hold&&!document.hidden)show(cur+1)},5200)};
    $$('.ps__nav',box).forEach(function(b){b.addEventListener('click',function(){show(cur+ +b.dataset.dir);auto()})});
    S.forEach(function(s){s.addEventListener('click',function(){if(s.classList.contains('is-next')){show(cur+1);auto()}else if(s.classList.contains('is-prev')){show(cur-1);auto()}})});
    box.addEventListener('mouseenter',function(){hold=true});box.addEventListener('mouseleave',function(){hold=false});
    var x0=0,y0=0,on=false;
    box.addEventListener('touchstart',function(e){if(e.touches.length!==1)return;x0=e.touches[0].clientX;y0=e.touches[0].clientY;on=true;hold=true},{passive:true});
    box.addEventListener('touchend',function(e){hold=false;if(!on)return;on=false;var t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.3){var rtl=document.documentElement.dir==='rtl';show(cur+((dx<0)!==rtl?1:-1));auto()}},{passive:true});
    box.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){show(cur+1);auto()}else if(e.key==='ArrowLeft'){show(cur-1);auto()}});
    show(0);auto();
  });
  /* цена всегда на виду, пока человек настраивает тур */
  var pf=$('[data-pricefix]'),calc=$('#calc');
  if(pf&&calc){
    var pp=$('.sum__pp',calc),tot=$('.sum__total',calc),lab=$('.sum__price small',calc),inCalc=false,ppVis=false;
    var sync=function(){if(!pp)return;var v=pp.textContent;if(pf.querySelector('b').textContent!==v){pf.querySelector('b').textContent=v;pf.classList.remove('bump');void pf.offsetWidth;pf.classList.add('bump')}
      pf.querySelector('small').textContent=lab?lab.textContent:'';pf.querySelector('span').textContent=tot?tot.textContent:'';pf.classList.toggle('ask',pp.classList.contains('ask'))};
    var upd=function(){var on=inCalc&&!ppVis&&pp&&pp.textContent;pf.classList.toggle('is-on',!!on);document.body.classList.toggle('has-pricefix',!!on)};
    if(pp){new MutationObserver(sync).observe(pp,{childList:true,characterData:true,subtree:true,attributes:true});if(tot)new MutationObserver(sync).observe(tot,{childList:true,characterData:true,subtree:true})}
    sync();
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){inCalc=es[0].isIntersecting;upd()},{rootMargin:'-18% 0px -18% 0px'}).observe($('.calc__grid',calc)||calc);
      if(pp)new IntersectionObserver(function(es){ppVis=es[0].isIntersecting;upd()},{threshold:0.9}).observe(pp);
    }
  }
})();
/* 12.11-2: пошаговый калькулятор */
(function(){
  var $=function(q,r){return (r||document).querySelector(q)},$$=function(q,r){return [].slice.call((r||document).querySelectorAll(q))};
  var form=$('form[data-wz]');if(!form)return;
  var grid=$('.calc__grid',form),T=form.dataset.wz.split('|'),cur=0,steps=[];
  /* если у групповых туров цены нет, а у индивидуальных есть — сразу показываем индивидуальный, чтобы цена была видна */
  try{var D=JSON.parse($('#calc-data').textContent).program,hasG=Object.keys(D.group||{}).length,hasP=Object.keys(D['private']||{}).length;
    if(!hasG&&hasP){var mp=$('#m-private',form);if(mp&&!mp.checked){mp.checked=true;mp.dispatchEvent(new Event('change',{bubbles:true}))}}}catch(e){}
  form.classList.add('wiz');
  var bar=document.createElement('div');bar.className='wz';
  bar.innerHTML='<div class="wz__top"><span class="wz__n"></span><div class="wz__dots"></div></div>';
  grid.parentNode.insertBefore(bar,grid);
  var nav=document.createElement('div');nav.className='wz__nav';
  nav.innerHTML='<button type="button" class="wz__back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 5l-7 7 7 7"/></svg><span></span></button><p class="wz__done" hidden></p><button type="button" class="btn btn--red wz__next"><span></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5l7 7-7 7"/></svg></button>';
  grid.parentNode.insertBefore(nav,grid.nextSibling);
  var bBack=$('.wz__back',nav),bNext=$('.wz__next',nav),done=$('.wz__done',nav),nEl=$('.wz__n',bar),dots=$('.wz__dots',bar);
  $('span',bBack).textContent=T[2];$('span',bNext).textContent=T[3];done.textContent=T[4];
  var render=function(){
    steps=$$(':scope > fieldset',grid).filter(function(f){return !f.hidden});
    if(cur>steps.length-1)cur=steps.length-1;if(cur<0)cur=0;
    $$(':scope > fieldset',grid).forEach(function(f){f.classList.toggle('is-step',f===steps[cur])});
    nEl.textContent=T[0]+' '+(cur+1)+' '+T[1]+' '+steps.length;
    if(dots.children.length!==steps.length){dots.innerHTML='';steps.forEach(function(_,i){var b=document.createElement('button');b.type='button';b.setAttribute('aria-label',T[0]+' '+(i+1));b.addEventListener('click',function(){cur=i;render()});dots.appendChild(b)})}
    [].forEach.call(dots.children,function(b,i){b.className=i===cur?'is-on':i<cur?'is-done':''});
    bBack.style.visibility=cur===0?'hidden':'visible';
    var last=cur===steps.length-1;bNext.hidden=last;done.hidden=!last;form.classList.toggle('wiz-last',last);
    window.dispatchEvent(new Event('resize'));
  };
  bBack.addEventListener('click',function(){cur--;render()});
  bNext.addEventListener('click',function(){cur++;render();var y=form.getBoundingClientRect().top+scrollY-110;if(Math.abs(scrollY-y)>260&&innerWidth<981)window.scrollTo({top:y,behavior:'smooth'})});
  form.addEventListener('change',function(e){if(e.target.name==='mode'){cur=0;setTimeout(render,40)}else setTimeout(render,40)});
  render();
})();
