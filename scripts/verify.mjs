import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {loadContent,validateContent,scopeIssues} from './check.mjs';

const original=await loadContent();
const cases=[];
function run(name,mutate,expected){
 const data=structuredClone(original);mutate(data);
 const errors=validateContent(data).errors;
 assert.ok(expected?errors.some(e=>e.code===expected):errors.length===0,`${name}: ${JSON.stringify(errors)}`);
 cases.push({name,type:expected?'controlled-input-change':'current-content',expected:expected??'passed',observedCodes:[...new Set(errors.map(e=>e.code))],passed:true});
}
run('目前內容完整通過',()=>{},null);
run('相同編號但查詢包文字被改動',d=>d.retrieval.queries[0].hits[0].text='刻意替換的測試文字','HIT_STALE');
run('Wiki 已修改而查詢包未重建',d=>d.knowledge.claims[0].text+='（測試修改）','STALE_RETRIEVAL');
run('投影片引用未查得的主張',d=>d.slides[0].claims=['C999'],'NOT_RETRIEVED');
run('投影片已改寫而語意審核未更新',d=>d.slides[0].title+='（測試修改）','STALE_REVIEW');
const pending=structuredClone(original.scopeReview);pending.items[0].status='pending';
assert.equal(scopeIssues(pending)[0].code,'SCOPE_PENDING');
cases.push({name:'來源範圍尚未判讀即被前置關卡攔下',type:'controlled-input-change',expected:'SCOPE_PENDING',observedCodes:['SCOPE_PENDING'],passed:true});
const result={checkedAt:new Date().toISOString(),description:'以複製的記憶體測試資料驗證檢查能力；不改動 Wiki、投影片或歷史執行紀錄。',passed:cases.length,total:cases.length,cases};
if(process.argv.includes('--record'))await writeFile('records/verification.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
