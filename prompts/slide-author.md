# 教學簡報生成提示

先讀 records/discussion.md，依 content/queries.json 查詢 Wiki，讀取 records/retrieval.json 的結果，再編寫 content/slides.json。每頁一個教學任務，採概念、示例、練習的漸進結構。

事實性教學依據只能引用該頁查詢取得的 Wiki 主張。每張投影片列出 claim IDs，讓產生器建立「投影片 → Wiki → 原始來源」連結。自行設計的示例需與來源的通則分開。

有缺口先改查詢或補 Wiki，不讓沒有依據的內容通過。精簡投影片內文字，較完整的解釋留在 Wiki。至少包含研究問題、相關工作、章節分工、方法與實驗、圖表、討論、摘要、修訂與自我檢查。
