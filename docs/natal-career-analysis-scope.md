# 人生主題事業分析修正

Goal: 讓工作任務、環境、優勢三題由實際命盤配置與不同評分規則產生，保留可追溯的正負貢獻。
Allowed files: `js/data/astro-advanced.js` 的職涯分析與主題管線、專用測試／報告、既有職涯多樣性與重複檢查（遵循相似盤可相似及摘要可附詳細證據）、`package.json` 測試命令，以及 `index.html`／`sw.js` 對應資產版本。
Protected behavior: 天文計算、宮位制、相位容許度、命盤／歷史儲存格式、題目 ID、既有 UI／視覺及其他 51 題。
Acceptance checks: 六張由正式排盤器計算的虛構命盤；來源與加減分可重算；穩定性、相關／無關變動、未知時間、單題／合併選題一致性；全站 npm test；本機瀏覽器換盤、三題顯示及儲存回歸。
Out of scope: 重排星盤、AI 改寫、隨機／輪替推薦、UI 重設、部署、舊快照更新。

## 修改前證據

完整輸出：`tests/reports/natal-career-before.json`。六張虛構出生資料經 `computeNatalChart` 使用正式 Astronomy Engine、回歸黃道、Placidus、Asia/Taipei 計算，沒有手改星曜或宮位。

正式路徑：出生欄位 → `validateBirthDate` → `astroGenerate`（或 `astroApplyChartRecord`／`astroLoadProfile`）→ `computeNatalChart` → `state.astroResult` → `natalTopicGenerate` → `analyzeNatalTopic` → `getTopicIndicators`／`extractChartEvidence` → `applyEvidenceBias`／`natalSemanticProfile` → `applyFocusedQuestionContentPlan` → `applySemanticKnowledgeContentPlan` → Question Contract → `renderNatalTopicResult`／`renderNatalTopicQuestionCard`。塔羅混合模式的 `astroCategoryReadingCareer` 不是此入口。

1. 輸入→計算：`astroGenerate`／`astroApplyChartRecord` 使用既有 `computeNatalChart`；行星黃經、星座、宮位、宮頭與相位都有產生。六張指紋分別為 806b91b2、3fc1126f、099ef900、d8a4375b、754e4947、24511069，內容不同。
2. 特徵提取：`NATAL_TOPIC_QUESTIONS.career` 的工作內容題只有 MC、十宮行星／主星、太陽、命主星，沒有第二／六宮、水星、火星、土星及相關相位的完整職涯關聯。環境和能力各有不同指標，但沒有職涯任務的候選集評分。
3. `buildQuestionContentRaw` 先 `applyEvidenceBias`、`pickPrimaryEvidence`，只取 top／second／third 產生各段。`natalSemanticProfile` 只看前八筆，整合行星本質、落座；其他維度縮成背景，沒有任務對應的負向適配規則。
4. `PLANET_TOPIC_KNOWLEDGE.*.suitable_roles` 是固定行星句，星座在這條路徑主要作為修飾。兩張不同測試盤（spring-action 與 autumn-design）同樣出現「適合制度建立、品質控管或長期負責的角色」，雖然土星分別在水瓶十宮與射手八宮。
5. `applySemanticQuestionPlan` 原本已先使用最高語意維度，但 `applyFocusedQuestionContentPlan` 的最後一支會再呼叫 `applySemanticKnowledgeContentPlan`，以 top／second／third 行星生成 knowledge entry，覆蓋前面算出的內容。`ASTRO_TOPIC_SEMANTIC_DATASET.career_strength` 的 `核心職場競爭力是{gift}` 最終取代分數主導的標題。winter-structure 最高為 structure 12.1，卻產生水星共用的「核心職場競爭力是學習、表達與整理複雜資訊」。summer-care 的最高為 dialogue 11.3，標題卻是太陽共用的主導／決策。分數沒有完整驅動最終結論。
6. 問題對應：三題 ID／questionFocus／answerTarget 不同，並非實際共用同一份答案物件；但共用文字規劃與少量行星知識，且同批次 usedPrimaryKeys 會改變證據排序。新三題應不受其他選題影響。
7. UI：`renderNatalTopicQuestionCard` 不顯示正常答案的 summary，只呈現 `visibleNatalDetails(a).slice(0, 2)`。因此環境六軸、推薦理由和主要／次要優勢必須完整放在現有兩個 detail 區塊與 caution，不能只增加被截掉的分項。
8. 狀態：換盤 `astroApplyChartRecord` 會重算並呼叫 `resetNatalTopicAnalysisForChartChange`；`renderNatalTopicSection` 另比對指紋。分析函式本身沒有跨盤 memo cache。未發現這次趨同由 activeId 或快取錯盤造成；原指紋未含宮頭／顯式相位，本次補齊新評分器實際使用的資料，避免依賴不完整。
9. 使用者列出的四個逐字標籤在本機正式原始碼未出現；六張修改前結果也未全部相同。無原始三盤資料／當時載入資產，不能聲稱重現那個精確案例。已重現且修正的是：不同盤被壓成少數行星固定建議，以及最高分與標題脫節。

## 後續明確核准

2026-10-27：使用者回覆「核准，只更新這 36 份職涯快照」。因此原本 out-of-scope 的快照更新已獲得此一限定授權。更新後逐筆驗證：只有審閱過的 36 份職涯案例改變，其餘 612 份完全不變，未擴大到其他題目。
