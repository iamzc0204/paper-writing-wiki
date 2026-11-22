import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const read=async name=>JSON.parse(await readFile(name,'utf8'));
export async function checkScope(){
 const review=await read('content/scope-review.json');
 return review.items.filter(x=>!['adapted','excluded'].includes(x.status)).map(x=>({node:'source-scope',code:'SCOPE_PENDING',id:x.id,source:x.source,message:x.question}));
}

export async function checkContent({scope=true}={}){
 const [sources,knowledge,slides,retrieval,ingest]=await Promise.all(['content/sources.json','content/knowledge.json','content/slides.json','records/retrieval.json','records/ingest.json'].map(read));
 const errors=[];const add=(node,code,id,message)=>errors.push({node,code,id,message});
 if(sources.length<5)add('ingest','TOO_FEW','sources','至少五篇來源');
 if(!sources.some(s=>s.language==='en')||!sources.some(s=>s.language==='zh-Hant'))add('ingest','LANGUAGES','sources','需要中英文來源');
 const sourceIds=new Set(sources.map(s=>s.id));const claimIds=new Set(knowledge.claims.map(c=>c.id));
 if(claimIds.size!==knowledge.claims.length)add('wiki','DUPLICATE','claims','重複主張編號');
 for(const source of sources){const receipt=ingest.sources.find(r=>r.id===source.id);if(!receipt||receipt.status!==200||!receipt.anchorFound||receipt.characters<500)add('ingest','SOURCE_NOT_READY',source.id,'取得與原文定位未完成');}
 for(const claim of knowledge.claims){if(!claim.text||!claim.locator||!claim.sources?.length||claim.sources.some(id=>!sourceIds.has(id)))add('wiki','INVALID_CLAIM',claim.id,'主張缺少定位或來源');}
 for(const page of knowledge.pages){if(page.claims.some(id=>!claimIds.has(id))||page.related.some(id=>!knowledge.pages.some(p=>p.id===id)))add('wiki','BROKEN_LINK',page.id,'主張或相關頁面不存在');}
 for(const slide of slides){
  const pack=retrieval.queries.find(q=>q.id===slide.query);
  if(!pack||!slide.claims?.length||slide.claims.some(id=>!pack.hits.some(h=>h.id===id)))add('claim-check','NOT_RETRIEVED',slide.id,'投影片依據未包含於對應 Wiki 查詢結果');
  if(slide.kind==='quiz')for(const question of slide.questions)if(!question.options[question.answer]||!question.feedback)add('slide-check','QUIZ',slide.id,'測驗答案或回饋缺失');
  if(/\d+(?:\.\d+)?\s*(?:ms|MB|%)/.test(JSON.stringify(slide))&&!slide.example)add('slide-check','EXAMPLE_LABEL',slide.id,'示例數據須標示教學假設');
 }
 if(scope)errors.push(...await checkScope());
 return {errors,counts:{sources:sources.length,pages:knowledge.pages.length,claims:knowledge.claims.length,queries:retrieval.queries.length,slides:slides.length,slideClaimLinks:slides.reduce((n,s)=>n+s.claims.length,0)}};
}

if(import.meta.url===pathToFileURL(process.argv[1]).href){const result=await checkContent();console.log(JSON.stringify(result,null,2));if(result.errors.length)process.exitCode=1;}
