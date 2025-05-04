window.addEventListener('DOMContentLoaded', function() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  toggle.addEventListener('click', function() {
    menu.classList.toggle('nav__menu--active');
  });
  
  const navMenu = document.getElementById('nav-menu');
  let activeMenu = navMenu.getElementsByClassName('nav__item--active')[0].children[0];
  
  window.openNav = function openNav(el) {
    activeMenu.parentNode.classList.remove('nav__item--active');
    el.parentNode.classList.add('nav__item--active');
    
    activeMenu = el;
  }
  
  navMenu.addEventListener('click', function() {
    const el = ev.srcElement;
    if(el === activeMenu) return;
    
    openNav(el);
  });
});