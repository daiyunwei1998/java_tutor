# Java Dev Sprints

專案式 (project-based) 的 Java / AP CSA 學習平台。課程以 **Sprint** 為單位（例如這週 = 2D Arrays），
每個 Sprint 有自己的小專案和故事（Sprint 1：PixelForge Studio 的 Mini Photoshop）。學生是 **Junior Developer**，
透過完成 ticket、通過測試、merge PR 推進 Sprint 完成度。

- **Java 在學生的瀏覽器裡編譯和執行**（CheerpJ + Eclipse ecj），不會在伺服器上跑學生程式碼。
- **AI 導師**（OpenAI）：全站「問 Senior Dev」聊天 + 每個練習的「🤖 AI 協助 Debug」按鈕。
- **帳號**：預設 `stu`、`test`（密碼和帳號相同，只用來區分帳號）。進度存在資料庫，換電腦也在。
  要加帳號：在 Vercel 設 `SEED_ACCOUNTS=stu,test,新帳號`，重新部署後自動建立（密碼 = 帳號）。
- **老師後台** `/admin`（網站上沒有入口，直接打網址）：AI 使用量、各帳號進度、「重設 test」、「把 stu 同步到 test」。
- 規格檢視與優化建議：[docs/spec-review.md](docs/spec-review.md)
- 測試：`node --experimental-strip-types tools/verify-content.mjs`（需要 JDK）、`python tools/test_api.py`

## 部署（Vercel）
- 一個 Vercel 專案同時跑 Next.js 前端和 FastAPI（`api/index.py` 是 Vercel Python function，`vercel.json` 把 `/api/*` 導到它）。
- 資料庫：Vercel Marketplace 的 Postgres（Neon）。連上之後 Vercel 會自動設定 `DATABASE_URL`，後端第一次啟動會自動建表。
- Vercel 專案的環境變數：`OPENAI_API_KEY`、`ADMIN_PASSWORD`（必填），其他選填見 `.env.example`。
- push 到 `main` 就會自動部署。

## 本機開發
需要 Node.js 20+、Python 3.10+。在專案根目錄放 `.env`（參考 `.env.example`，不會被 git 追蹤）：

```
OPENAI_API_KEY=sk-...
ADMIN_PASSWORD=自己設一個密碼
# 選填：沒有 DATABASE_URL 時用本機 SQLite（.data/usage.db）
```

Windows 直接雙擊 `start-dev.bat`；或手動：
```
py -m venv .venv
.venv\Scripts\python -m pip install -r requirements-dev.txt
.venv\Scripts\python -m uvicorn api.index:app --port 8000
npm install
npm run dev
```
打開 http://localhost:3000 （老師後台 http://localhost:3000/admin）。API key 只在後端讀取，不會送到瀏覽器。

## 架構
```
src/content/             課程內容（純資料）：sprint、小專案故事、ticket、起始碼、測試、提示
src/components/          工作區（兩欄：說明/視覺化 ｜ 程式碼；手機分頁）、程式編輯器、AI 聊天
src/components/viz/      視覺化元件（依 type 註冊，內容只引用 type + config）
src/lib/java-runner.ts   瀏覽器端 Java 執行 API
src/lib/progress.ts      學生進度：存在後端（每個帳號一份），localStorage 只是快取
public/java-runner.html  在隱藏 iframe 裡跑 CheerpJ；逾時就重建 iframe（無窮迴圈保護）
public/java/             ecj.jar（Eclipse Java 編譯器）、tutor-runtime.jar（編譯/執行/測試橋接）
api/index.py             FastAPI：AI、登入、進度同步、admin（用量 / 帳號）、/api/health
api/_core/               設定、AI 用量紀錄與帳號/進度（Postgres 或 SQLite）、AI 導師 prompt
runtime-java/            tutor-runtime.jar 的原始碼（Bridge、Check 斷言、Img 影像 I/O）
tools/                   內容驗證、API smoke test、參考解答
```

## 新增一個 Sprint
1. 複製 `src/content/sprints/s01-2d-arrays/` 成新資料夾（例如 `s02-recursion/`）。
2. 在 `sprint.ts` 改 `id`、`number`、`topic`、`unit`、`project`（這個 Sprint 的小專案故事），`status: "current"`。
3. 在 `src/content/registry.ts` 的 `sprints` 加上它，並把上一個 Sprint 改成 `status: "done"`。
4. 在 `tickets.ts` 寫 ticket（見下一節）。

網站名稱在 `src/content/registry.ts` 的 `SITE_NAME`。

## 新增一張 ticket
在該 Sprint 的 `tickets.ts` 新增 `Ticket` 資料（說明、預測題、起始碼、唯讀測試檔、提示），
測試類別裡每個 `static void testXxx()` 方法就是一個測試，用 `tutor.Check` 斷言。
參考解答放 `tools/solutions/`，跑 `node --experimental-strip-types tools/verify-content.mjs` 驗證。

## AI 錯誤處理
| 情況 | 學生看到 |
|------|---------|
| OpenAI 額度用完（429 / insufficient_quota，含 monthly hard limit） | 「AI 助教這個月的使用額度已經用完了，請聯絡老師」 |
| 太頻繁（429 rate limit） | 「請等 30 秒再試，一直出現請聯絡老師」 |
| 超過每人每日上限 | 「今天的 AI 提問次數已經用完了」 |
| 沒有 API key / key 無效 | 「AI 助教還沒設定好，請聯絡老師」 |

所有請求（包含失敗）都會記錄，老師在 `/admin` 看得到。

## 注意
- CheerpJ 第一次載入需要下載 JVM（之後會快取），並需要連到 `cjrtnc.leaningtech.com`。
- CheerpJ 免費授權有使用條件，收費教學正式上線前請確認授權。
- 進度目前存在學生瀏覽器（localStorage），換電腦或清除瀏覽資料會不見。
- `tools/solutions/` 是參考解答，repo 若公開，學生可能看得到；需要的話把 repo 設成 private。
