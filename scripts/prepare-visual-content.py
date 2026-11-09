"""Deliberate public projection of the reviewed working map. Never copies notes."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
source=json.loads((ROOT/'private/redlands-policy-options/my-policy-map.json').read_text(encoding='utf-8'))
excluded=set(json.loads((ROOT/'data/public-project-exclusions.json').read_text(encoding='utf-8'))['excludedRepos'])
excluded_urls={p['url'] for g in source['projectCatalogue'] for p in g['projects'] if p['repoName'] in excluded}
groups=[]
for group in source['projectCatalogue']:
    groups.append({k:group[k] for k in ('id','title','description')} | {'projects':[
        {k:p[k] for k in ('id','repoName','title','url','description')} | {'adjacentProjects':[a for a in p['adjacentProjects'] if a['repoName'] not in excluded]} for p in group['projects'] if p['repoName'] not in excluded]})
ordering=json.loads((ROOT/'data/public-project-order.json').read_text(encoding='utf-8'))
by_group={g['id']:g for g in groups}
assert set(ordering['groupOrder'])==set(by_group)
for move in ordering['moves']:
    origin=next(g for g in groups if any(p['repoName']==move['repoName'] for p in g['projects']))
    project=next(p for p in origin['projects'] if p['repoName']==move['repoName'])
    origin['projects'].remove(project)
    target=by_group[move['groupId']]['projects']
    position=0 if move.get('first') else next(i+1 for i,p in enumerate(target) if p['repoName']==move['after'])
    target.insert(position,project)
groups=[by_group[group_id] for group_id in ordering['groupOrder']]
fields=('id','theme','title','purpose','redlandsAdaptation','route','mayoralCouncilLever','outside','partners','conflictBoundary','projectSources','officialSources','documentSources','connections','strategicPurpose','firstPrinciples','localApplications','leadershipExample','researchRationale','musicConnections')
options=[{k:r[k] for k in fields if k in r} for r in source['options']]
for option in options:
    option['projectSources']=[s for s in option['projectSources'] if s['url'] not in excluded_urls]
raw=json.loads((ROOT/'private/redlands-policy-options/policy-options.json').read_text(encoding='utf-8'))
documents=[{'number':d['number'],'title':Path(d['source'].replace('\\','/')).name} for d in raw['documents']]
context=(ROOT/'private/policy-role-context.html').read_text(encoding='utf-8')
role_context=[{'title':title,'html':body} for title,body in re.findall(r'<section[^>]*><h2>(.*?)</h2>(.*?)</section>',context,re.S)]
assert len(role_context)==3
assert not re.search(r'<script|on\w+=|file:|[CGL]:[\\/]',context,re.I)
data={'updated':'2026-11-09','groups':groups,'options':options,'overlapGuide':source['overlapGuide'],'roleContext':role_context,'officialSources':raw['officialSources'],'documents':documents}
text=json.dumps(data,ensure_ascii=False,indent=2)+'\n'
assert all(token not in text for token in ('myWording','myNotes','storageId','C:\\Users','G:\\Github','L:\\Downloads'))
(ROOT/'data/visual-content.json').write_text(text,encoding='utf-8')
print(f"Prepared {sum(len(g['projects']) for g in groups)} project descriptions and {len(options)} wiki entries. Personal notes and local source paths excluded.")
