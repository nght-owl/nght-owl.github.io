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
    .map(pair => pair.split(':')),
  loadedUnits: [],
  unitsData: {},
  unitsPromise: null,
  userPreferences: []
};

locale.updateUserPreference = function() {
  const fromLocalStorage = localStorage.getItem('language');
  const preferences = [];
  
  if(fromLocalStorage)
    preferences.push(fromLocalStorage.toLowerCase());
  
  preferences.concat(
    (navigator.languages || [navigator.language])
    .map(value => value.toLowerCase())
  );
  
  locale.userPreferences = preferences;
  return preferences;
};

locale.reloadUnit = async function(unit) {
  const [filename, alias] = unit;
  
  return await fetch(`/locale/${filename}.json`)
    .then((res) => res.json())
    .then((res) => {
      locale.unitsData = res;
      locale.loadedUnits.push(alias);
    });
};

locale.translateUnit = async function(unitName) {
  const memoize = {};
  const data = locale.unitsData[unitName];
  
  if(data.skip)
    return;
  
  const capitalizedUnitName = unitName[0].toUpperCase() + unitName.slice(1);
  const elements = document.querySelectorAll(`[data-i18n-${unitName}]`);
  
  for(const element of elements) {
    const key = element.dataset[`i18n${capitalizedUnitName}`];
    if(!(key in memoize)) {
      let found;
      for(let lang of locale.userPreferences) {
        while(typeof data[lang] === 'string') {
          lang = data[lang];
        }
        
        if(lang in data && key in data[lang]) {
          memoize[key] = data[lang][key];
          found = true;
          break;
        }
      }
      
      if(!found)
        memoize[key] = data['en-us'][key]; // en-us always available
    }
    
    const textPosition = element.dataset[`i18n${capitalizedUnitName}`];
    if(!textPosition)
      el.innerText = memoize[key];
    else if(textPosition === 'textContent')
      el.textContent = memoize[key];
  }
};

locale.translate = function() {
  if(locale.loadedData.length < locale.loadData.length) return;
  for(const unit of locale.loadedData)
    locale.translateUnit(unit);
};

locale.updateUserPreference();

for(const unit of locale.loadData)
  locale.unitsPromise.push(locale.reloadUnit(unit));

window.addEventListener('DOMContentLoaded', async function() {
  await Promise.all(locale.unitsPromise);
  
  const meta = locale.languagesMetadata;
  
  const selector = document.getElementById('language-selector');
  const parent   = selector.parentNode;
  const label    = parent.children[0];
  
  let vw            = window.innerWidth;
  let isDesktop     = vw > 768;
  let inActiveState = false;
  
  window.addEventListener('load', styleSelector);
  window.addEventListener('click', onClick);
  window.addEventListener('touchmove', updateActiveState, { passive: true });
  window.addEventListener('mousemove', updateActiveState);
  window.addEventListener('change', retranslate);
  
  label.innerText = meta.title[meta.value.indexOf(locale.userPreferences[0])];
  
  appendSelectorLanguages();
  styleSelector();
  
  function appendSelectorLanguages() {
    const template = document.createElement('label');
    template.className = 'language-selector__label';
    
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'locale__language';
    radio.style.display = 'none';
    
    const title = document.createElement('span');
    template.append(radio, title);
    
    const values = meta.value;
    const titles = meta.title;
    const len = values.length;
    let clone;
    for(let i = 0; i < len; ++i) {
      clone = template.clone(true);
      clone.children[0].value = values[i];
      clone.children[1].innerText = titles[i];
      selector.appendChild(clone);
    }
  }
  
  function styleSelector() {
    
  }
  
  function retranslate(ev) {
    const el = ev.target || ev.srcElement;
    
    const fromLocalStorage = localStorage.getItem('language');
    if(fromLocalStorage)
      locale.userPreferences[0] = el.value;
    else
      locale.userPreferences.unshift(el.value);
    
    localStorage.setItem('language', el.value);
    label.innerText = meta.title[meta.value.indexOf(el.value)];
    
    locale.tanslate();
  }
  
  function onClick(ev) {
    updateActiveState(ev);
  }
  
  function updateActiveState(ev) {
    const el = ev.target || ev.srcElement;
    
    if((el.parentNode && el.parentNode === selector) || el === label || el === parent) {
      inActiveState = true;
      
      if(event.type !== 'click') return;
      selector.style.display = 'grid';
      selector.style.maxHeight = 'min(50vh, 400px)';
    } else {
      inActiveState = false;
      
      if(event.type !== 'click') return;
      selector.style.display = 'none';
      selector.style.maxHeight = '0';
    }
  }
});

window.addEventListener('languagechange', function() {
  if(localStorage.getItem('language'))
    return;
  
  locale.updateUserPreference();
  locale.translate();
});