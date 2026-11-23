/* Runs the delivered deck.js against a minimal DOM fixture. No browser, layout or screenshots. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'deck.html'),'utf8');
const nodes=JSON.parse(fs.readFileSync(path.join(root,'checks/dom-fixture.json'),'utf8'));
class Element{
 constructor(tag='div',attrs={}){this.tagName=tag;this.attrs=attrs;this.dataset={};for(const [k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5)]=v;this.children=[];this.style={};this.textContent='';this.disabled=false;this._index=0;this._value='';this.options=[];this.classes=new Set((attrs.class||'').split(' '));this.classList={toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c),add:c=>this.classes.add(c),remove:c=>this.classes.delete(c)};}
 set selectedIndex(n){this._index=n}get selectedIndex(){return this._index}set value(v){if(this.options.length){this._index=this.options.indexOf(v)}else this._value=v}get value(){return this.options.length?this.options[this._index]:this._value}
 set innerHTML(t){this._html=t;this.children=[];this.textContent=t.replace(/<[^>]*>/g,'')}get innerHTML(){return this._html}
 append(x){this.children.push(x)}replaceChildren(...c){this.children=c}setAttribute(k,v){this.attrs[k]=v}querySelector(){return {textContent:this.heading||''}}closest(){return null}
}
const elements=nodes.map(n=>new Element(n.tag,n.attrs));
const headingMatches=[...source.matchAll(/<h[12]>(.*?)<\/h[12]>/g)].map(m=>m[1]);
elements.filter(e=>e.classes.has('slide')).forEach((e,i)=>e.heading=headingMatches[i]);
for(const id of ['left','right']){let match=source.match(new RegExp('<select id="'+id+'"[^>]*>([\\s\\S]*?)</select>'));elements.find(e=>e.attrs.id===id).options=[...match[1].matchAll(/<option>(.*?)<\/option>/g)].map(m=>m[1])}
const events={};function select(q){if(q.startsWith('#'))return elements.filter(e=>e.attrs.id===q.slice(1));if(q.startsWith('.'))return elements.filter(e=>e.classes.has(q.slice(1)));if(q.startsWith('['))return elements.filter(e=>q.slice(1,-1)in e.attrs);return []}
const document={querySelector:q=>select(q)[0],querySelectorAll:q=>select(q),createElement:t=>new Element(t),addEventListener:(n,fn)=>events[n]=fn};
const context={document,location:{hash:''},history:{replaceState:()=>{}},window:{scrollTo:()=>{}},console};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'deck.js'),'utf8'),context);
const $=q=>document.querySelector(q),results=[];
function test(name,fn){try{fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,detail:e.message})}}
function go(n){$('#toc').value=String(n-1);$('#toc').onchange()}
test('initial slide and previous boundary',()=>{assert.equal($('#counter').textContent,'1 / 15');assert.equal($('#prev').disabled,true)});
test('next and previous navigation',()=>{$('#next').onclick();assert.equal($('#counter').textContent,'2 / 15');$('#prev').onclick();assert.equal($('#counter').textContent,'1 / 15')});
test('all 15 slides selectable, exactly one active',()=>{for(let i=1;i<=15;i++){go(i);assert.equal($('#counter').textContent,`${i} / 15`);assert.equal(elements.filter(e=>e.classes.has('active')).length,1)}assert.equal($('#next').disabled,true)});
test('keyboard navigation and Home/End',()=>{const key=k=>events.keydown({key:k,target:{closest:()=>null},preventDefault(){}});key('Home');assert.equal($('#counter').textContent,'1 / 15');key('ArrowRight');assert.equal($('#counter').textContent,'2 / 15');key('End');assert.equal($('#counter').textContent,'15 / 15')});
test('select-focused arrows do not navigate',()=>{go(9);events.keydown({key:'ArrowRight',target:{closest:()=>true},preventDefault(){}});assert.equal($('#counter').textContent,'9 / 15')});
for(const a of ['○','△','□'])for(const b of ['○','△','□'])test(`pair ${a}${b}`,()=>{$('#left').value=a;$('#right').value=b;$('#test-pair').onclick();assert.match($('#result').textContent,a===b?/開門/:/關門/)});
test('history preserves all nine experiments',()=>assert.equal($('#history').children.length,9));
test('hint stages then stop',()=>{$('#hint').onclick();assert.match($('#hint-text').textContent,/比較/);$('#hint').onclick();assert.match($('#hint-text').textContent,/相同就開門/);assert.equal($('#hint').disabled,true)});
test('transfer wrong then correct',()=>{select('[data-pair]')[1].onclick();assert.match($('#transfer-result').textContent,/門仍關著/);select('[data-pair]')[0].onclick();assert.match($('#transfer-result').textContent,/正確/)});
test('reset clears selections, history, hints and transfer',()=>{$('#reset').onclick();assert.equal($('#left').value,'○');assert.equal($('#right').value,'○');assert.equal($('#history').children.length,0);assert.match($('#history').textContent,/還沒有/);assert.equal($('#hint').disabled,false);assert.match($('#transfer-result').textContent,/找到規則/);$('#test-pair').onclick();assert.equal($('#history').children.length,1)});
test('quiz wrong and correct feedback',()=>{select('[data-answer]')[0].onclick();assert.match($('#quiz-feedback').textContent,/再想/);select('[data-answer]')[1].onclick();assert.match($('#quiz-feedback').textContent,/B 較合適/)});
const out={timestamp:new Date().toISOString(),scope:'Delivered JavaScript executed in Node VM with a minimal DOM. Does not verify browser compatibility, layout, accessibility tree or visual appearance.',passed:results.filter(x=>x.passed).length,total:results.length,results};
fs.writeFileSync(path.join(root,'checks/interactions.json'),JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));process.exitCode=results.some(x=>!x.passed)?1:0;
