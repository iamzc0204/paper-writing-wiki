import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export function tokens(text) {
  const value = text.toLowerCase().normalize('NFKC');
  const words = value.match(/[a-z0-9]+|[\p{Script=Han}]+/gu) ?? [];
  return [...new Set(words.flatMap(word => /[\p{Script=Han}]/u.test(word)
    ? word.length > 1 ? Array.from({length:word.length-1},(_,i)=>word.slice(i,i+2)) : [word]
    : [word]))];
}

export function retrieve(knowledge, request, limit=8) {
  const selectedPages = request.pages?.length ? knowledge.pages.filter(p=>request.pages.includes(p.id)) : knowledge.pages;
  const allowed = new Set(selectedPages.flatMap(p=>p.claims));
  const terms = tokens(request.query);
  return knowledge.claims.filter(c=>allowed.has(c.id)).map(claim=>{
    const page = knowledge.pages.find(p=>p.claims.includes(claim.id));
    const text = `${claim.text} ${page.title} ${page.summary}`.toLowerCase();
    const score = terms.reduce((sum,term)=>sum+(text.includes(term)?1:0),0);
    return {...claim,pageId:page.id,pageSlug:page.slug,score};
  }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,limit);
}

export async function queryWiki() {
  const raw = await readFile('content/knowledge.json','utf8');
  const knowledge=JSON.parse(raw);
  const requests=JSON.parse(await readFile('content/queries.json','utf8'));
  const packs=requests.map(request=>({...request,hits:retrieve(knowledge,request)}));
  const result={createdAt:new Date().toISOString(),knowledgeSha256:createHash('sha256').update(raw).digest('hex'),method:'先以 Wiki 主題頁縮小範圍，再以中英關鍵字與中文字雙連詞匹配排序；每次最多8個主張。',queries:packs};
  await writeFile('records/retrieval.json',JSON.stringify(result,null,2));
  await mkdir('wiki',{recursive:true});
  for(const page of knowledge.pages){
    const claimLines=page.claims.map(id=>{const c=knowledge.claims.find(x=>x.id===id);return `- **${id}** ${c.text} [${c.sources.join(', ')}]`;});
    const related=page.related.map(id=>{const p=knowledge.pages.find(p=>p.id===id);return `[${p.title}](${p.slug}.md)`;});
    const content=`# ${page.title}\n\n${page.summary}\n\n## 概念整理\n\n${page.paragraphs.join('\n\n')}\n\n## 可追查的主張\n\n${claimLines.join('\n')}\n\n## ${page.example.label}\n\n原寫法：${page.example.before}\n\n改寫：${page.example.after}\n\n${page.example.explanation}\n\n## 練習\n\n${page.practice}\n\n## 相關頁面\n\n${related.join(' · ')}\n`;
    await writeFile(`wiki/${page.slug}.md`,content);
  }
  await writeFile('wiki/index.md',`# ${knowledge.title}\n\n${knowledge.pages.map(p=>`- [${p.title}](${p.slug}.md)：${p.summary}`).join('\n')}\n\n來源及逐項對應見 content/sources.json 與 content/knowledge.json。\n`);
  return result;
}

if(import.meta.url===pathToFileURL(process.argv[1]).href){
  if(process.argv[2]){const knowledge=JSON.parse(await readFile('content/knowledge.json','utf8'));console.log(JSON.stringify(retrieve(knowledge,{query:process.argv.slice(2).join(' ')}),null,2));}
  else{const result=await queryWiki();console.log(`${result.queries.length} 次 Wiki 查詢，8 篇 Markdown 已編譯。`);}
}
