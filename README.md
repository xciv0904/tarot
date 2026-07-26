# Mystic Deck｜塔羅・雷諾曼・西洋占星

![Mystic Deck 預覽](assets/og.png)

Mystic Deck 是一個以繁體中文設計的免費線上占卜與星盤工具，整合塔羅牌、雷諾曼牌、西洋占星本命盤、行運、合盤與二次推運。

網站採用純 HTML、CSS 與 JavaScript 製作，不需要註冊帳號或後端伺服器，可直接部署到 GitHub Pages。

**線上使用：** [https://xciv0904.github.io/tarot/](https://xciv0904.github.io/tarot/)

## 主要功能

### 塔羅與雷諾曼占卜

- Rider–Waite–Smith 塔羅牌 78 張
- 傳統雷諾曼牌 36 張
- 多種單張與多張牌陣
- 塔羅正位、逆位解讀
- 雷諾曼牌組合與大牌陣
- 依抽牌結果產生白話解讀
- 儲存與查看歷史占卜紀錄
- 將占卜資料整理成可複製給 AI 的文字

### 牌典與學習

- 完整塔羅與雷諾曼牌義
- 關鍵詞、象徵與實際情境解讀
- 塔羅牌義測驗
- 大阿爾克那學習進度
- 雷諾曼組合速查與記憶方法

### 西洋占星

- 十大行星、上升、天頂與十二宮
- 行星落座、落宮與主要相位
- 元素與模式比例
- 本命星盤輪盤
- 每日、本週、本月與年度運勢
- 雙人合盤
- 二次推運
- 28 星宿參考功能
- 出生資料匯出與匯入

### 人生主題分析

使用者可以從 8 個主題、54 個具體問題中選擇最多 3 題：

- 愛情
- 事業
- 家庭
- 健康
- 財運
- 人際
- 學習
- 綜合人生主題

分析流程會先整理星盤證據、合併重複配置，再依題目意圖轉換成白話回答。不同問題使用不同的回答目標，例如：

- 「我常遇到什麼類型的對象？」描述對方個性與互動表現。
- 「我適合負責哪些工作內容？」描述工作角色與職能。
- 「哪些日常情境最容易消耗我的能量？」描述具體生活情境。
- 「如何把學到的知識真正用出來？」描述輸出與應用方式。

專業配置、權重與判斷來源預設收合在「查看占星判斷依據」中，正文以一般使用者能理解的內容為主。

## 解讀架構

人生主題分析不是直接把占星配置逐條翻譯，而是使用分層流程：

```text
原始星盤資料
→ Evidence 標準化
→ Canonical Evidence 去重
→ Question Definition 題目定義
→ Astrology Knowledge Dataset
→ Topic / Question Focus 投影
→ Content Planner
→ 可讀性與重複檢查
→ 前端顯示
```

主要目標是避免：

- 不同問題得到相同答案
- 同一配置在全文重複出現
- 外型問題回答成情緒管理
- 工作問題顯示難懂的占星術語
- 標題、摘要、細節與提醒只是換句話說
- 證據不足時用模糊句子填滿內容

## 技術特色

- Vanilla JavaScript
- 單頁式前端介面
- 響應式深色 UI
- PWA manifest 與 Service Worker 快取
- 瀏覽器 `localStorage` 儲存個人資料與使用紀錄
- 占星資料檔按需載入
- [Astronomy Engine 2.1.19](https://github.com/cosinekitty/astronomy) 計算天體位置
- 無大型前端框架
- 無後端資料庫
- 無內建 AI API

「複製給 AI 解讀」只會在瀏覽器中整理文字並複製到剪貼簿，不會自行將資料傳送給 ChatGPT、Claude、Gemini 或其他外部服務。

## 專案結構

```text
tarot/
├── index.html
├── manifest.json
├── sw.js
├── js/
│   ├── app.js
│   └── data/
│       ├── card-images.js
│       ├── reading-data.js
│       ├── astrology-core-data.js
│       ├── astrology-points-data.js
│       ├── astrology-placement-templates.js
│       ├── astrology-aspect-data.js
│       ├── astrology-knowledge-layer.js
│       ├── astrology-knowledge-dataset.js
│       └── astrology-natal-topics-data.js
├── assets/
│   ├── cards/
│   ├── vendor/
│   └── icons
└── tests/
    ├── golden-charts.js
    ├── natal-golden-regression.js
    ├── snapshots/
    └── reports/
```

## 在本機執行

這是靜態網站，不需要建置流程。請避免直接以 `file://` 開啟，建議在專案根目錄啟動本機伺服器：

```bash
git clone https://github.com/xciv0904/tarot.git
cd tarot
python3 -m http.server 8000
```

然後開啟：

```text
http://localhost:8000
```

也可以使用其他靜態伺服器，例如 VS Code Live Server。

## 測試

需要安裝 Node.js。專案目前不需要另外安裝 npm 套件。

執行語法檢查與完整回歸測試：

```bash
npm test
```

只執行 JavaScript 語法檢查：

```bash
npm run check
```

重新產生黃金測試快照與品質報告：

```bash
npm run test:golden:update
```

目前的主題分析回歸測試包含：

- 12 張結構差異明顯的 Golden Test Charts
- 54 個人生主題問題
- 共 648 份批次生成答案
- Question Focus 映射檢查
- Knowledge Dataset 覆蓋率檢查
- 標題、摘要、細節與提醒的重複檢查
- 答非所問與空泛句型檢查
- 技術術語洩漏檢查
- 空白、`undefined` 與 `NaN` 檢查

測試結果可在以下檔案查看：

- `tests/reports/natal-topic-quality.md`
- `tests/reports/natal-topic-human-review.md`
- `tests/snapshots/natal-topic-baseline.json`

## 部署

網站可直接使用 GitHub Pages 部署：

1. 將程式推送到 GitHub 儲存庫。
2. 進入 **Settings → Pages**。
3. 將來源設為 `main` 分支的根目錄。
4. 等待 GitHub Pages 完成部署。

更新 Service Worker 快取內容時，請同步調整 `sw.js` 的快取版本，避免使用者持續看到舊檔案。

## 隱私

- 出生資料、占卜紀錄與學習進度主要儲存在使用者瀏覽器的 `localStorage`。
- 專案目前沒有帳號系統或後端資料庫。
- 清除瀏覽器網站資料後，本機紀錄也會一併消失。
- 星盤功能提供匯出與匯入，方便使用者自行備份。
- 使用者若主動將內容貼到外部 AI，資料處理方式應以該服務的隱私政策為準。

## 解讀限制

塔羅、雷諾曼與占星內容屬於象徵性分析與自我探索工具，不應取代：

- 醫療診斷與治療
- 心理專業協助
- 法律意見
- 財務或投資建議
- 重要人生決策中的現實查證

星盤分析描述的是較容易出現的傾向，不是確定事件或宿命預言。

## 圖像與第三方套件

- Rider–Waite–Smith 塔羅牌由 Pamela Colman Smith 繪製，原始版本於 1909 年出版，屬公有領域素材。
- 雷諾曼牌面為本站依傳統 36 張牌象徵重新繪製的圖像。
- Astronomy Engine 由 Donald Cross 開發，採用 MIT License；相關說明位於 `assets/vendor/README.md`。

## 授權

此儲存庫目前沒有另外提供專案授權條款。除上述公有領域素材與第三方套件各自適用的授權外，網站程式、原創文字與原創圖像的使用方式以專案作者後續公布的條款為準。

