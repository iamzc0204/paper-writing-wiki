import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const sources = JSON.parse(await readFile('content/sources.json', 'utf8'));
await mkdir('raw', { recursive: true });
const normalize = s => s.normalize('NFKC').replace(/\s+/g,' ').trim();
const entities = s => s.replace(/&#x([0-9a-f]+);/gi,(_,x)=>String.fromCodePoint(parseInt(x,16)))
  .replace(/&#([0-9]+);/g,(_,x)=>String.fromCodePoint(Number(x)))
  .replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&apos;|&#039;/gi,"'").replace(/&rsquo;/gi,'’').replace(/&ldquo;/gi,'“').replace(/&rdquo;/gi,'”');
const receipts = [];
for (const source of sources) {
  const started = new Date().toISOString();
  try {
    const response = await fetch(source.url, { headers: { 'User-Agent':'AcademicWritingWiki/1.0 (non-commercial teaching project)' }, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const raw = await response.text();
    const html = raw.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
    const text = normalize(entities(html.replace(/<[^>]*>/g,' ')));
    const anchorFound = text.includes(normalize(source.anchor));
    await writeFile(`raw/${source.id}.html`, raw);
    await writeFile(`raw/${source.id}.txt`, text);
    const receipt = { id:source.id, url:response.url, retrievedAt:started, status:response.status, contentType:response.headers.get('content-type'), characters:text.length, sha256:createHash('sha256').update(raw).digest('hex'), anchorFound };
    receipts.push(receipt);
    console.log(`${source.id}: ${response.status}, ${text.length} characters, anchor ${anchorFound ? 'OK' : 'MISSING'}`);
  } catch (error) { receipts.push({id:source.id,url:source.url,retrievedAt:started,status:'error',error:error.message}); console.error(`${source.id}: ${error.message}`); }
}
await writeFile('records/ingest.json', JSON.stringify({runAt:new Date().toISOString(),sources:receipts},null,2));
if (receipts.some(row=>row.status!==200||!row.anchorFound)) process.exitCode=1;
