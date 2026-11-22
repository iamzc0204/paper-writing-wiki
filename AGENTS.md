# 理工論文寫作 Wiki

此專案以中英文大學寫作教學為來源，建立可追查的 LLM Wiki，再產生給初學者使用的教學 HTML 簡報。

## 檔案與內容

- `records/discussion.md` 記錄生成前的討論及使用者選定的理工／資訊範圍，新增內容先讀它。
- `content/sources.json` 為來源清單；每項有 ID、原始網址、語言、定位短引與授權資訊。
- `raw/` 為本機 ingest 快取，不發布完整原文。`records/ingest.json` 保存取得時間、SHA256、字數與短引定位結果。
- `content/knowledge.json` 是 Wiki 唯一內容來源。每個主張有 C 編號、來源與原文節點；八個概念頁以 W 編號互相連結。
- `wiki/*.md` 由程式產生，不直接修改。
- `content/scope-review.json` 記錄來源建議的領域判讀；未處理完成的規則不能進入發布流程。
- `content/queries.json` 定義教學查詢。`records/retrieval.json` 是實際查詢結果。
- `content/slides.json` 每頁有查詢編號與主張編號，主張必須來自該次 Wiki 查詢。
- `content/slide-review.json` 記錄每頁的語意判讀、教學延伸與數據一致性；需對應目前 Wiki 與投影片的內容雜湊。
- 每個 Wiki 頁面需有練習與完成標準；完整案例的研究問題、事前門檻、結果表及摘要需一致。
- `web/` 放共用 CSS 與瀏覽器互動；`scripts/build.mjs` 產生 Wiki、來源、簡報、流程與紀錄頁。
- `records/run-v1.json` 與 `run-v2.json` 為本次執行紀錄；不要改寫成不存在的結果。

## 生成與檢查

1. 先確認主題、對象與教學目標，再依原始文件新增來源。
2. `npm run ingest` 取得來源並核對短引；閱讀原文後整理 Wiki。
3. LLM 判讀適用範圍，原文的建議、領域慣例與投稿規範需要分開。
4. `npm run query` 產生查詢包，依查詢結果撰寫投影片。
5. `npm run check` 檢查來源、Wiki 連結與投影片依據。
6. 重新核對來源及每頁教學內容，更新 `content/slide-review.json` 的理由與內容雜湊。執行 `npm run verify` 檢查過期查詢包與錯誤引用能否被攔下。
7. `npm run run -- v3` 執行已核定內容的編譯流程；`npm run build` 重建網站；`npm start` 本機預覽。
8. 新增內容後檢查對應來源、獨立頁、簡報導覽、測驗與手機排版。

LLM 在本次對話中執行閱讀、編寫與語意審核；CLI 以已保存的內容重播索引、檢查與 HTML 產出，不宣稱程式重新呼叫了模型。變更來源或主要教學結論時，需重新閱讀與判讀。

## 編輯與版面

使用繁體中文。摘要寫成可理解的原創整理，短引與來源清楚標示。示例論文與數據標為教學假設，不冒充研究實測。MIT CommKit 的改寫標明來源及 CC BY-NC 4.0。

教學簡報每頁一個重點，先概念、再示例、再練習；來源與實作紀錄放在對應頁面。維持深藍、紙白與橘色的編輯式版面，標題使用 Noto Serif TC，內文使用 Noto Sans TC。鍵盤與手機均可操作。

GitHub 帳號使用 iamzc0204，公開儲存庫與 GitHub Pages。頁面與資源使用相對網址，讓專案子路徑與離線檔案都能正常讀取。
