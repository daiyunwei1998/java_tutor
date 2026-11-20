# 規格檢視與優化建議

對象：Spec B（Interactive CS Learning Platform）與 Spec A（Unit 9 — 2D Arrays Interactive Lab）
日期：2026-11-21

兩份規格整體很完整，教學原則（Learn → Predict → Implement → Execute → Visualize → Test → Improve）也很清楚。下面依「影響大小」排序，列出我建議調整的地方，以及這次 demo 已經怎麼處理。

---

## 1. 必須先決定的事（會改變範圍）

### 1.1 Java 在瀏覽器執行 vs. Spec B 第 6 節的後端沙盒
Spec B §10 寫「Java 要在瀏覽器跑、不送後端」，但 §6 整段都在描述 Spring Boot + container 沙盒。兩者互相矛盾，建議把 §6 改寫成：

- **Mode B = 瀏覽器內真實 Java**：用 CheerpJ（JVM 編譯成 WebAssembly）+ Eclipse 編譯器 ecj，在學生自己的瀏覽器編譯、執行、跑測試。學生程式碼永遠不會在你的伺服器上執行，所以 §6「Runtime security」那一大串（container、non-root、network isolation…）**大部分不再需要**，安全模型簡化成「學生只能弄壞自己的分頁」。
- 無窮迴圈的處理：Java 跑在隱藏的 iframe 裡，超時就整個 iframe 砍掉重建（demo 已實作，預設 10 秒）。
- 把 §6 的後端沙盒移到「Deferred / 未來選項」，只有在需要「伺服器端驗證成績」時才做。

**代價（請你確認可以接受）：**
1. 第一次載入要下載 JVM runtime（大約數十 MB，之後瀏覽器會快取），第一次約 10–30 秒。
2. **Hidden tests 不可能真的隱藏**：所有東西都在學生的瀏覽器裡，懂 DevTools 的學生看得到。對「一位家教 + 少數學生」的情境這通常可以接受；如果之後需要正式評分，再加一個「老師端重跑測試」的功能。
3. **授權**：CheerpJ 的免費 Community 授權有使用條件（個人 / 非商業等）。如果家教是收費服務，正式上線前請到 Leaning Technologies 官網確認授權條款，必要時購買授權。
4. 需要網路連到 CheerpJ 的 CDN（`cjrtnc.leaningtech.com`）。

### 1.2 「專案式學習 / Junior Developer」應該寫進規格
你新增的方向（學生是 Junior Developer、接 ticket、merge PR）很好，但它會影響資訊架構，建議正式寫進 Spec B：

- 把「Course → Lesson」改成「**Project → Sprint → Ticket**」為主要導覽；Lesson 變成 ticket 裡的內容區塊。Spec A 的 6 個 lesson 剛好對應 Mini Photoshop 的 onboarding sprint + feature sprint。
- 狀態對應 Spec B §12：Viewed = *In Progress*、Attempted = 有執行紀錄、Passed automated tests = *Tests Passed* → 學生按 *Merge PR*、Tutor verified = *老師 Code Review 通過*。這樣「測試通過 ≠ 觀念都懂」這條原則也自然保留下來。
- 遊戲化保持克制：XP + 職級（Junior Developer I/II/III → Developer），不做排行榜（避免比較壓力）。

### 1.3 AI 助教需要的規格（目前 Spec B 沒有）
Spec B §16 寫「AI grading 不是主要評分機制」，但沒有描述 AI 助教。建議新增一節：

- **定位**：導師，不是解答機。System prompt 規定：先指出位置 → 解釋原因 → 給引導問題；不給完整答案；示範片段最多 3 行。
- **兩個入口**：全站的「問 Senior Dev」聊天、每個練習的「🤖 AI 協助 Debug」按鈕（自動附上程式碼 + 最近一次編譯錯誤 / 例外 / 測試結果）。
- **成本控制（三層）**：OpenAI 專案的 monthly hard limit（你已設定）＋ 每位學生每 24 小時上限（`AI_DAILY_LIMIT_PER_STUDENT`，預設 60）＋ 輸入長度上限。
- **額度用完**：OpenAI 回 429 時，學生看到「AI 助教這個月的使用額度已經用完了，請聯絡老師」，老師後台會出現紅色警示。
- **可觀測性**：每次呼叫都記錄 學生、類型、ticket、tokens、狀態，在 admin 頁面看得到。
- **隱私**：送給 OpenAI 的只有學生自己輸入的名字代號和程式碼；不要讓學生在聊天裡輸入個資（可以在畫面上提醒）。

---

### 1.4 部署：Vercel + Vercel Postgres（取代 Spec B 的 Spring Boot 架構）
- Next.js 和 FastAPI 放在同一個 repo、同一個 Vercel 專案：FastAPI 以 Vercel Python function（`api/index.py`）執行。
- 因為 Java 在瀏覽器執行，Vercel 不需要跑 JVM，serverless 架構剛好適合。
- AI 用量（以及之後的學生進度）存在 Vercel Marketplace 的 Postgres（Neon），用 `DATABASE_URL` 連線；本機沒有資料庫時自動改用 SQLite。
- Serverless 不能存本機檔案，所以「進度存在伺服器」這件事一定要走資料庫（見 2.2）。

## 2. 建議修改（不改範圍，但讓實作更順）

| # | 位置 | 問題 | 建議 |
|---|------|------|------|
| 2.1 | Spec B §3, §11 | 沒有「身分」設計，但 Tutor Dashboard、AI 用量都需要知道誰是誰 | MVP 用「學生第一次輸入名字 + 本機產生的 ID」（demo 已這樣做）；Phase 4 再加正式登入（例如 Google 登入或老師發的邀請碼） |
| 2.2 | Spec B §12, §15-9 | 「Progress retained between sessions」沒說存在哪 | MVP 存在瀏覽器 localStorage（demo 已這樣做，換電腦會不見）；下一步把進度同步到 FastAPI + SQLite，老師後台才看得到學生進度 |
| 2.3 | Spec B §5 | Lesson schema 有 `exercises: string[]`，但 Exercise 本身沒定義 | 定義 `CodeTask = { files[], mainClass, testClass, testLabels, hints[] }`，測試檔對學生可見（唯讀），見 `src/content/types.ts` |
| 2.4 | Spec B §6 | `RunResponse.status` 沒有 `queued/running` 的實際用途（瀏覽器端是同步的） | 改成 `completed / compile_error / runtime_error / timeout`，另外回傳 `compileMs / runMs` |
| 2.5 | Spec B §7 | 視覺化與學生程式碼的關係容易混淆 | 每個模擬視覺化固定顯示「模擬示範 · 不是執行你的程式」標籤；只有 Mini Photoshop 的結果標「由你的 Java 程式計算」（demo 已實作，符合你的 consistency rule） |
| 2.6 | Spec B §13 | Phase 1 和 Phase 2 很難分開交付（2D array 本身就是第一個 demo） | 合併成「Phase 1：平台骨架 + Unit 9 Sprint 1」，Phase 2 改成「Unit 9 Sprint 2：convolution + Mini Photoshop 其餘濾鏡」 |
| 2.7 | Spec A Lesson 5 | 一開始就提 RGB 會讓任務 3（Grayscale）和 int[][] 灰階衝突 | Sprint 1 全部用灰階 int[][]；Grayscale 任務改成「RGB packed int → 灰階」，放 Sprint 2 |
| 2.8 | Spec A §3 | Mini Photoshop 任務沒有定義「輸入影像大小上限」 | 固定上限（demo 為 40×40 以內，上傳的圖會自動縮小），避免瀏覽器內 JVM 處理太大的陣列 |
| 2.9 | Spec A Lesson 6 | Sobel 輸出範圍沒定義 | 規定 `min(255, (int) Math.round(Math.sqrt(gx*gx + gy*gy)))`，測試才有唯一答案 |
| 2.10 | Spec A §5 | 「每個概念都要有 prediction question」很好，但沒說答錯怎麼辦 | 答錯不扣分，立即顯示解釋；預測答過就給少量 XP（demo：+5 XP） |
| 2.11 | Spec B §14 無障礙 | 很好，但缺「中文介面」需求 | 明訂：介面與說明用繁體中文，程式碼、識別字、錯誤訊息保留英文；AI 預設用繁中回答 |

---

## 3. 這次 demo 做了什麼（對照驗收標準）

Spec B §15：
1. ✅ 從專案看板打開 ticket。
2. ✅ 說明與編輯器同時可見（三欄，可調整寬度；手機改成分頁）。
3. ✅ Java 可以編譯和執行（瀏覽器內）。
4. ✅ 顯示 console、編譯錯誤（可點擊跳到該行）、例外的 stack trace。
5. ✅ 視覺化可以獨立控制（play / pause / step / back / reset / speed）。
6. ✅ 右側面板可以調整大小、收合。
7. ✅ 學生可以編輯並自動儲存程式碼。
8. ✅ 練習可以跑自動測試。
9. ✅ 進度在重新整理後保留（目前存在瀏覽器）。
10. ✅ Unit 9 是 content 資料，不寫死在 layout 裡（`src/content/`）。
11. ✅ 一個專案有多張 TODO ticket。
12. ✅ 學生可以把自己的 Java 影像處理方法套用到預覽圖上（PF-105 brightness）。

Spec A：Lesson 1–4 的核心視覺化（Array vs Memory、row/column-major + 連續記憶體 + cache 模擬、enhanced for、矩陣演算法 + 存取次數 + 複雜度）和 Lesson 5 的 pixel inspector 已完成；Lesson 6（convolution）與 Mini Photoshop 其餘任務列在看板的「下一個 Sprint」。

## 4. 建議的下一步
1. 在你的電腦上跑起來，確認 CheerpJ 載入時間可以接受。
2. Sprint 2：convolution 視覺化（3×3 kernel 逐格計算）+ Flip / Blur / Sobel 三張 ticket。
3. 進度同步到後端 + 老師後台看學生進度、按「Code Review 通過」。
