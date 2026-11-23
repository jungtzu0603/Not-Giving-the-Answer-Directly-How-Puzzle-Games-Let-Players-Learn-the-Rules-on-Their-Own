不直接給答案：解謎遊戲如何讓玩家自己學會規則？

開啟方式
1. 解壓縮完整資料夾。
2. 用瀏覽器開啟 index.html。
3. deck.html 是 15 頁教學簡報；wiki.html 是可搜尋的 Wiki；report.html 是實際紀錄與反思。
4. 全部內容可離線使用，原文外部連結需連網。請保留相對檔案位置。

檔案結構
raw/                5 篇來源的書目、短摘錄、定位與 JSON manifest（不是全文備份）
wiki/               Markdown 來源摘要、概念、案例、示例、索引、更新紀錄
process/            訪談摘要、workflow、逐頁稿、引用對應、實際報告
scripts/render.py   Python 標準函式庫，從文稿與 Wiki 渲染 HTML
scripts/validate.py Python 標準函式庫，檢查結構、引用與內部連結
scripts/test-interactions.cjs  Node 標準模組，執行交付 JS 的模擬 DOM 測試
checks/             實際檢查結果，含未通過的第一輪
AGENTS.md           LLM Wiki 的後續維護與 ingest 規則

重跑（從資料夾中執行，需 Python 3 與 Node）
python3 scripts/render.py
python3 scripts/validate.py
node scripts/test-interactions.cjs

驗證界線
程式結構與模擬互動已檢查。執行環境無法完成瀏覽器預覽，未驗證實際畫面、手機觸控或讀屏相容性。
沒有進行真人學習測試，也沒有獨立 AI 審查。詳見 report.html。

AI 協作與學術誠信
本成果由使用者確認題目與需求，AI 蒐集、整理、編寫與程式檢查。
自製謎題不是商業遊戲的關卡。原文觀點、設計推論與原創示例均有區分。
請親自閱讀與試玩後，依課程規定揭露 AI 使用方式。學校、學號、系級、姓名請自行填入繳交標題。
