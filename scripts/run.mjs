import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {queryWiki} from './query.mjs';
import {checkScope,checkContent} from './check.mjs';

const version=process.argv[2]||'v2';
if(!['v1','v2'].includes(version))throw new Error('Use v1 or v2');
const run={id:`${version}-${new Date().toISOString().replace(/[:.]/g,'-')}`,version,startedAt:new Date().toISOString(),steps:[],status:'running'};
async function step(node,work){const startedAt=new Date().toISOString();const output=await work();run.steps.push({node,startedAt,finishedAt:new Date().toISOString(),...output});return output;}
await step('ingest',async()=>{const record=JSON.parse(await readFile('records/ingest.json','utf8'));return {status:'passed',action:'核對本次已取得的來源紀錄，不重做網路請求',success:record.sources.filter(s=>s.status===200&&s.anchorFound).length};});
let blocked=false;
if(version==='v2'){const issues=await checkScope();await step('source-scope',async()=>({status:issues.length?'blocked':'passed',issues}));blocked=issues.length>0;}
if(!blocked){
 await step('wiki-index',async()=>{const raw=await readFile('content/knowledge.json','utf8');const kb=JSON.parse(raw);return {status:'passed',pages:kb.pages.length,claims:kb.claims.length,sha256:createHash('sha256').update(raw).digest('hex')};});
 await step('wiki-query',async()=>{const packs=await queryWiki();await writeFile(`records/retrieval-${version}.json`,JSON.stringify(packs,null,2));return {status:'passed',queries:packs.queries.length};});
 await step('slide-plan',async()=>{const slides=JSON.parse(await readFile('content/slides.json','utf8'));return {status:'passed',action:'讀取本次 LLM 依 Wiki 查詢編寫的教學分鏡',slides:slides.length};});
 const result=await checkContent({scope:version==='v1'});
 await step(version==='v1'?'late-content-check':'claim-check',async()=>({status:result.errors.length?'blocked':'passed',issues:result.errors,counts:result.counts}));
 blocked=result.errors.length>0;
 if(!blocked){const {buildSite}=await import('./build.mjs');await step('html-render',async()=>({status:'passed',...await buildSite()}));}
}
run.status=blocked?'blocked':'passed';run.finishedAt=new Date().toISOString();
await writeFile(`records/run-${version}.json`,JSON.stringify(run,null,2));
console.log(JSON.stringify(run,null,2));if(blocked)process.exitCode=1;
