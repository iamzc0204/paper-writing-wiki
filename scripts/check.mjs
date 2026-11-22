import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const read=async name=>JSON.parse(await readFile(name,'utf8'));
export const contentHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function scopeIssues(review){
 return review.items.filter(x=>!['adapted','excluded'].includes(x.status)||!x.decision||!x.evidence).map(x=>({node:'source-scope',code:'SCOPE_PENDING',id:x.id,source:x.source,message:x.question}));
}
export async function checkScope(){
 return scopeIssues(await read('content/scope-review.json'));
}

export async function loadContent(){
 const files={sources:'content/sources.json',knowledge:'content/knowledge.json',slides:'content/slides.json',retrieval:'records/retrieval.json',ingest:'records/ingest.json',queries:'content/queries.json',scopeReview:'content/scope-review.json',review:'content/slide-review.json'};
 return Object.fromEntries(await Promise.all(Object.entries(files).map(async([key,path])=>[key,await read(path)])));
}
export function validateContent(data,{scope=true}={}){
 const {sources,knowledge,slides,retrieval,ingest,queries,scopeReview,review}=data;
 const errors=[];const add=(node,code,id,message)=>errors.push({node,code,id,message});
 if(sources.length<5)add('ingest','TOO_FEW','sources','至少五篇來源');
 if(!sources.some(s=>s.language==='en')||!sources.some(s=>s.language==='zh-Hant'))add('ingest','LANGUAGES','sources','需要中英文來源');
 const sourceIds=new Set(sources.map(s=>s.id));const claimIds=new Set(knowledge.claims.map(c=>c.id));
 if(claimIds.size!==knowledge.claims.length)add('wiki','DUPLICATE','claims','重複主張編號');
 for(const source of sources){const receipt=ingest.sources.find(r=>r.id===source.id);if(!receipt||receipt.status!==200||!receipt.anchorFound||receipt.characters<500)add('ingest','SOURCE_NOT_READY',source.id,'取得與原文定位未完成');}
 for(const claim of knowledge.claims){if(!claim.text||!claim.locator||!claim.sources?.length||claim.sources.some(id=>!sourceIds.has(id)))add('wiki','INVALID_CLAIM',claim.id,'主張缺少定位或來源');}
 for(const page of knowledge.pages){
  if(page.claims.some(id=>!claimIds.has(id))||page.related.some(id=>!knowledge.pages.some(p=>p.id===id)))add('wiki','BROKEN_LINK',page.id,'主張或相關頁面不存在');
  if(!page.practice||!page.practiceChecklist||page.practiceChecklist.length<2)add('teaching','MISSING_PRACTICE',page.id,'練習或完成標準不足');
 }
 if(!knowledge.learningGoals||knowledge.learningGoals.length<3)add('teaching','MISSING_GOALS','wiki','需有明確學習目標');
 if(retrieval.hashFormat!=='json-v1'||retrieval.knowledgeSha256!==contentHash(knowledge)||retrieval.queriesSha256!==contentHash(queries))add('wiki-query','STALE_RETRIEVAL','retrieval','Wiki 或查詢已改動，需重建查詢包');
 for(const query of queries){
  const pack=retrieval.queries.find(q=>q.id===query.id);
  if(!pack||pack.query!==query.query||contentHash(pack.pages)!==contentHash(query.pages))add('wiki-query','QUERY_MISMATCH',query.id,'查詢包與查詢定義不一致');
  if(!pack)continue;
  for(const hit of pack.hits){
   const claim=knowledge.claims.find(c=>c.id===hit.id);
   if(!claim||hit.text!==claim.text||hit.locator!==claim.locator||contentHash(hit.sources)!==contentHash(claim.sources))add('wiki-query','HIT_STALE',hit.id,'查詢包文字、來源或定位與最新主張不一致');
   if(!knowledge.pages.some(p=>query.pages.includes(p.id)&&p.claims.includes(hit.id)))add('wiki-query','OUTSIDE_TOPIC',hit.id,'主張不在指定 Wiki 頁面');
  }
 }
 for(const slide of slides){
  const pack=retrieval.queries.find(q=>q.id===slide.query);
  if(!pack||!slide.claims?.length||slide.claims.some(id=>!claimIds.has(id)||!pack.hits.some(h=>h.id===id)))add('claim-check','NOT_RETRIEVED',slide.id,'投影片依據未包含於對應 Wiki 查詢結果');
  if(slide.kind==='quiz')for(const question of slide.questions)if(!question.options[question.answer]||!question.feedback)add('slide-check','QUIZ',slide.id,'測驗答案或回饋缺失');
  if(/\d+(?:\.\d+)?\s*(?:ms|MB|%)/.test(JSON.stringify(slide))&&!slide.example)add('slide-check','EXAMPLE_LABEL',slide.id,'示例數據須標示教學假設');
  const decision=review.slides.find(r=>r.slideId===slide.id);
  if(!decision||decision.status!=='verified'||!decision.rationale||contentHash(decision.claims)!==contentHash(slide.claims))add('semantic-review','REVIEW_PENDING',slide.id,'需完成此頁語意核對與教學用途說明');
 }
 if(review.knowledgeSha256!==contentHash(knowledge)||review.slidesSha256!==contentHash(slides))add('semantic-review','STALE_REVIEW','review','Wiki 或投影片改動後，需重新核對語意');
 if(scope)errors.push(...scopeIssues(scopeReview));
 return {errors,counts:{sources:sources.length,pages:knowledge.pages.length,claims:knowledge.claims.length,queries:retrieval.queries.length,slides:slides.length,slideClaimLinks:slides.reduce((n,s)=>n+s.claims.length,0)}};
}
export async function checkContent(options={}){return validateContent(await loadContent(),options);}

if(import.meta.url===pathToFileURL(process.argv[1]).href){const result=await checkContent();console.log(JSON.stringify(result,null,2));if(result.errors.length)process.exitCode=1;}
