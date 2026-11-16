(function(){var h=document.querySelector('#feed .fb-h');if(!h)return;
var e=h.querySelector('.fb-h__e'),f=null,warte=0;
function mass(){if(f){var k=e.clientWidth/393;f.style.height=(e.clientHeight/k).toFixed(2)+'px';f.style.transform='scale('+k.toFixed(5)+')'}}
function zeig(x){if(x!==f||x.classList.contains('da'))return;clearTimeout(warte);x.classList.add('da');e.classList.remove('laedt');e.classList.add('live')}
function baue(){if(f)return f;var x=document.createElement('iframe');x.title='Instagram des Hauses als Idee';x.tabIndex=-1;
x.onload=function(){try{var d=x.contentDocument,st=d.createElement('style');
st.textContent='html,body{margin:0!important;padding:0!important;overflow:hidden!important;background:#000!important}.wer,.u,.kap{display:none!important}.stage{display:block!important;padding:0!important;margin:0!important;min-height:0!important;max-width:none!important}.devwrap{position:fixed!important;left:0!important;top:0!important;margin:0!important}#device{width:393px!important;height:100vh!important;padding:0!important;margin:0!important;border-radius:0!important;box-shadow:none!important}.screen{border-radius:0!important}.island{display:none!important}.rv{opacity:1!important;transform:none!important}';
d.head.appendChild(st)}catch(q){}x.__ok=1;if(e.classList.contains('laedt'))setTimeout(function(){zeig(x)},80)};
f=x;x.src='feed/index.html';e.appendChild(x);mass();return x}
function live(){var x=baue();e.classList.add('laedt');if(x.__ok)zeig(x);else{clearTimeout(warte);warte=setTimeout(function(){zeig(x)},9000)}}
e.addEventListener('click',function(){if(!f||!f.classList.contains('da'))live()});addEventListener('resize',mass)})();
