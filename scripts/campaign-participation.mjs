import {readFileSync} from 'node:fs';

// Reviewed snapshots from the earlier election exploration.
function keys(value,allowed,label){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(key=>!allowed.includes(key)))throw new Error('Unexpected public finance fields: '+label);}
export function validatePublicFinance(report){
 keys(report,['version','updated','coverage','contributions','expenses','budget'],'report');
 if(report.version!==1||!['not-yet-published','reviewed-records'].includes(report.coverage))throw new Error('Unsupported public finance report.');
 if(report.updated!==null&&(!/^\d{4}-\d{2}-\d{2}T/.test(report.updated)||isNaN(Date.parse(report.updated))))throw new Error('Invalid public report date.');
 const schemas={contributions:['id','name','kind','date','amount','status','note'],expenses:['id','description','date','amount','category','payee','status'],budget:['id','description','amount','category','status']};
 for(const [collection,allowed] of Object.entries(schemas)){
  if(!Array.isArray(report[collection]))throw new Error('Missing public finance collection.');
  const ids=new Set();
  for(const row of report[collection]){
   keys(row,allowed,collection);
   if(typeof row.id!=='string'||!/^[\w-]{1,150}$/.test(row.id)||ids.has(row.id))throw new Error('Invalid or repeated public finance reference.');ids.add(row.id);
   if(!/^\d+(?:\.\d{2})$/.test(row.amount)||Number(row.amount)>100000000)throw new Error('Invalid public finance amount.');
   if(!row[collection==='contributions'?'name':'description'])throw new Error('Public finance records need a name or description.');
   if(collection!=='budget'&&(!/^\d{4}-\d{2}-\d{2}$/.test(row.date)||new Date(row.date+'T00:00:00Z').toISOString().slice(0,10)!==row.date))throw new Error('Invalid public finance date.');
   const statuses=collection==='contributions'?['accepted','returned']:collection==='expenses'?['planned','incurred','paid']:['option','approved'];
   if(!statuses.includes(row.status))throw new Error('Private or unreviewed finance status cannot be published.');
   if(collection==='contributions'&&!['donation','gift-in-kind','personal-funds','loan'].includes(row.kind))throw new Error('Invalid public contribution type.');
   for(const value of Object.values(row))if(typeof value!=='string'||value.length>5000||/[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}|[CGL]:[\\/]/.test(value))throw new Error('Private contact information or invalid public field.');
  }
 }
 if(report.coverage==='not-yet-published'&&(report.updated!==null||report.contributions.length||report.expenses.length||report.budget.length))throw new Error('Unpublished finance report must remain empty.');
 if(report.coverage==='reviewed-records'&&!report.updated)throw new Error('Reviewed reports need a source date.');
 return report;
}
const finance=()=>validatePublicFinance(JSON.parse(readFileSync(new URL('../data/campaign-finance-public.json',import.meta.url),'utf8')));
export function publicFinanceAssets(){
 const report=finance();
 const cell=value=>{let text=String(value??'');if(/^[\s]*[=+@-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
 const csv=(fields,records)=>[fields.map(cell).join(','),...records.map(row=>fields.map(key=>cell(row[key])).join(','))].join('\r\n')+'\r\n';
 return [
  ['assets/data/campaign-finance-public.json',JSON.stringify(report,null,2)+'\n'],
  ['downloads/campaign-contributions.csv',csv(['id','name','kind','date','amount','status','note'],report.contributions)],
  ['downloads/campaign-expenses.csv',csv(['id','description','date','amount','category','payee','status'],report.expenses)],
  ['downloads/campaign-budget.csv',csv(['id','description','amount','category','status'],report.budget)]
 ];
}
