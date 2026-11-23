"""Structural validation, no network access. Run: python3 scripts/validate.py"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,re,hashlib,datetime
R=Path(__file__).resolve().parents[1]
checks=[]
def check(name,ok,detail=''):checks.append(dict(name=name,passed=bool(ok),detail=detail))
class Page(HTMLParser):
 def __init__(self,text):
  super().__init__();self.ids=[];self.links=[];self.assets=[];self.nodes=[];self.feed(text)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs);self.nodes.append(dict(tag=tag,attrs=a))
  if 'id'in a:self.ids.append(a['id'])
  if tag=='a' and 'href'in a:self.links.append(a['href'])
  if tag in ['script','img','iframe','audio','video'] and a.get('src'):self.assets.append(a['src'])
  if tag=='link' and a.get('href'):self.assets.append(a['href'])
pages={p.name:Page(p.read_text()) for p in R.glob('*.html')}
for name,p in pages.items():
 check(name+' unique IDs',len(p.ids)==len(set(p.ids)))
 for url in p.links+p.assets:
  u=urlsplit(url)
  if u.scheme in ('http','https','mailto'):continue
  dest=R/unquote(u.path) if u.path else R/name
  check(f'{name} → {url}',dest.is_file(),'local target')
  if dest.is_file() and u.fragment and dest.suffix=='.html':check(f'{name} anchor {url}',unquote(u.fragment) in pages[dest.name].ids)
 check(name+' offline assets',all(not urlsplit(u).scheme for u in p.assets))
manifest=json.loads((R/'raw/manifest.json').read_text());slides=json.loads((R/'process/slides.json').read_text())
check('at least 5 unique sources',len(manifest)>=5 and len({s['url'] for s in manifest})==len(manifest))
for s in manifest:
 check(s['id']+' source pipeline',all((R/p).is_file() for p in [f"raw/{s['id']}.md",f"wiki/sources/{s['id']}.md"]))
 check(s['id']+' evidence metadata',all(s.get(k) for k in ['author','title','url','loc','quote','summary','limit','claim']))
check('12–15 slides',12<=len(slides)<=15)
check('15 rendered sections',sum('slide' in n['attrs'].get('class','').split() for n in pages['deck.html'].nodes)==len(slides))
for s in slides:
 check(f"slide {s['page']} references",bool(s['refs']) and all((R/r).is_file() for r in s['refs']))
 check(f"slide {s['page']} title preserved",s['title'] in (R/'deck.html').read_text())
used={r.rsplit('/',1)[-1][:-3] for s in slides for r in s['refs'] if 'wiki/sources/' in r}
check('all 5 sources used in deck',used=={s['id'] for s in manifest})
for p in list((R/'wiki').rglob('*.md'))+list((R/'process').glob('*.md')):
 for url in re.findall(r'\[[^\]]+\]\(([^)]+)\)',p.read_text()):
  if not urlsplit(url).scheme:check(str(p.relative_to(R))+' → '+url,(p.parent/url.split('#')[0]).is_file())
check('no external CSS imports',not re.search(r'@import|url\(\s*[\'"]?https?://',(R/'style.css').read_text()))
result=dict(timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='Static structure only; not browser rendering or source truth verification',passed=sum(c['passed'] for c in checks),total=len(checks),failures=[c for c in checks if not c['passed']],checks=checks)
(R/'checks/structural.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
(R/'checks/dom-fixture.json').write_text(json.dumps(pages['deck.html'].nodes,ensure_ascii=False))
print(json.dumps({k:v for k,v in result.items() if k!='checks'},ensure_ascii=False,indent=2))
raise SystemExit(bool(result['failures']))
