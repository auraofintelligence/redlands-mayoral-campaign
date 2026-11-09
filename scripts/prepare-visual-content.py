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
groups.extend(dict(group,projects=[]) for group in ordering.get('additionalGroups',[]))
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
descriptions=json.loads((ROOT/'data/public-project-descriptions.json').read_text(encoding='utf-8'))
for group in groups:
    for project in group['projects']:
        if project['repoName'] in descriptions:
            for field in ('title','description'):
                if field in descriptions[project['repoName']]:
                    project[field]=descriptions[project['repoName']][field]
fields=('id','theme','title','purpose','redlandsAdaptation','route','mayoralCouncilLever','outside','partners','conflictBoundary','projectSources','officialSources','documentSources','connections','strategicPurpose','firstPrinciples','localApplications','leadershipExample','researchRationale','musicConnections')
options=[{k:r[k] for k in fields if k in r} for r in source['options']]
for option in options:
    option['projectSources']=[s for s in option['projectSources'] if s['url'] not in excluded_urls]
    by_url={p['url']:p for g in groups for p in g['projects']}
    for project_source in option['projectSources']:
        if project_source['url'] in by_url:
            project_source['title']=by_url[project_source['url']]['title']
by_id={option['id']:option for option in options}
editable=set(fields)-{'id','projectSources','officialSources','documentSources'}
worded_ids=set()
for number in range(1,4):
    wording=json.loads((ROOT/f'data/wiki-wording-{number:02}.json').read_text(encoding='utf-8'))
    for option_id,changes in wording['entries'].items():
        assert option_id in by_id and option_id not in worded_ids
        option=by_id[option_id]
        for field,value in changes.items():
            assert field in editable and field in option
            assert type(value) is type(option[field])
            if field=='connections':
                assert [item['id'] for item in value]==[item['id'] for item in option[field]]
            if field=='musicConnections':
                assert [item['title'] for item in value]==[item['title'] for item in option[field]]
            option[field]=value
        worded_ids.add(option_id)
assert worded_ids==set(by_id)
raw=json.loads((ROOT/'private/redlands-policy-options/policy-options.json').read_text(encoding='utf-8'))
documents=[{'number':d['number'],'title':Path(d['source'].replace('\\','/')).name} for d in raw['documents']]
context=(ROOT/'private/policy-role-context.html').read_text(encoding='utf-8')
role_context=[{'title':title,'html':body} for title,body in re.findall(r'<section[^>]*><h2>(.*?)</h2>(.*?)</section>',context,re.S)]
assert len(role_context)==3
assert not re.search(r'<script|on\w+=|file:|[CGL]:[\\/]',context,re.I)
public_context=json.loads((ROOT/'data/wiki-context-wording.json').read_text(encoding='utf-8'))
assert len(public_context['roleContext'])==len(role_context)
assert [item['options'] for item in public_context['overlapGuide']]==[item['options'] for item in source['overlapGuide']]
assert not re.search(r'<script|on\w+=|file:|[CGL]:[\\/]',json.dumps(public_context),re.I)
data={'updated':'2026-11-09','groups':groups,'options':options,'overlapGuide':public_context['overlapGuide'],'roleContext':public_context['roleContext'],'officialSources':raw['officialSources'],'documents':documents}
text=json.dumps(data,ensure_ascii=False,indent=2)+'\n'
assert all(token not in text for token in ('myWording','myNotes','storageId','C:\\Users','G:\\Github','L:\\Downloads'))
(ROOT/'data/visual-content.json').write_text(text,encoding='utf-8')
print(f"Prepared {sum(len(g['projects']) for g in groups)} project descriptions and {len(options)} wiki entries. Personal notes and local source paths excluded.")
