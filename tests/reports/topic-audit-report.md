# 西洋占星本命盤主題分析：全題庫稽核

- 實際題數：54
- 每題測試命盤：3
- PASS：39
- WARNING：15
- FAIL：0

## 被三題以上共用的模板

- caution：留意{risk}（suitable_roles、suitable_environment、monetizable_skills、long_term_direction、family_context、career_strength、family_balance）— 句型共用，結論由語義欄位決定

## 完整題庫

### 我常遇到什麼類型的對象？（love-partner-type）— WARNING

- category / topicId：love / love
- intent / questionFocus：partner_profile / likely_partner_traits
- answerTargets：對方的個性傾向、對方的互動風格、你會重視對方的哪些特質
- detailLabels：對象的個性傾向、互動與相處風格、你會被什麼特質留住
- semanticKeys：likely_partner_traits:harmony@planet|Venus|6|4|+selfDirection、likely_partner_traits:emotionalResponse@angle|dsc|3||、likely_partner_traits:visibility@angle|dsc|4||+freedom
- fallback：33%
- 重複風險：title/detail 0；headline/detail 0.07；跨命盤 0.71
- WARNING：部分測試盤由空宮改採可追溯的宮主星資料

### 什麼特質最容易讓我心動？（love-attract-type）— PASS

- category / topicId：love / love
- intent / questionFocus：attraction_pattern / emotional_attraction
- answerTargets：你會主動被什麼特質吸引、互動中容易心動的瞬間
- detailLabels：容易被什麼特質吸引、什麼樣的互動最讓你心動
- semanticKeys：emotional_attraction:selfDirection@planet|Mars|0|10|、emotional_attraction:consistency@planet|Venus|1|6|+harmony、emotional_attraction:freedom@planet|Mars|10|11|+novelty
- fallback：0%
- 重複風險：title/detail 0.29；headline/detail 0；跨命盤 0.68

### 可能在什麼情境認識（love-meet-scene）— PASS

- category / topicId：love / love
- intent / questionFocus：context / meeting_context
- answerTargets：可能認識的場合或情境、適合建立連結的方式
- detailLabels：可能出現的場合、適合的認識情境
- semanticKeys：meeting_context:harmony@planet|Venus|6|4|+selfDirection、meeting_context:consistency@planet|Venus|1|6|+harmony、meeting_context:novelty@planet|Sun|10|11|+freedom
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 0.29

### 對方可能呈現的外型與氣質（love-appearance-vibe）— PASS

- category / topicId：love / love
- intent / questionFocus：appearance_and_vibe / partner_visual_impression
- answerTargets：外型風格傾向、氣場／氛圍給人的感覺
- detailLabels：外型風格傾向、氣場給人的感覺
- semanticKeys：partner_visual_impression:harmony@angle|dsc|6||、partner_visual_impression:emotionalResponse@angle|dsc|3||、partner_visual_impression:visibility@angle|dsc|4||
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 0.67

### 什麼樣的相處方式最適合我？（love-relationship-style）— WARNING

- category / topicId：love / love
- intent / questionFocus：style / preferred_relationship_style
- answerTargets：適合的相處模式、關係中你需要的節奏
- detailLabels：適合的相處模式、關係中的步調
- semanticKeys：preferred_relationship_style:visibility@planet|Moon|4|7|+harmony、preferred_relationship_style:emotionalResponse@planet|Moon|11|5|、preferred_relationship_style:freedom@planet|Sun|10|11|+visibility
- fallback：67%
- 重複風險：title/detail 0.2；headline/detail 0.06；跨命盤 0.67
- WARNING：部分測試盤由空宮改採可追溯的宮主星資料

### 我的感情優勢（love-strength）— PASS

- category / topicId：love / love
- intent / questionFocus：strength / relationship_strengths
- answerTargets：你在感情裡的優勢、別人容易感受到的部分
- detailLabels：你在感情裡的優勢、別人會感受到的部分
- semanticKeys：strength:harmony@planet|Venus|6|4|、strength:emotionalResponse@planet|Moon|11|5|、strength:visibility@planet|Moon|4|8|+freedom
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0.61；跨命盤 0.12

### 我的感情盲點（love-blindspot）— PASS

- category / topicId：love / love
- intent / questionFocus：challenge / relationship_blindspot
- answerTargets：容易忽略的相處盲點、壓力下容易出現的反應
- detailLabels：容易忽略的盲點、壓力下的反應
- semanticKeys：blindspot:harmony@planet|Venus|6|4|、blindspot:emotionalResponse@planet|Moon|11|5|+consistency、blindspot:freedom@planet|Sun|10|11|+novelty
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0.16；跨命盤 0.1

### 關係發生衝突後，我適合怎麼修復？（love-conflict-repair）— PASS

- category / topicId：love / love
- intent / questionFocus：direction / relationship_repair
- answerTargets：衝突後適合先做的事、重新建立溝通與信任的方式
- detailLabels：衝突後的第一步、修復關係的方式
- semanticKeys：relationship_repair:harmony@planet|Venus|6|4|、relationship_repair:emotionalResponse@planet|Moon|11|5|、relationship_repair:freedom@planet|Sun|10|11|+novelty
- fallback：0%
- 重複風險：title/detail 0.2；headline/detail 0.05；跨命盤 0.3

### 我適合負責哪些工作內容？（career-work-type）— PASS

- category / topicId：career / career
- intent / questionFocus：career_direction / suitable_roles
- answerTargets：適合的職能或角色、容易發揮的工作內容
- detailLabels：適合的職能角色、容易發揮的工作內容
- semanticKeys：suitable_roles:selfDirection@planet|Mars|0|10|、suitable_roles:structure@planet|Sun|9|10|+consistency、suitable_roles:novelty@planet|Venus|8|10|+freedom
- fallback：0%
- 重複風險：title/detail 0.29；headline/detail 0.09；跨命盤 0.21

### 適合什麼工作環境（career-work-env）— WARNING

- category / topicId：career / career
- intent / questionFocus：career_direction / suitable_environment
- answerTargets：適合的工作場域、舒適的工作節奏與氛圍
- detailLabels：適合的工作場域、舒適的步調與氛圍
- semanticKeys：suitable_environment:structure@angle|mc|9||+visibility、suitable_environment:consistency@planet|Venus|1|6|、suitable_environment:visibility@planet|Moon|4|8|+emotionalResponse
- fallback：67%
- 重複風險：title/detail 0；headline/detail 0.22；跨命盤 0.62
- WARNING：部分測試盤由空宮改採可追溯的宮主星資料

### 我在職場最拿手的是什麼？（career-core-skill）— PASS

- category / topicId：career / career
- intent / questionFocus：career_strength / workplace_advantages
- answerTargets：你最拿手的職場能力、別人會倚賴你的部分
- detailLabels：最拿手的職場能力、別人會倚賴你的部分
- semanticKeys：strength:selfDirection@planet|Mars|0|10|、strength:structure@planet|Saturn|9|10|、strength:freedom@planet|Uranus|10|1|+novelty
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0.07；跨命盤 0.18

### 適合穩定就業、自由工作或創業（career-work-mode）— PASS

- category / topicId：career / career
- intent / questionFocus：style / employment_mode
- answerTargets：適合的就業型態、你需要的自主程度
- detailLabels：適合的就業型態、你需要的自主程度
- semanticKeys：employment_mode:selfDirection@planet|Saturn|0|7|、employment_mode:structure@planet|Saturn|9|10|+consistency、employment_mode:novelty@planet|Pluto|8|4|+freedom
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 0.8

### 我的職涯盲點（career-blindspot）— PASS

- category / topicId：career / career
- intent / questionFocus：challenge / career_blindspot
- answerTargets：容易忽略的職涯風險、壓力下容易出現的反應
- detailLabels：容易忽略的職涯風險、壓力下的反應
- semanticKeys：blindspot:selfDirection@planet|Saturn|0|7|、blindspot:consistency@planet|Venus|1|6|+structure、blindspot:novelty@planet|Pluto|8|4|
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 0.16

### 如何建立長期職涯方向（career-longterm）— PASS

- category / topicId：career / career
- intent / questionFocus：direction / longterm_career_direction
- answerTargets：值得投入的長期方向、成熟階段的樣子
- detailLabels：值得投入的長期方向、成熟階段的樣子
- semanticKeys：longterm_career_direction:structure@angle|mc|9||+selfDirection、longterm_career_direction:consistency@planet|Venus|1|6|+harmony、longterm_career_direction:depthTrust@angle|mc|7||+novelty
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0.21；跨命盤 0.21

### 容易在哪些領域獲得成就感（career-fulfillment）— PASS

- category / topicId：career / career
- intent / questionFocus：value / career_fulfillment_area
- answerTargets：容易獲得成就感的領域、你真正在意的職場回饋
- detailLabels：容易獲得成就感的領域、你在意的職場回饋
- semanticKeys：career_fulfillment_area:selfDirection@planet|Mars|0|10|、career_fulfillment_area:structure@planet|Sun|9|10|、career_fulfillment_area:novelty@planet|Venus|8|10|
- fallback：0%
- 重複風險：title/detail 0.38；headline/detail 0.5；跨命盤 0.42

### 我在家庭中習慣扮演的角色（family-role）— WARNING

- category / topicId：family / family
- intent / questionFocus：profile / family_role
- answerTargets：你習慣扮演的角色、家人容易依賴你的部分
- detailLabels：你習慣扮演的角色、家人依賴你的部分
- semanticKeys：role:harmony@planet|Venus|6|4|、role:structure@planet|Mars|5|8|+selfDirection、role:novelty@planet|Pluto|8|4|
- fallback：33%
- 重複風險：title/detail 0；headline/detail 0.08；跨命盤 0.26
- WARNING：部分測試盤由空宮改採可追溯的宮主星資料

### 原生家庭如何影響我（family-origin-impact）— PASS

- category / topicId：family / family
- intent / questionFocus：origin / family_origin_impact
- answerTargets：原生家庭留下的慣性、延續或需要修正的模式
- detailLabels：原生家庭留下的慣性、值得修正的模式
- semanticKeys：family_origin_impact:emotionalResponse@angle|ic|3||、family_origin_impact:selfDirection@angle|ic|0||、family_origin_impact:consistency@angle|ic|1||
- fallback：0%
- 重複風險：title/detail 0.29；headline/detail 0；跨命盤 0.46

### 和家人之間，我需要守住哪些底線（family-boundary）— WARNING

- category / topicId：family / family
- intent / questionFocus：challenge / family_boundary_setting
- answerTargets：需要練習劃清的底線、容易被跨越的地方
- detailLabels：需要練習的底線、容易被跨越的地方
- semanticKeys：family_boundary_setting:harmony@planet|Venus|6|4|、family_boundary_setting:structure@planet|Mars|5|8|+selfDirection、family_boundary_setting:novelty@planet|Pluto|8|4|
- fallback：33%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 0.33
- WARNING：部分測試盤由空宮改採可追溯的宮主星資料

### 我適合怎樣的居住環境（family-living-env）— PASS

- category / topicId：family / family
- intent / questionFocus：environment / living_environment
- answerTargets：適合的居住條件、讓你安心的家庭氛圍
- detailLabels：適合的居住條件、讓你安心的氛圍
- semanticKeys：living_environment:harmony@planet|Venus|6|4|+emotionalResponse、living_environment:selfDirection@angle|ic|0||、living_environment:novelty@planet|Pluto|8|4|+consistency
- fallback：0%
- 重複風險：title/detail 0.2；headline/detail 0；跨命盤 0.29

### 如何建立內在安全感（family-inner-safety）— PASS

- category / topicId：family / family
- intent / questionFocus：safety / inner_safety_practice
- answerTargets：能讓你安定下來的方式、值得練習的自我照顧
- detailLabels：能讓你安定的方式、值得練習的照顧方式
- semanticKeys：inner_safety_practice:emotionalResponse@angle|ic|3||+harmony、inner_safety_practice:selfDirection@angle|ic|0||、inner_safety_practice:consistency@angle|ic|1||
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 0.37

### 家庭與事業如何平衡（family-work-balance）— PASS

- category / topicId：family / family
- intent / questionFocus：direction / family_career_balance
- answerTargets：家庭與事業如何互相支援、容易失衡的方向
- detailLabels：家庭與事業的關係、容易失衡的方向
- semanticKeys：family_career_balance:emotionalResponse@angle|ic|3||+structure、family_career_balance:selfDirection@angle|ic|0||+harmony、family_career_balance:depthTrust@angle|mc|7||+novelty
- fallback：0%
- 重複風險：title/detail 0.5；headline/detail 0；跨命盤 0.28

### 壓力大時，我通常會出現哪些反應？（health-stress-pattern）— PASS

- category / topicId：health / health
- intent / questionFocus：pattern / stress_reaction_pattern
- answerTargets：壓力來臨時的直覺反應、容易忽略的身體訊號
- detailLabels：壓力來臨時的反應、容易忽略的訊號
- semanticKeys：stress_reaction_pattern:selfDirection@planet|Sun|0|1|、stress_reaction_pattern:structure@angle|asc|9||、stress_reaction_pattern:freedom@planet|Uranus|10|1|+novelty
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 0.36

### 哪種生活習慣較適合我（health-lifestyle-fit）— WARNING

- category / topicId：health / health
- intent / questionFocus：fit / lifestyle_fit
- answerTargets：適合的生活步調、容易維持的作息方式
- detailLabels：適合的生活步調、容易維持的作息
- semanticKeys：lifestyle_fit:visibility@planet|Mercury|4|3|+selfDirection、lifestyle_fit:consistency@planet|Venus|1|6|、lifestyle_fit:visibility@planet|Moon|4|8|+emotionalResponse
- fallback：67%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 0.16
- WARNING：部分測試盤由空宮改採可追溯的宮主星資料

### 我容易忽略身體的哪些警訊（health-body-boundary）— PASS

- category / topicId：health / health
- intent / questionFocus：challenge / body_boundary_blindspot
- answerTargets：容易忽略的身體警訊、硬撐的習慣
- detailLabels：容易忽略的警訊、硬撐的習慣
- semanticKeys：blindspot:selfDirection@planet|Sun|0|1|、blindspot:structure@angle|asc|9||+emotionalResponse、blindspot:freedom@angle|asc|10||+novelty
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 0.16

### 什麼方式最能幫我恢復精力？（health-self-care）— WARNING

- category / topicId：health / health
- intent / questionFocus：safety / recovery_method
- answerTargets：真正有恢復效果的活動、適合安排的休息節奏
- detailLabels：有效的恢復方式、適合的休息節奏
- semanticKeys：recovery_method:selfDirection@planet|Saturn|0|7|+visibility、recovery_method:consistency@planet|Venus|1|6|、recovery_method:visibility@planet|Moon|4|8|+dialogue
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0.05；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 哪些日常情境最容易消耗我的能量？（health-energy-drain）— WARNING

- category / topicId：health / health
- intent / questionFocus：challenge / energy_drain_contexts
- answerTargets：容易消耗能量的日常情境、需要降低負荷的環境條件
- detailLabels：容易消耗你的情境、需要降低的負荷
- semanticKeys：energy_drain_contexts:selfDirection@planet|Saturn|0|7|+visibility、energy_drain_contexts:consistency@planet|Neptune|1|12|、energy_drain_contexts:emotionalResponse@planet|Moon|4|8|+visibility
- fallback：67%
- 重複風險：title/detail 0.33；headline/detail 0.05；跨命盤 0.59
- WARNING：部分測試盤由空宮改採可追溯的宮主星資料

### 我適合靠哪種收入模式賺錢？（wealth-earning-style）— PASS

- category / topicId：wealth / wealth
- intent / questionFocus：pattern / earning_style
- answerTargets：主要的賺錢方式、容易發揮的財務行動
- detailLabels：主要的賺錢方式、容易發揮的行動
- semanticKeys：earning_style:harmony@planet|Venus|6|4|+structure、earning_style:harmony@angle|mc|6||、earning_style:harmony@planet|Neptune|6|3|+depthTrust
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0.68；跨命盤 0.56

### 哪些能力最容易替我帶來收入？（wealth-monetizable）— WARNING

- category / topicId：wealth / wealth
- intent / questionFocus：capability / wealth_monetizable_skills
- answerTargets：較容易變現的能力、市場願意付費的部分
- detailLabels：較容易變現的能力、市場願意付費的部分
- semanticKeys：wealth_monetizable_skills:harmony@planet|Venus|6|4|、wealth_monetizable_skills:novelty@planet|Uranus|11|11|+freedom、wealth_monetizable_skills:harmony@planet|Neptune|6|3|
- fallback：100%
- 重複風險：title/detail 0；headline/detail 0.2；跨命盤 0.74
- WARNING：部分測試盤由空宮改採可追溯的宮主星資料

### 我的消費與儲蓄模式（wealth-spend-save）— WARNING

- category / topicId：wealth / wealth
- intent / questionFocus：pattern / spend_save_pattern
- answerTargets：消費與儲蓄的習慣、面對金錢的直覺反應
- detailLabels：消費與儲蓄的習慣、面對金錢的直覺反應
- semanticKeys：spend_save_pattern:harmony@planet|Venus|6|4|、spend_save_pattern:freedom@planet|Uranus|11|11|+structure、spend_save_pattern:harmony@planet|Neptune|6|3|
- fallback：100%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 0.82
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同；部分測試盤由空宮改採可追溯的宮主星資料

### 我對財務風險的態度（wealth-risk-attitude）— PASS

- category / topicId：wealth / wealth
- intent / questionFocus：challenge / risk_attitude
- answerTargets：面對財務風險的直覺反應、容易高估或低估的部分
- detailLabels：面對風險的直覺反應、容易高估或低估的部分
- semanticKeys：risk_attitude:harmony@planet|Pluto|6|10|+depthTrust、risk_attitude:structure@planet|Sun|9|10|、risk_attitude:dialogue@planet|Mercury|2|11|
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0.1；跨命盤 0.39

### 適合個人收入還是合作資源（wealth-solo-or-shared）— PASS

- category / topicId：wealth / wealth
- intent / questionFocus：fit / solo_or_shared_resource
- answerTargets：適合的資源運用方式、合作或獨立的傾向
- detailLabels：適合的資源運用方式、合作或獨立的傾向
- semanticKeys：solo_or_shared_resource:harmony@planet|Venus|6|4|+dialogue、solo_or_shared_resource:structure@planet|Sun|9|10|+selfDirection、solo_or_shared_resource:dialogue@planet|Mercury|2|11|+emotionalResponse
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 0.33

### 我的財務盲點（wealth-blindspot）— PASS

- category / topicId：wealth / wealth
- intent / questionFocus：challenge / financial_blindspot
- answerTargets：容易忽略的財務風險、壓力下容易出現的財務反應
- detailLabels：容易忽略的風險、壓力下的財務反應
- semanticKeys：blindspot:harmony@planet|Venus|6|4|、blindspot:structure@planet|Sun|9|10|、blindspot:dialogue@planet|Mercury|2|11|
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 0.14

### 如何建立更穩定的財務結構（wealth-stable-structure）— PASS

- category / topicId：wealth / wealth
- intent / questionFocus：direction / stable_financial_structure
- answerTargets：值得投入的財務方向、長期穩定的做法
- detailLabels：值得投入的方向、長期穩定的做法
- semanticKeys：stable_financial_structure:structure@angle|mc|9||+harmony、stable_financial_structure:harmony@angle|mc|6||、stable_financial_structure:depthTrust@angle|mc|7||+harmony
- fallback：0%
- 重複風險：title/detail 0.2；headline/detail 0.21；跨命盤 0.57

### 我給人的第一印象（social-first-impression）— PASS

- category / topicId：social / social
- intent / questionFocus：impression / first_impression
- answerTargets：別人對你的第一印象、還沒熟識前會注意到的樣子
- detailLabels：別人對你的第一印象、還沒熟識前會注意到的樣子
- semanticKeys：role:selfDirection@angle|asc|0||、role:structure@angle|asc|9||、role:freedom@angle|asc|10||+novelty
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0.08；跨命盤 0.24

### 我的溝通風格（social-comm-style）— WARNING

- category / topicId：social / social
- intent / questionFocus：style / communication_style
- answerTargets：你習慣的表達方式、容易讓對方感覺到的溝通特質
- detailLabels：你習慣的表達方式、對方會感覺到的特質
- semanticKeys：communication_style:visibility@planet|Mercury|4|3|+dialogue、communication_style:consistency@planet|Neptune|1|12|、communication_style:harmony@planet|Neptune|6|3|+freedom
- fallback：33%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 0.07
- WARNING：部分測試盤由空宮改採可追溯的宮主星資料

### 我在人群中的角色（social-group-role）— WARNING

- category / topicId：social / social
- intent / questionFocus：profile / group_role
- answerTargets：你在群體中習慣扮演的角色、別人會找你做的事
- detailLabels：你在群體中的角色、別人會找你做的事
- semanticKeys：role:dialogue@planet|Uranus|2|8|+novelty、role:emotionalResponse@planet|Pluto|3|1|、role:dialogue@planet|Mercury|2|11|+novelty
- fallback：33%
- 重複風險：title/detail 0；headline/detail 0.09；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同；部分測試盤由空宮改採可追溯的宮主星資料

### 我的人際優勢（social-strength）— PASS

- category / topicId：social / social
- intent / questionFocus：strength / social_strengths
- answerTargets：你在人際中的優勢、別人容易依賴你的部分
- detailLabels：你在人際中的優勢、別人依賴你的部分
- semanticKeys：strength:selfDirection@angle|asc|0||+harmony、strength:structure@angle|asc|9||+consistency、strength:novelty@planet|Venus|8|10|+freedom
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0.61；跨命盤 0.18

### 我的底線與面對衝突的方式（social-boundary-conflict）— PASS

- category / topicId：social / social
- intent / questionFocus：tension / boundary_conflict_pattern
- answerTargets：面對衝突時的直覺反應、容易被跨過的底線
- detailLabels：面對衝突的反應、容易被跨過的底線
- semanticKeys：boundary_conflict_pattern:harmony@planet|Venus|6|4|、boundary_conflict_pattern:emotionalResponse@planet|Moon|11|5|、boundary_conflict_pattern:visibility@planet|Sun|10|11|+freedom
- fallback：0%
- 重複風險：title/detail 0.6；headline/detail 0；跨命盤 0.38

### 什麼樣的朋友圈最適合我？（social-circle-fit）— WARNING

- category / topicId：social / social
- intent / questionFocus：fit / social_circle_fit
- answerTargets：適合你的社交圈類型、讓你自在的群體氛圍
- detailLabels：適合的社交圈類型、讓你自在的群體氛圍
- semanticKeys：social_circle_fit:dialogue@planet|Uranus|2|8|+novelty、social_circle_fit:emotionalResponse@planet|Pluto|3|1|、social_circle_fit:novelty@planet|Sun|10|11|+freedom
- fallback：33%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 0.75
- WARNING：部分測試盤由空宮改採可追溯的宮主星資料

### 我用什麼方法最容易學會？（study-learning-style）— WARNING

- category / topicId：study / study
- intent / questionFocus：style / learning_style
- answerTargets：適合的學習方式、容易吸收的教學節奏
- detailLabels：適合的學習方式、容易吸收的節奏
- semanticKeys：learning_style:visibility@planet|Mercury|4|3|+dialogue、learning_style:consistency@planet|Neptune|1|12|、learning_style:harmony@planet|Neptune|6|3|+freedom
- fallback：33%
- 重複風險：title/detail 0；headline/detail 0.06；跨命盤 0.73
- WARNING：部分測試盤由空宮改採可追溯的宮主星資料

### 我的資訊理解與記憶模式（study-memory-mode）— PASS

- category / topicId：study / study
- intent / questionFocus：pattern / memory_mode
- answerTargets：理解新資訊的方式、容易記住的資訊類型
- detailLabels：理解新資訊的方式、容易記住的類型
- semanticKeys：memory_mode:selfDirection@planet|Saturn|0|7|+visibility、memory_mode:structure@planet|Saturn|9|10|、memory_mode:dialogue@planet|Mercury|2|11|
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 0.63

### 容易拖延或分心的原因（study-procrastination）— PASS

- category / topicId：study / study
- intent / questionFocus：challenge / procrastination_root
- answerTargets：容易拖延的根本原因、分心時常見的觸發點
- detailLabels：拖延的根本原因、分心的常見觸發點
- semanticKeys：procrastination_root:selfDirection@planet|Saturn|0|7|+visibility、procrastination_root:consistency@planet|Neptune|1|12|+structure、procrastination_root:freedom@planet|Uranus|10|1|+dialogue
- fallback：0%
- 重複風險：title/detail 0.17；headline/detail 0；跨命盤 0.68

### 我比較適合學習哪一類內容？（study-mode-fit）— PASS

- category / topicId：study / study
- intent / questionFocus：fit / study_mode_fit
- answerTargets：適合的知識類型、容易發揮實力的學習形式
- detailLabels：適合的知識類型、容易發揮實力的形式
- semanticKeys：study_mode_fit:novelty@planet|Jupiter|8|9|、study_mode_fit:dialogue@planet|Mercury|5|10|+structure、study_mode_fit:novelty@planet|Venus|8|10|
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 0.55

### 海外學習或高等教育傾向（study-overseas）— PASS

- category / topicId：study / study
- intent / questionFocus：direction / overseas_education_direction
- answerTargets：海外或高等教育的傾向、值得投入的長期學習方向
- detailLabels：適合拓展的能力、現實條件要先確認
- semanticKeys：overseas_education_direction:novelty@planet|Jupiter|8|9|、overseas_education_direction:depthTrust@planet|Jupiter|7|9|+novelty、overseas_education_direction:harmony@planet|Jupiter|6|9|+novelty
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 0.72

### 我如何安排讀書時間比較有效？（study-rhythm）— WARNING

- category / topicId：study / study
- intent / questionFocus：safety / study_rhythm
- answerTargets：適合的讀書節奏、維持專注的方式
- detailLabels：適合的讀書節奏、維持專注的方式
- semanticKeys：study_rhythm:selfDirection@planet|Saturn|0|7|+visibility、study_rhythm:consistency@planet|Venus|1|6|、study_rhythm:dialogue@planet|Saturn|2|1|
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 我的學習優勢與盲點（study-strength-blindspot）— PASS

- category / topicId：study / study
- intent / questionFocus：strength / study_strength_blindspot
- answerTargets：學習上的明顯優勢、需要留意的學習盲點
- detailLabels：學習上的優勢、需要留意的盲點
- semanticKeys：blindspot:visibility@planet|Mercury|4|3|、blindspot:consistency@planet|Neptune|1|12|、blindspot:novelty@planet|Mars|10|11|+dialogue
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 0.28

### 我適合用什麼成果證明自己學會了？（study-mastery-evidence）— PASS

- category / topicId：study / study
- intent / questionFocus：capability / mastery_evidence
- answerTargets：適合展現學習成果的形式、判斷自己真正學會的標準
- detailLabels：適合的成果形式、真正學會的判斷標準
- semanticKeys：mastery_evidence:novelty@planet|Jupiter|8|9|+visibility、mastery_evidence:consistency@planet|Neptune|1|12|+structure、mastery_evidence:novelty@planet|Venus|8|10|
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 0.67

### 如何把學到的知識真正用出來？（study-knowledge-application）— PASS

- category / topicId：study / study
- intent / questionFocus：direction / knowledge_application
- answerTargets：把知識轉成行動或作品的方式、適合的輸出與練習形式
- detailLabels：把知識用出來的方式、適合的輸出形式
- semanticKeys：knowledge_application:novelty@planet|Jupiter|8|9|+visibility、knowledge_application:practicalCare@planet|Mercury|5|10|+dialogue、knowledge_application:novelty@planet|Venus|8|10|+freedom
- fallback：0%
- 重複風險：title/detail 0.14；headline/detail 0.53；跨命盤 0.75

### 命盤中最重要的三個人生課題是什麼？（general-top-themes）— PASS

- category / topicId：general / general
- intent / questionFocus：overview / top_life_themes
- answerTargets：命盤中最突出的主題、這些主題彼此的關聯
- detailLabels：命盤中最突出的主題、主題之間的關聯
- semanticKeys：top_life_themes:selfDirection@planet|Sun|0|1|、top_life_themes:structure@planet|Sun|9|10|、top_life_themes:novelty@planet|Venus|8|10|+freedom
- fallback：0%
- 重複風險：title/detail 0.29；headline/detail 0；跨命盤 0.71

### 我的核心優勢（general-core-strength）— PASS

- category / topicId：general / general
- intent / questionFocus：strength / core_strength
- answerTargets：命盤中最核心的優勢、這股優勢展現的方式
- detailLabels：命盤中最核心的優勢、這股優勢展現的方式
- semanticKeys：strength:selfDirection@planet|Mars|0|10|、strength:structure@planet|Saturn|9|10|、strength:freedom@planet|Uranus|10|1|
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0.07；跨命盤 0.28

### 最容易反覆出現的課題（general-recurring-issue）— PASS

- category / topicId：general / general
- intent / questionFocus：challenge / recurring_life_issue
- answerTargets：反覆出現的核心課題、這個課題通常出現的情境
- detailLabels：反覆出現的課題、通常出現的情境
- semanticKeys：blindspot:consistency@point|Node|1||+selfDirection、blindspot:structure@planet|Saturn|9|10|+freedom、blindspot:emotionalResponse@point|Node|3||+dialogue
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0.16；跨命盤 0.2

### 適合優先發展的方向（general-priority-direction）— PASS

- category / topicId：general / general
- intent / questionFocus：direction / priority_direction
- answerTargets：值得優先投入的方向、這個方向成熟後的樣子
- detailLabels：值得優先投入的方向、成熟後的樣子
- semanticKeys：priority_direction:selfDirection@planet|Mars|0|10|、priority_direction:structure@planet|Saturn|9|10|、priority_direction:freedom@planet|Uranus|10|1|+novelty
- fallback：0%
- 重複風險：title/detail 0.14；headline/detail 0.05；跨命盤 0.27

### 如何平衡目前的內在矛盾（general-inner-tension）— PASS

- category / topicId：general / general
- intent / questionFocus：tension / inner_tension_balance
- answerTargets：內在拉扯的兩股力量、練習整合的方向
- detailLabels：內在拉扯的兩股力量、練習整合的方向
- semanticKeys：inner_tension_balance:selfDirection@aspect|Mars-Sun:conjunction|||+visibility、inner_tension_balance:selfDirection@aspect|Mars-Sun:trine|||+visibility
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0.68；跨命盤 0.29

### 面對重大選擇時，我最可靠的判斷依據是什麼？（general-decision-basis）— PASS

- category / topicId：general / general
- intent / questionFocus：direction / major_decision_basis
- answerTargets：重大選擇時最可靠的判斷原則、辨認方向是否適合的條件
- detailLabels：做決定時先確認什麼、方向適合你的具體訊號
- semanticKeys：major_decision_basis:selfDirection@planet|Mars|0|10|、major_decision_basis:structure@planet|Saturn|9|10|、major_decision_basis:freedom@planet|Uranus|10|1|+novelty
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0.75；跨命盤 0.46

