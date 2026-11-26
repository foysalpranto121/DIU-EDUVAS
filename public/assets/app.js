var ENDPOINT = (window.EDUVAS_ENDPOINT || "").trim();

(function(){
  var step=0, N=4, state={leads:2, stars:0, exp:''};
  var panes=[].slice.call(document.querySelectorAll('.pane'));
  var sts=[].slice.call(document.querySelectorAll('.st'));
  var $=function(id){return document.getElementById(id)};
  var SKEY='eduvas_diu_draft_v1';
  var RAIN=['#0763B5','#1E9E98','#FF8A00','#7B5CF5','#E8265F','#0B8457','#D9480F'];
  [].forEach.call(document.querySelectorAll('.chip'),function(c,i){c.style.setProperty('--cc',RAIN[i%RAIN.length])});

  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function buzz(ms){ try{ if(navigator.vibrate && !reduce) navigator.vibrate(ms||12); }catch(e){} }

  /* floating emoji */
  if(!reduce){
    var fl=$('floaties'),em=['🎓','📚','🏫','✏️','🚀','💡','⭐','🎒'];
    em.forEach(function(e,i){var d=document.createElement('span');d.className='floaty';d.textContent=e;
      d.style.left=(5+i*12)+'%';d.style.animationDuration=(18+(i%4)*6)+'s';d.style.animationDelay=(-i*3.3)+'s';fl.appendChild(d)});
  }

  /* rotating headline word */
  var words=[['school','#E8265F'],['college','#FF8A00'],['madrasa','#7B5CF5'],['coaching centre','#1E9E98'],['university','#0763B5'],['training institute','#D9480F']],wi=0;
  setInterval(function(){wi=(wi+1)%words.length;var r=$('rot');r.textContent=words[wi][0];r.style.background=words[wi][1]},2200);

  var coach=["Hi! Let's build your Referrer Pass. Watch it fill up as you type ⬆️",
    "Nice! 🎉 Now tell us who you know. Every school, college or coaching centre counts.",
    "Almost there! Experience is a bonus, not a must. First-timers welcome 💪",
    "Last step! Check your details and launch 🚀"];

  /* ---------- helpers ---------- */
  function normPhone(v){var d=String(v||'').replace(/\D/g,'');if(d.indexOf('880')===0)d=d.slice(2);if(d.length===10&&d[0]==='1')d='0'+d;return d}
  function okPhone(v){return /^01[3-9]\d{8}$/.test(normPhone(v))}
  function okEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim())}
  function chipGroup(name){return document.querySelector('.chips[data-name="'+name+'"]')}
  function chipVals(name){
    var g=chipGroup(name); if(!g) return '';
    return [].map.call(g.querySelectorAll('.chip.on'),function(c){return c.textContent.replace(/^[^\w]+\s*/,'').trim()}).join(', ');
  }
  function makeCode(name,phone){
    var n=(String(name||'').trim().split(/\s+/)[0]||'').replace(/[^A-Za-z0-9]/g,'').toUpperCase().slice(0,10);
    return 'EDU-'+(n||'STUDENT')+'-'+String(phone||'').slice(-4);
  }

  /* ---------- live pass card ---------- */
  function updatePass(){
    var n=$('name').value.trim(), d=$('dept').value, u=$('university').value.trim()||'Daffodil International University';
    $('pName').textContent=n||'Your name here';
    $('pDept').textContent=(d?d.replace(/\s*\(.*\)/,''):'Department')+' · '+u;
    var ini=n?n.split(/\s+/).map(function(w){return w[0]}).join('').slice(0,2).toUpperCase():'?';
    $('av').textContent=ini;

    var ph=normPhone($('phone').value);
    var cEl=$('passCode'), cBox=$('passCodeBox');
    if(n && ph.length>=4){ cEl.textContent=makeCode(n,ph); cBox.classList.add('live'); }
    else { cEl.textContent='EDU-••••-••••'; cBox.classList.remove('live'); }

    var checks=[n, okPhone($('phone').value), d, chipVals('year'), okEmail($('email').value),
      chipVals('why'), chipVals('inst'), chipVals('conn'), $('district').value.trim(),
      state.exp, state.stars, chipVals('social'), chipVals('hours'), chipVals('contactPref')];
    var got=checks.filter(Boolean).length, p=Math.round(got/checks.length*100);
    $('pct').textContent=p+'%'; $('meter').style.width=p+'%';
    var b=[!!(n&&checks[1]&&d), !!(chipVals('inst')&&state.leads>0), state.exp==='Yes', state.stars>=4];
    b.forEach(function(v,i){$('bg'+(i+1)).classList.toggle('got',v)});
    $('lvl').textContent = p>=90?'🏆 Legend':p>=65?'🔥 Pro':p>=35?'⚡ Rising':'🌱 Rookie';
  }

  /* ---------- inline success ticks ---------- */
  function markGood(){
    [['name',  function(){return $('name').value.trim().length>1}],
     ['phone', function(){return okPhone($('phone').value)}],
     ['email', function(){return okEmail($('email').value)}],
     ['dept',  function(){return !!$('dept').value}],
     ['university', function(){return $('university').value.trim().length>1}]
    ].forEach(function(p){
      var el=$(p[0]); if(!el) return;
      var f=el.closest('.f'); if(!f) return;
      f.classList.toggle('good', !!p[1]() && !f.classList.contains('bad'));
    });
  }

  /* create the inline success ticks once */
  ['name','phone','email','dept','university'].forEach(function(id){
    var el=$(id); if(!el) return;
    var f=el.closest('.f'); if(!f || f.querySelector('.tick')) return;
    var s=document.createElement('span'); s.className='tick'; s.textContent='\u2713'; f.appendChild(s);
  });

  function refresh(){ updatePass(); markGood(); saveDraft(); }
  document.addEventListener('input', function(){ setTimeout(refresh,0) });
  document.addEventListener('change',function(){ setTimeout(refresh,0) });

  /* ---------- chips ---------- */
  [].forEach.call(document.querySelectorAll('.chips'),function(g){
    var single=g.hasAttribute('data-single');
    g.addEventListener('click',function(e){
      var c=e.target.closest('.chip'); if(!c) return;
      if(single){[].forEach.call(g.children,function(x){if(x!==c)x.classList.remove('on')});}
      c.classList.toggle('on'); buzz(10);
      var f=g.closest('.f'); if(f) f.classList.remove('bad');
      refresh();
    });
  });

  /* ---------- yes / no ---------- */
  var yn=document.querySelector('.yn');
  yn.addEventListener('click',function(e){
    var b=e.target.closest('button'); if(!b) return;
    [].forEach.call(yn.children,function(x){x.classList.toggle('on',x===b)});
    state.exp=b.getAttribute('data-v'); buzz(10);
    $('expBox').classList.toggle('show',state.exp==='Yes');
    yn.closest('.f').classList.remove('bad');
    refresh();
  });

  /* ---------- slider ---------- */
  $('leads').addEventListener('input',function(){
    state.leads=+this.value;
    $('leadsV').textContent=(this.value==10?'10+':this.value);
    refresh();
  });

  /* ---------- stars ---------- */
  var starWords=['','Still learning','Okay','Good','Very good','Excellent, I can sell anything!'];
  var sb=[].slice.call($('stars').children);
  sb.forEach(function(b,i){
    b.addEventListener('click',function(){
      state.stars=i+1; buzz(12);
      sb.forEach(function(x,j){x.classList.toggle('on',j<=i)});
      $('starsLbl').textContent=starWords[i+1];
      refresh();
    });
  });

  /* ---------- phone tidy + live duplicate pre-check ---------- */
  $('phone').addEventListener('input',function(){this.value=this.value.replace(/[^\d+\- ]/g,'')});
  var checkTimer;
  function softCheck(){
    if(!ENDPOINT) return;
    var phone=normPhone($('phone').value), email=$('email').value.trim().toLowerCase();
    if(!okPhone(phone) && !okEmail(email)) return;
    clearTimeout(checkTimer);
    checkTimer=setTimeout(function(){
      post({action:'check', phone:phone, email:email}).then(function(r){
        if(!r || !r.duplicate) return;
        var id = r.field==='email' ? 'email' : 'phone';
        var f=$(id).closest('.f');
        var err=f.querySelector('.err');
        if(err) err.textContent=r.message||'Already registered.';
        f.classList.add('bad'); f.classList.remove('good');
      }).catch(function(){ /* silent: this is only a convenience check */ });
    },600);
  }
  $('phone').addEventListener('blur',softCheck);
  $('email').addEventListener('blur',softCheck);

  /* ---------- clear errors while typing ---------- */
  [].forEach.call(document.querySelectorAll('input,select,textarea'),function(el){
    ['input','change'].forEach(function(ev){
      el.addEventListener(ev,function(){var f=el.closest('.f');if(f)f.classList.remove('bad')});
    });
  });

  /* ---------- validation ---------- */
  var DEFAULT_ERR={};
  [].forEach.call(document.querySelectorAll('.err'),function(e,i){ e.setAttribute('data-def', e.textContent); });
  function resetErr(f){ var e=f.querySelector('.err'); if(e && e.getAttribute('data-def')) e.textContent=e.getAttribute('data-def'); }

  function validate(i){
    var ok=true;
    [].forEach.call(panes[i].querySelectorAll('.f'),function(f){
      var t=f.getAttribute('data-type'), req=f.hasAttribute('data-req'), bad=false;
      var el=f.querySelector('input,select,textarea');
      resetErr(f);
      if(t==='chips'){ bad=req&&!chipVals(f.getAttribute('data-for')); }
      else if(t==='yn'){ bad=req&&!state.exp; }
      else if(t==='phone'){ bad=!okPhone(el.value); }
      else if(t==='email'){ bad=!okEmail(el.value); }
      else if(req&&el){ bad=!el.value.trim(); }
      f.classList.toggle('bad',bad); if(bad) ok=false;
    });
    if(!ok){
      buzz([30,40,30]);
      var first=panes[i].querySelector('.f.bad');
      if(first){var y=first.getBoundingClientRect().top+window.pageYOffset-120;window.scrollTo({top:y,behavior:'smooth'})}
    }
    return ok;
  }

  /* ---------- collect ---------- */
  function collect(){
    return {
      name:$('name').value.trim(), phone:normPhone($('phone').value), email:$('email').value.trim(),
      university:$('university').value.trim(), department:$('dept').value, studentId:$('sid').value.trim(),
      year:chipVals('year'), why:chipVals('why'), institutions:chipVals('inst'),
      expectedReferrals:state.leads>=10?'10+':String(state.leads), connection:chipVals('conn'),
      district:$('district').value.trim(), heardFrom:$('heard').value,
      experience:state.exp||'', experienceType:state.exp==='Yes'?chipVals('expType'):'',
      experienceDetails:state.exp==='Yes'?$('expDesc').value.trim():'',
      commSkill:state.stars?state.stars+'/5':'', social:chipVals('social'), hoursPerWeek:chipVals('hours'),
      contactPref:chipVals('contactPref'), note:$('note').value.trim()
    };
  }

  var labels=[['name','Name'],['phone','Phone'],['email','Email'],['university','University'],['department','Department'],['studentId','Student ID'],['year','Year'],['why','Why joining'],['institutions','Can reach'],['expectedReferrals','Referrals (3 months)'],['connection','Connection'],['district','Home district'],['heardFrom','Heard from'],['experience','Prior experience'],['experienceType','Experience type'],['experienceDetails','Details'],['commSkill','Communication'],['social','Active on'],['hoursPerWeek','Time / week'],['contactPref','Contact via'],['note','Notes']];
  function renderReview(){
    var d=collect(), box=$('review'); box.textContent='';
    labels.forEach(function(p){
      if(!d[p[0]]) return;
      var r=document.createElement('div');r.className='row';
      var k=document.createElement('div');k.className='k';k.textContent=p[1];
      var v=document.createElement('div');v.className='v';v.textContent=d[p[0]];
      r.appendChild(k);r.appendChild(v);box.appendChild(r);
    });
  }

  /* ---------- draft save / restore ---------- */
  var IDS=['name','phone','email','university','dept','sid','district','heard','expDesc','note'];
  var GROUPS=['year','why','inst','conn','expType','social','hours','contactPref'];
  function saveDraft(){
    try{
      var v={}; IDS.forEach(function(id){ var e=$(id); if(e) v[id]=e.value; });
      var ch={}; GROUPS.forEach(function(g){
        var el=chipGroup(g); if(!el) return;
        ch[g]=[].map.call(el.querySelectorAll('.chip.on'),function(c){return c.textContent});
      });
      localStorage.setItem(SKEY, JSON.stringify({v:v,ch:ch,exp:state.exp,leads:state.leads,stars:state.stars,step:step,t:Date.now()}));
    }catch(e){}
  }
  function clearDraft(){ try{ localStorage.removeItem(SKEY) }catch(e){} }
  function readDraft(){
    try{
      var raw=localStorage.getItem(SKEY); if(!raw) return null;
      var d=JSON.parse(raw);
      if(!d || !d.t || (Date.now()-d.t) > 1000*60*60*24*7) return null;
      if(!d.v || !String(d.v.name||'').trim()) return null;
      return d;
    }catch(e){ return null }
  }
  function applyDraft(d){
    IDS.forEach(function(id){ var e=$(id); if(e && d.v[id]!==undefined) e.value=d.v[id]; });
    GROUPS.forEach(function(g){
      var el=chipGroup(g), want=(d.ch&&d.ch[g])||[];
      if(!el) return;
      [].forEach.call(el.querySelectorAll('.chip'),function(c){ c.classList.toggle('on', want.indexOf(c.textContent)>-1) });
    });
    if(d.exp){
      state.exp=d.exp;
      [].forEach.call(yn.children,function(x){x.classList.toggle('on',x.getAttribute('data-v')===d.exp)});
      $('expBox').classList.toggle('show',d.exp==='Yes');
    }
    if(typeof d.leads==='number'){ state.leads=d.leads; $('leads').value=d.leads; $('leadsV').textContent=(d.leads>=10?'10+':d.leads); }
    if(typeof d.stars==='number' && d.stars>0){
      state.stars=d.stars;
      sb.forEach(function(x,j){x.classList.toggle('on',j<=d.stars-1)});
      $('starsLbl').textContent=starWords[d.stars];
    }
    refresh();
    go(Math.min(d.step||0, N-1));
    toast('Welcome back — your answers were restored ✓');
  }

  /* ---------- steps ---------- */
  function scrollToCard(){var y=$('card').getBoundingClientRect().top+window.pageYOffset-12;window.scrollTo({top:y,behavior:'smooth'})}
  function go(i){
    step=i;
    panes.forEach(function(p,j){p.classList.toggle('show',j===i)});
    sts.forEach(function(s,j){s.classList.toggle('active',j===i);s.classList.toggle('past',j<i)});
    $('prog').style.width=((i+1)/N*100)+'%';
    $('rocket').style.left=((i+1)/N*100)+'%';
    $('card').setAttribute('data-t',i);
    $('say').textContent=coach[i];
    $('back').style.visibility=i?'visible':'hidden';
    $('count').textContent='Step '+(i+1)+' of '+N;
    var n=$('next');
    if(i===N-1){renderReview();n.textContent='Submit 🚀';n.classList.add('submit');}
    else{n.textContent='Next →';n.classList.remove('submit');}
    saveDraft(); scrollToCard();
  }
  sts.forEach(function(s,j){
    s.style.cursor='pointer';
    s.addEventListener('click',function(){ if(j<step) go(j); });
  });
  $('back').addEventListener('click',function(){if(step>0)go(step-1)});
  $('next').addEventListener('click',onNext);
  function onNext(){
    if(step<N-1){ if(validate(step)) { buzz(14); go(step+1); } return; }
    if(!$('agree').checked){$('agreeF').classList.add('bad');buzz([30,40,30]);return;}
    $('agreeF').classList.remove('bad');
    submit(collect());
  }
  $('agree').addEventListener('change',function(){$('agreeF').classList.remove('bad')});

  /* Enter advances, except inside a textarea */
  document.addEventListener('keydown',function(e){
    if(e.key!=='Enter') return;
    if(e.target && e.target.tagName==='TEXTAREA') return;
    if($('done').classList.contains('show')) return;
    e.preventDefault(); onNext();
  });

  /* ---------- network ---------- */
  function post(payload){
    if(!ENDPOINT) return Promise.reject(new Error('no endpoint'));
    return fetch(ENDPOINT,{
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'}, /* text/plain avoids a CORS preflight */
      body:JSON.stringify(payload),
      redirect:'follow'
    }).then(function(r){
      if(!r.ok) throw new Error('HTTP '+r.status);
      return r.json();
    });
  }

  var lastPayload=null;
  function submit(d){
    lastPayload=d;
    var btn=$('next');
    btn.disabled=true; btn.textContent='Submitting…';
    $('sending').classList.add('show');
    $('warn').classList.remove('show');

    if(!ENDPOINT){
      setTimeout(function(){
        $('sending').classList.remove('show');
        finish(d, makeCode(d.name,d.phone), true);
      },700);
      return;
    }

    post(d).then(function(res){
      $('sending').classList.remove('show');
      if(!res || res.success!==true){
        btn.disabled=false; btn.textContent='Submit 🚀';
        showWarn((res&&res.message)||'Registration could not be completed.', !!(res&&res.duplicate));
        return;
      }
      clearDraft();
      finish(d,res.code,false);
    }).catch(function(err){
      $('sending').classList.remove('show');
      btn.disabled=false; btn.textContent='Submit 🚀';
      showWarn('Could not reach the server. Check your internet and try again.', false);
    });
  }

  function showWarn(msg,isDup){
    var w=$('warn');
    w.textContent='';
    var p=document.createElement('div'); p.textContent=msg; w.appendChild(p);
    if(!isDup){
      var b=document.createElement('button'); b.type='button'; b.textContent='Try again';
      b.addEventListener('click',function(){ if(lastPayload) submit(lastPayload) });
      w.appendChild(b);
    }
    w.classList.add('show');
    var y=w.getBoundingClientRect().top+window.pageYOffset-140;
    window.scrollTo({top:y,behavior:'smooth'});
    buzz([30,40,30]);
  }

  /* ---------- success ---------- */
  function finish(d,code,demo){
    $('form').style.display='none';
    document.querySelector('.steps').style.display='none';
    document.querySelector('.bar').style.display='none';
    $('warn').classList.remove('show');
    $('dName').textContent=d.name.split(/\s+/)[0];
    $('dCode').textContent=code;
    $('demo').style.display=demo?'block':'none';
    $('done').classList.add('show');
    buildShare(code);
    scrollToCard();
    confetti();
  }

  function buildShare(code){
    var url=location.href.split('#')[0];
    var msg='I just joined the Eduvas Affiliate Referral Campaign at DIU! 🎓🚀\nMy referral code: '+code+'\nJoin here: '+url;
    $('shWa').onclick=function(){ window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank','noopener') };
    $('shFb').onclick=function(){ window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url),'_blank','noopener') };
    $('shCp').onclick=function(){ copy(msg,'Message copied ✓') };
  }
  function copy(text,okMsg){
    try{
      navigator.clipboard.writeText(text).then(function(){toast(okMsg||'Copied ✓')},function(){toast(text)});
    }catch(e){ toast(text) }
  }
  $('copy').addEventListener('click',function(){ copy($('dCode').textContent,'Code copied ✓') });

  function toast(m){var t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove('show')},2800)}

  /* ---------- confetti ---------- */
  function confetti(){
    if(reduce) return;
    var c=$('cf'); if(!c || !c.getContext) return;
    var x=c.getContext('2d'); if(!x) return;
    var W=c.width=innerWidth,H=c.height=innerHeight;
    var cols=['#0763B5','#2AA9A3','#E8262B','#FFB020','#7B5CF5','#F2557A'],ps=[];
    for(var i=0;i<160;i++)ps.push({x:Math.random()*W,y:-20-Math.random()*H*.5,r:4+Math.random()*6,c:cols[i%6],vx:-2+Math.random()*4,vy:2+Math.random()*4,a:Math.random()*6,va:-.2+Math.random()*.4});
    var t0=Date.now();
    (function f(){
      x.clearRect(0,0,W,H);
      ps.forEach(function(p){p.x+=p.vx;p.y+=p.vy;p.vy+=.05;p.a+=p.va;x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.c;x.fillRect(-p.r/2,-p.r/2,p.r,p.r*.6);x.restore()});
      if(Date.now()-t0<4000)requestAnimationFrame(f);else x.clearRect(0,0,W,H);
    })();
  }

  /* ---------- boot ---------- */
  refresh();
  var draft=readDraft();
  if(draft){
    var r=$('resume');
    r.classList.add('show');
    $('resumeYes').onclick=function(){ r.classList.remove('show'); applyDraft(draft); };
    $('resumeNo').onclick=function(){ r.classList.remove('show'); clearDraft(); };
  }
})();
