(function(){var s=document.querySelector('.screen'),p=document.querySelector('.post'),P=window.POSTS||[];
document.querySelectorAll('.k').forEach(function(k){k.addEventListener('click',function(){var x=P[+k.dataset.i];p.querySelector('figure img').src=x.b;p.querySelector('p span').textContent=x.t;p.classList.add('an');p.scrollTop=0})});
p.querySelector('header button').addEventListener('click',function(){p.classList.remove('an')});
(function(){var R=[].slice.call(document.querySelectorAll('.rv'));if(!('IntersectionObserver' in window)){R.forEach(function(e){e.classList.add('da')});return}
var io=new IntersectionObserver(function(E){E.forEach(function(x){if(x.isIntersecting){x.target.classList.add('da');io.unobserve(x.target)}})},{rootMargin:'0px 0px -6% 0px'});R.forEach(function(e){io.observe(e)})})();
document.querySelectorAll('[data-ansicht]').forEach(function(b){b.addEventListener('click',function(){var h=b.dataset.ansicht==='heute';s.classList.toggle('heute',h);document.querySelectorAll('[data-ansicht]').forEach(function(c){c.setAttribute('aria-pressed',c===b)});s.scrollTop=0})});
var n=document.querySelector('[data-nr]');if(n)n.addEventListener('click',function(){var an=n.getAttribute('aria-pressed')!=='true';n.setAttribute('aria-pressed',an);s.classList.toggle('nummern',an);n.textContent=an?'Nummern ausblenden':'Nummern zeigen'})})();
