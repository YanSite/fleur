/* Флаувер: шаблонизатор страницы. Разметка лежит в <template> внутри <x-dc>,
   поэтому до запуска браузер её не показывает и не грузит из неё картинки. */
class DCLogic{constructor(p){this.props=p||{};this.state={}}setState(o){Object.assign(this.state,typeof o==='function'?o(this.state):o);RT.render()}}
const RT={};
function get(sc,expr){expr=expr.trim();if(expr==='true')return true;if(expr==='false')return false;let v=sc;for(const k of expr.split('.')){if(v==null)return undefined;v=v[k]}return v}
function build(tpl,sc,out){
  for(const n of tpl.childNodes){
    if(n.nodeType===3){out.push({t:'#',v:n.nodeValue.replace(/\{\{(.*?)\}\}/g,(m,e)=>{const x=get(sc,e);return x==null?'':x})});continue}
    if(n.nodeType!==1)continue;
    const tag=n.tagName.toLowerCase();
    if(tag==='sc-for'){const list=get(sc,n.getAttribute('list').slice(2,-2))||[];const as=n.getAttribute('as');list.forEach(it=>build(n,Object.assign(Object.create(sc),{[as]:it}),out));continue}
    if(tag==='sc-if'){if(get(sc,n.getAttribute('value').slice(2,-2)))build(n,sc,out);continue}
    const node={t:tag,a:{},ev:{},ref:null,c:[]};
    // Атрибут с приставкой x- (x-src) в разметке записан так, чтобы браузер не запросил «{{…}}» как адрес.
    for(const raw of n.attributes){const at={name:raw.name.replace(/^x-/,''),value:raw.value};const m=at.value.match(/^\{\{(.*?)\}\}$/);
      if(m){const v=get(sc,m[1]);if(at.name==='ref'){node.ref=v;continue}if(at.name.startsWith('on')){node.ev[at.name.slice(2).toLowerCase()]=v;continue}
        if(v===false||v==null)continue;if(v===true){node.a[at.name]='';continue}node.a[at.name]=String(v);continue}
      node.a[at.name]=at.value.replace(/\{\{(.*?)\}\}/g,(mm,e)=>{const x=get(sc,e);return x==null?'':x})}
    build(n,sc,node.c);out.push(node)}
}
function create(v){if(v.t==='#')return document.createTextNode(v.v);const el=document.createElement(v.t);patchEl(el,v,true);v.c.forEach(c=>el.appendChild(create(c)));return el}
function patchEl(el,v,fresh){
  for(const k in v.a){if(k==='value'&&(v.t==='select'||v.t==='input')){if(el.value!==v.a[k])el.value=v.a[k];continue}if(el.getAttribute(k)!==v.a[k])el.setAttribute(k,v.a[k])}
  if(!fresh)for(const at of [...el.attributes])if(!(at.name in v.a))el.removeAttribute(at.name);
  el.__ev=v.ev;if(!el.__bound){el.__bound=1;['click','change','input'].forEach(t=>el.addEventListener(t,e=>{const f=el.__ev&&el.__ev[t];if(f)f(e)}))}
  if(v.ref&&el.__ref!==v.ref){el.__ref=v.ref;v.ref(el)}
  if(v.t==='select'&&v.a.value!==undefined)setTimeout(()=>{el.value=v.a.value})}
function patchChildren(par,list){
  const kids=[...par.childNodes];
  list.forEach((v,i)=>{const k=kids[i];
    if(!k||(v.t==='#'?k.nodeType!==3:(k.nodeType!==1||k.tagName.toLowerCase()!==v.t))){const n=create(v);if(k)par.replaceChild(n,k);else par.appendChild(n);return}
    if(v.t==='#'){if(k.nodeValue!==v.v)k.nodeValue=v.v;return}
    patchEl(k,v,false);patchChildren(k,v.c)});
  for(let i=list.length;i<kids.length;i++)par.removeChild(kids[i])}
RT.boot=function(){
  const x=document.querySelector('x-dc');const src=x.querySelector('template');
  const tpl=document.createElement('template');tpl.innerHTML=(src||x).innerHTML;x.innerHTML='';
  const h=tpl.content.querySelector('helmet');[...h.children].forEach(c=>document.head.appendChild(c));h.remove();RT.tpl=tpl.content;RT.root=x;
  const code=document.querySelector('script[data-dc-script]').textContent;
  const C=new Function('DCLogic',code+';return Component')(DCLogic);
  RT.c=new C({});RT.render();window.C=RT.c;if(RT.c.componentDidMount)RT.c.componentDidMount()};
RT.render=function(){const out=[];build(RT.tpl,RT.c.renderVals(),out);patchChildren(RT.root,out)};
if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',RT.boot);else RT.boot();
