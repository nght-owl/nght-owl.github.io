/****
 * 
 * NOTE!
 * Warning to anyone who reads this.
 * 
 * This file's code is fragile as fuck!
 * It works, but it's not robust.
 * 
 */

const locale = {
  languagesMetadata: {
    value: ['en-us', 'en-br', 'id-id'],
    title: ['English (US)', 'English (British)', 'Indonesian']
  },
  loadData:
    ['base:global', ...document.currentScript.dataset.i18nAdd.split(',') || []]
    .map(pair => [pair.split(':')]),
  userPreferences: []
};

locale.updateUserPreference = () => {
  const fromLocalStorage = localStorage.getItem('language');
  
  if(fromLocalStorage)
    locale.userPreferences = [fromLocalStorage];
  else
    locale.userPreferences = (navigator.languages || [navigator.language])
      .map(value => value.toLowerCase());
  
  return locale.userPreferences;
};

locale.updateUserPreference();

locale.translateUnit = async(unit) => {
  
}

locale.reloadUnit = async(unit) => {
  
}

// REFACTOR. OLD CODE;

const languageList = ['en-us', 'en-br', 'id-id'];
const languageName = ['English (US)', 'English (British)', 'Indonesian'];

const sourceMap = {};
const sources = ['base:global', ...document.currentScript.dataset.i18nAdd.split(',') || []];

const translateIDs = [];
let languages =
    localStorage.getItem('language')
    ? [localStorage.getItem('language')]
    : (navigator.languages || [navigator.language]).map(t => t.toLowerCase());

function translate(sourceID) {
  const map = {};
  const json = sourceMap[sourceID];
  if(json.skip) return;
  
  const elements = document.querySelectorAll(`[data-i18n-${sourceID}]`);
  let lang = null;
  for(let i = 0; i < languages.length; i++) {
    if(languages[i] in json) {
      lang = languages[i];
      break;
    }
  }
  
  while(typeof json[lang] === 'string')
    lang = json[lang];
    // FIX: Alias
  
  const translates = json[lang];
  
  if(!translates) {
    console.info(`'${lang}' translation for unit ${sourceID} wasn't found`);
    return;
  }
  
  for(const el of elements) {
    const key = el.dataset[`i18n${sourceID[0].toUpperCase() + sourceID.slice(1)}`];
    if(!(key in map)) {
      map[key] = json.keys.indexOf(key);
    }
    
    el.innerText = translates[map[key]];
  }
}

function translateAll() {
  if(translateIDs.length < sources.length) return;
  for(const id of translateIDs)
    translate(id);
}

for(let src of sources) {
  const [name, id] = src.split(':');
  src = `/locale/${name}.json`;
  
  sourceMap[id] = {};
  fetch(src)
  .then((res) => res.json())
  .then((json) => sourceMap[id] = json)
  .then(() => translateIDs.push(id))
  .then(translateAll);
}

window.addEventListener('DOMContentLoaded', function() {
  translateAll();
  // Translate before styles applies, after HTML parsed.
  
  const languageSelector = document.getElementById('language-selector');
  const lsParent = languageSelector.parentNode;
  const lsLabel = lsParent.children[0];
  let vw = innerWidth;
  let isDesktop = vw > 768;
  let lsActive = false;
  let clickCount = 0;
  
  lsLabel.innerText = languageName[languageList.indexOf(languages[0])]
  
  function styleSelector() {
    // Calculate initial rects
    const parentRect = r /* alias */ = lsParent.getBoundingClientRect();
    let selfRect = languageSelector.getBoundingClientRect();
    
    // Add styles to languageSelector
    let minWidth = r.width;
    let maxWidth = r.width + 'px';
    let right = '50px';
    
    if(isDesktop) {
      minWidth = Math.max(500, 3 * r.width);
      maxWidth = '100%';
      right = ((vw - r.right) + (r.width / 2) - (selfRect.width / 2)) + 'px';
    }
    
    languageSelector.style = `
      overflow: hidden;
      position: fixed;
      display: ${lsActive ? 'grid' : 'none'};
      grid-template-columns: ${isDesktop ? '1fr 1fr 1fr' : '1fr'};
      ${isDesktop ? 'text-align: center;' : ''}
      background-color: var(--secondary-color);
      transition: max-height 0.5s ease-in-out;
      border-radius: 0.5rem;
      min-width: ${minWidth}px;
      max-width: ${maxWidth};
      max-height: ${lsActive ? 'min(50vh, 400px)' : '0'};
      height: min-content;
      padding: 1rem;
      right: ${right};
      top: calc(${r.bottom}px + 1rem);
      gap: ${isDesktop ? 1 : 0.5}rem;
    `;
    
    if(isDesktop) {
      selfRect = languageSelector.getBoundingClientRect();
      languageSelector.style.right = ((vw - r.right) + (r.width / 2) - (selfRect.width / 2)) + 'px';
      
      // If current position + width overflows the device width.
      selfRect = languageSelector.getBoundingClientRect();
      if(selfRect.right > vw) {
        languageSelector.style.right = '1rem';
      }
    }
  }
  
  styleSelector();
  
  window.addEventListener('load', styleSelector);
  
  function checkIntegrity(ev) {
    const el = ev.target || ev.srcElement;
    
    let stopAnimation = false;
    if((el.parentNode && el.parentNode === languageSelector) || el === lsLabel || el === lsParent) {
      lsActive = true;
      if(event.type !== 'click') return;
      languageSelector.style.display = 'grid';
      languageSelector.style.maxHeight = 'min(50vh, 400px)';
      
      // Tween (shit doesn't work)
      let start = null;
      const maxHeight = Math.min(0.40 * innerHeight, 400);
      const durationMs = 500;
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
      function animate(timestamp) {
        if(!start) start = timestamp;
        
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / durationMs, 1);
        const eased = easeOutCubic(progress);
        languageSelector.style.maxHeight = (maxHeight * eased) + 'px';
        
        if(progress == 1) languageSelector.style.maxHeight = maxHeight + 'px';
        else if(!stopAnimation) requestAnimationFrame(animate);
      }
      
      requestAnimationFrame(animate);
    } else {
      lsActive = false;
      stopAnimation = true;
      if(event.type !== 'click') return;
      languageSelector.style.display = 'none';
      languageSelector.style.maxHeight = '0';
    }
  }
  
  window.addEventListener('click', function(ev) {
    if(clickCount === 0) styleSelector();
    clickCount++;
    checkIntegrity(ev);
  });
  window.addEventListener('touchstart', checkIntegrity, { passive: true });
  window.addEventListener('mousedown', checkIntegrity);
  
  languageSelector.addEventListener('change', function(ev) {
    languages = [ev.srcElement.value];
    localStorage.setItem('language', languages[0])
    lsLabel.innerText = languageName[languageList.indexOf(languages[0])];
    translateAll();
    // Retranslate when user language setting changes
  });
  
  // Add languages list, don't hardcode this to the HTML.
  const template = document.createElement('label');
  template.className = 'language-selector__label';
  
  {
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'language';
    input.value = '';
    input.style.display = 'none';
    
    const text = new Text('');
    template.append(input, text);
  }
  
  for(const index in languageList) {
    const clone = template.cloneNode(true);
    clone.childNodes[0].value = languageList[index];
    clone.childNodes[1].data = languageName[index];
    languageSelector.appendChild(clone);
  }
  
  window.addEventListener('resize', function() {
    isDesktop = (vw = innerWidth) > 768;
    styleSelector();
  });
});

window.addEventListener('languagechange', function() {
  if(localStorage.getItem('language')) return;
  languages = navigator.languages
    || [navigator.language].map(t => t.toLowerCase());
  translateAll();
});