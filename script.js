/* ===== DGS Wizard Logic — calm & precise ===== */
(function(){
  const CALENDLY_URL = "https://calendly.com/d/wy9g-s5z3/get-to-know-call?month=2025-09";
  const root = document.querySelector('#dgs-wizard');
  if(!root) return;

  const steps   = [...root.querySelectorAll('.dgs-step')];
  const back    = root.querySelector('.dgs-quiz__back');
  const bar     = root.querySelector('.dgs-quiz__progress-bar');
  const counter = root.querySelector('.dgs-quiz__stepcount');
  const form    = root.querySelector('#leadForm');
  const msg     = root.querySelector('#formMsg');
  const submit  = root.querySelector('#submitBtn');

  let i = 0;
  let navLock = false;

  const DUR = 240;              // UI timing
  const AUTO_DELAY = 260;       // slightly slower auto-next for Adspend/Rolle

  function setProgress(){
    const pct = Math.round(i/(steps.length-1)*100);
    bar.style.setProperty('--p', pct + '%');
    counter.textContent = `Schritt ${Math.min(i+1, steps.length)}/${steps.length}`;
    back.disabled = i === 0;
  }

  function show(idx){
    if(idx === i || idx < 0 || idx >= steps.length) return;
    if(navLock) return;
    navLock = true;

    steps[i].classList.remove('is-active');
    steps[idx].classList.add('is-active');
    i = idx;
    setProgress();

    setTimeout(()=>{ navLock = false; }, DUR);
  }

  const next = () => show(i+1);
  const prev = () => show(i-1);

  /* STEP 1 – enable button when any chip is selected */
  const step1 = steps[0];
  const next1 = step1.querySelector('.dgs-next');
  function validateStep1(){
    next1.disabled = step1.querySelectorAll('input[name="topics"]:checked').length === 0;
  }
  step1.addEventListener('click', e=>{
    const chip = e.target.closest('.dgs-chip'); if(!chip) return;
    const input = chip.querySelector('input'); input.checked = !input.checked;
    validateStep1();
  });
  next1.addEventListener('click', next);

  /* STEP 2 – URL validation */
  const urlInput = root.querySelector('#url');
  const next2    = steps[1].querySelector('.dgs-next');
  function validURL(v){ try{ return !!(new URL(v)).host; }catch{ return false; } }
  function validateStep2(){
    const ok = validURL(urlInput.value.trim());
    urlInput.classList.toggle('is-error', !ok && urlInput.value.length>0);
    next2.disabled = !ok;
  }
  urlInput.addEventListener('input', validateStep2);
  next2.addEventListener('click', next);

  /* STEP 3 – goal required */
  const goal  = root.querySelector('#goal');
  const next3 = steps[2].querySelector('.dgs-next');
  function validateStep3(){
    const ok = goal.value.trim().length > 3;
    goal.classList.toggle('is-error', !ok && goal.value.length>0);
    next3.disabled = !ok;
  }
  goal.addEventListener('input', validateStep3);
  next3.addEventListener('click', next);

  /* Auto-next for radio-card steps (Adspend + Rolle) */
  steps.forEach(step=>{
    if(step.dataset.autonext === 'true'){
      step.addEventListener('click', e=>{
        const card = e.target.closest('.dgs-choice');
        if(!card || navLock) return;
        const input = card.querySelector('input[type="radio"]');
        if(!input) return;
        input.checked = true;
        // calm delay so it doesn't feel hectic
        setTimeout(()=> { if(!navLock) next(); }, AUTO_DELAY);
      });
    }
  });

  /* Rolle step is required but auto-next handles moving forward;
     no manual "Weiter" here to avoid accidental skipping. */

  /* Back */
  back.addEventListener('click', prev);

  /* UTM & Referrer */
  const params = new URLSearchParams(window.location.search);
  const setVal = (id,val)=>{ const el=root.querySelector('#'+id); if(el) el.value = val || ""; };
  setVal('utm_source',params.get('utm_source'));
  setVal('utm_medium',params.get('utm_medium'));
  setVal('utm_campaign',params.get('utm_campaign'));
  setVal('utm_content',params.get('utm_content'));
  setVal('referrer',document.referrer);

  /* Simple lead score */
  function scoreLead(){
    let score = 0;
    const ad = (form.querySelector('input[name="adspend"]:checked')||{}).value || '';
    if (ad.includes('> 50.000')) score += 40;
    else if (ad.includes('20.000–50.000')) score += 30;
    else if (ad.includes('5.000–20.000')) score += 20;
    else if (ad.includes('< 5.000')) score += 10;
    score += Math.min(20, [...form.querySelectorAll('input[name="topics"]:checked')].length * 6);
    setVal('lead_score', String(score));
  }

  /* Submit -> redirect to Calendly */
  form.addEventListener('submit', (e)=>{
    e.preventDefault();

    // simple validation for contact + role presence
    const name = root.querySelector('#name');
    const email = root.querySelector('#email');
    const consent = root.querySelector('#consent');
    const roleChosen = !!form.querySelector('input[name="role"]:checked');

    let ok = true;
    [name,email].forEach(el=>{
      const bad = !el.value.trim(); el.classList.toggle('is-error', bad); ok = ok && !bad;
    });
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    if(!emailOk){ email.classList.add('is-error'); ok = false; }
    if(!consent.checked){ ok = false; consent.focus(); }
    if(!roleChosen){ ok = false; msg.textContent = 'Bitte wähle deine Rolle aus.'; }

    if(!ok){ if(!msg.textContent) msg.textContent = 'Bitte fülle die Pflichtfelder korrekt aus.'; return; }

    // summary (optional for analytics/CRM, even if we redirect)
    const get = n => {
      const checked = form.querySelectorAll(`[name="${n}"]:checked`);
      if(checked.length) return [...checked].map(x=>x.value).join(', ');
      const el = form.querySelector(`[name="${n}"]`);
      return el && 'value' in el ? el.value : '';
    };
    setVal('summary',[
      `Themen: ${get('topics')}`,
      `URL: ${get('url')}`,
      `Ziel: ${get('goal')}`,
      `Adspend: ${get('adspend')}`,
      `Rolle: ${get('role')}`
    ].filter(Boolean).join(' • '));

    scoreLead();

    submit.disabled = true;
    submit.textContent = 'Weiter zu Calendly …';
    // Redirect to Calendly
    window.location.assign(CALENDLY_URL);
  });

  // init
  setProgress();
  validateStep1();
})();
