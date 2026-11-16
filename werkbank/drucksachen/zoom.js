(function(){var z=document.querySelector('.dzoom');if(!z)return;var im=z.querySelector('img');
document.querySelectorAll('[data-zoom]').forEach(function(a){a.addEventListener('click',function(ev){ev.preventDefault();im.src=a.getAttribute('href');z.hidden=false;document.documentElement.style.overflow='hidden'})});
function zu(){z.hidden=true;document.documentElement.style.overflow=''}z.addEventListener('click',function(ev){if(ev.target!==im)zu()});addEventListener('keydown',function(ev){if(ev.key==='Escape')zu()})})();
