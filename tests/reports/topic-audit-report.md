# 西洋占星本命盤主題分析：全題庫稽核

- 實際題數：54
- 每題測試命盤：12
- PASS：1
- WARNING：53
- FAIL：0

- 實際輸出總數：648

## 被三題以上共用的模板

- caution：留意{risk}（suitable_roles、suitable_environment、monetizable_skills、long_term_direction、family_context、career_strength、family_balance）— 句型共用，結論由語義欄位決定

## 完整題庫

### 我常遇到什麼類型的對象？（love-partner-type）— WARNING

- category / topicId：love / love
- intent / questionFocus：partner_profile / likely_partner_traits
- answerTarget：partner_personality
- answerTargets：對方的個性傾向、對方的互動風格、你會重視對方的哪些特質
- detailLabels：對象的個性傾向、互動與相處風格、你會被什麼特質留住
- semanticKeys：likely_partner_traits:harmony@planet|Venus|6|4|+selfDirection、likely_partner_traits:emotionalResponse@angle|dsc|3||、likely_partner_traits:visibility@angle|dsc|4||+freedom、likely_partner_traits:depthTrust@planet|Venus|7|7|+structure、likely_partner_traits:selfDirection@planet|Mars|0|10|、likely_partner_traits:freedom@planet|Mercury|10|12|+practicalCare、likely_partner_traits:visibility@planet|Moon|4|7|+harmony、likely_partner_traits:depthTrust@angle|dsc|7||、likely_partner_traits:harmony@planet|Moon|6|7|、likely_partner_traits:emotionalResponse@angle|dsc|11||+structure、likely_partner_traits:dialogue@angle|dsc|2||、likely_partner_traits:consistency@planet|Venus|1|4|+freedom
- fallback：17%
- 重複風險：title/detail 0；headline/detail 0.18；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同；部分測試盤由空宮改採可追溯的宮主星資料

### 什麼特質最容易讓我心動？（love-attract-type）— WARNING

- category / topicId：love / love
- intent / questionFocus：attraction_pattern / emotional_attraction
- answerTarget：attraction_trigger
- answerTargets：你會主動被什麼特質吸引、互動中容易心動的瞬間
- detailLabels：容易被什麼特質吸引、什麼樣的互動最讓你心動
- semanticKeys：emotional_attraction:selfDirection@planet|Mars|0|10|、emotional_attraction:consistency@planet|Venus|1|6|+harmony、emotional_attraction:freedom@planet|Mars|10|11|+novelty、emotional_attraction:depthTrust@planet|Venus|7|7|+harmony、emotional_attraction:selfDirection@planet|Mars|0|10|+harmony、emotional_attraction:depthTrust@planet|Mars|7|9|+selfDirection、emotional_attraction:harmony@planet|Venus|6|7|、emotional_attraction:consistency@planet|Venus|1|2|、emotional_attraction:harmony@planet|Venus|6|5|、emotional_attraction:structure@planet|Mars|9|6|+harmony、emotional_attraction:dialogue@planet|Venus|2|2|+selfDirection、emotional_attraction:consistency@planet|Venus|1|4|+freedom
- fallback：8%
- 重複風險：title/detail 0.29；headline/detail 0.08；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同；部分測試盤由空宮改採可追溯的宮主星資料

### 可能在什麼情境認識（love-meet-scene）— WARNING

- category / topicId：love / love
- intent / questionFocus：context / meeting_context
- answerTarget：meeting_context
- answerTargets：可能認識的場合或情境、適合建立連結的方式
- detailLabels：可能出現的場合、適合的認識情境
- semanticKeys：meeting_context:harmony@planet|Venus|6|4|+selfDirection、meeting_context:consistency@planet|Venus|1|6|+harmony、meeting_context:novelty@planet|Sun|10|11|+freedom、meeting_context:structure@planet|Pluto|9|7|+depthTrust、meeting_context:novelty@planet|Uranus|8|10|+freedom、meeting_context:freedom@planet|Mercury|10|12|+selfDirection、meeting_context:harmony@planet|Venus|6|7|、meeting_context:depthTrust@planet|Pluto|7|8|+intensity、meeting_context:dialogue@planet|Jupiter|2|11|+harmony、meeting_context:consistency@planet|Saturn|1|6|+structure、meeting_context:novelty@planet|Sun|8|9|、meeting_context:consistency@planet|Venus|1|4|+harmony
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 對方可能呈現的外型與氣質（love-appearance-vibe）— WARNING

- category / topicId：love / love
- intent / questionFocus：appearance_and_vibe / partner_visual_impression
- answerTarget：partner_appearance
- answerTargets：外型風格傾向、氣場／氛圍給人的感覺
- detailLabels：外型風格傾向、氣場給人的感覺
- semanticKeys：partner_visual_impression:harmony@angle|dsc|6||、partner_visual_impression:emotionalResponse@angle|dsc|3||、partner_visual_impression:visibility@angle|dsc|4||、partner_visual_impression:structure@angle|dsc|9||、partner_visual_impression:selfDirection@angle|dsc|0||、partner_visual_impression:structure@angle|dsc|5||+practicalCare、partner_visual_impression:emotionalResponse@angle|dsc|3||+harmony、partner_visual_impression:depthTrust@angle|dsc|7||、partner_visual_impression:freedom@angle|dsc|10||、partner_visual_impression:emotionalResponse@angle|dsc|11||+harmony、partner_visual_impression:dialogue@angle|dsc|2||、partner_visual_impression:consistency@angle|dsc|1||
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 什麼樣的相處方式最適合我？（love-relationship-style）— WARNING

- category / topicId：love / love
- intent / questionFocus：style / preferred_relationship_style
- answerTarget：interaction_style
- answerTargets：適合的相處模式、關係中你需要的節奏
- detailLabels：適合的相處模式、關係中的步調
- semanticKeys：preferred_relationship_style:visibility@planet|Moon|4|7|+harmony、preferred_relationship_style:emotionalResponse@planet|Moon|11|5|、preferred_relationship_style:freedom@planet|Sun|10|11|+visibility、preferred_relationship_style:depthTrust@planet|Venus|7|7|、preferred_relationship_style:selfDirection@planet|Mars|0|10|、preferred_relationship_style:freedom@planet|Mercury|10|12|+dialogue、preferred_relationship_style:depthTrust@planet|Pluto|7|8|、preferred_relationship_style:harmony@planet|Moon|6|7|、preferred_relationship_style:structure@planet|Neptune|9|5|+emotionalResponse、preferred_relationship_style:dialogue@planet|Mercury|2|9|、preferred_relationship_style:freedom@planet|Moon|10|7|+consistency
- fallback：50%
- 重複風險：title/detail 0.2；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同；部分測試盤由空宮改採可追溯的宮主星資料

### 我的感情優勢（love-strength）— WARNING

- category / topicId：love / love
- intent / questionFocus：strength / relationship_strengths
- answerTarget：relationship_strengths
- answerTargets：你在感情裡的優勢、別人容易感受到的部分
- detailLabels：你在感情裡的優勢、別人會感受到的部分
- semanticKeys：strength:harmony@planet|Venus|6|4|、strength:emotionalResponse@planet|Moon|11|5|、strength:visibility@planet|Moon|4|8|+freedom、strength:emotionalResponse@planet|Saturn|3|4|、strength:selfDirection@planet|Mars|0|10|+emotionalResponse、strength:freedom@planet|Mercury|10|12|+selfDirection、strength:visibility@planet|Moon|4|7|+harmony、strength:depthTrust@planet|Pluto|7|8|+emotionalResponse、strength:harmony@planet|Uranus|6|1|、strength:emotionalResponse@planet|Moon|7|10|+harmony、strength:dialogue@planet|Mercury|2|9|、strength:consistency@planet|Venus|1|4|
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0.06；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 我的感情盲點（love-blindspot）— WARNING

- category / topicId：love / love
- intent / questionFocus：challenge / relationship_blindspot
- answerTarget：relationship_obstacle
- answerTargets：容易忽略的相處盲點、壓力下容易出現的反應
- detailLabels：容易忽略的盲點、壓力下的反應
- semanticKeys：blindspot:harmony@planet|Venus|6|4|、blindspot:emotionalResponse@planet|Moon|11|5|+consistency、blindspot:freedom@planet|Sun|10|11|+novelty、blindspot:emotionalResponse@planet|Saturn|3|4|、blindspot:selfDirection@planet|Mars|0|10|、blindspot:freedom@planet|Mercury|10|12|+depthTrust、blindspot:harmony@planet|Venus|6|7|+visibility、blindspot:depthTrust@planet|Pluto|7|8|+consistency、blindspot:harmony@planet|Uranus|6|1|、blindspot:structure@planet|Neptune|9|5|+harmony、blindspot:dialogue@planet|Mercury|2|9|、blindspot:consistency@planet|Venus|1|4|
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 關係發生衝突後，我適合怎麼修復？（love-conflict-repair）— WARNING

- category / topicId：love / love
- intent / questionFocus：direction / relationship_repair
- answerTarget：relationship_repair
- answerTargets：衝突後適合先做的事、重新建立溝通與信任的方式
- detailLabels：衝突後的第一步、修復關係的方式
- semanticKeys：relationship_repair:harmony@planet|Venus|6|4|、relationship_repair:emotionalResponse@planet|Moon|11|5|、relationship_repair:freedom@planet|Sun|10|11|+novelty、relationship_repair:emotionalResponse@planet|Saturn|3|4|、relationship_repair:selfDirection@planet|Mars|0|10|、relationship_repair:freedom@planet|Mercury|10|12|+novelty、relationship_repair:visibility@planet|Moon|4|7|+emotionalResponse、relationship_repair:depthTrust@planet|Pluto|7|8|+intensity、relationship_repair:harmony@planet|Uranus|6|1|、relationship_repair:structure@planet|Neptune|9|5|、relationship_repair:dialogue@planet|Mercury|2|9|、relationship_repair:consistency@planet|Venus|1|4|+harmony
- fallback：0%
- 重複風險：title/detail 0.2；headline/detail 0.27；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 我適合負責哪些工作內容？（career-work-type）— WARNING

- category / topicId：career / career
- intent / questionFocus：career_direction / suitable_roles
- answerTarget：suitable_roles
- answerTargets：適合的職能或角色、容易發揮的工作內容
- detailLabels：適合的職能角色、容易發揮的工作內容
- semanticKeys：suitable_roles:selfDirection@planet|Mars|0|10|、suitable_roles:structure@planet|Sun|9|10|+consistency、suitable_roles:novelty@planet|Venus|8|10|+freedom、suitable_roles:emotionalResponse@planet|Moon|3|4|、suitable_roles:structure@planet|Sun|9|10|+novelty、suitable_roles:structure@planet|Jupiter|9|10|+emotionalResponse、suitable_roles:novelty@planet|Mercury|8|10|+visibility、suitable_roles:consistency@planet|Venus|1|2|+emotionalResponse、suitable_roles:visibility@planet|Sun|4|5|+harmony、suitable_roles:depthTrust@planet|Moon|7|10|+emotionalResponse、suitable_roles:novelty@planet|Jupiter|8|9|、suitable_roles:depthTrust@planet|Mars|7|10|+selfDirection
- fallback：17%
- 重複風險：title/detail 0.29；headline/detail 0.33；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同；部分測試盤由空宮改採可追溯的宮主星資料

### 適合什麼工作環境（career-work-env）— WARNING

- category / topicId：career / career
- intent / questionFocus：career_direction / suitable_environment
- answerTarget：suitable_environment
- answerTargets：適合的工作場域、舒適的工作節奏與氛圍
- detailLabels：適合的工作場域、舒適的步調與氛圍
- semanticKeys：suitable_environment:structure@angle|mc|9||+visibility、suitable_environment:consistency@planet|Venus|1|6|、suitable_environment:visibility@planet|Moon|4|8|+emotionalResponse、suitable_environment:consistency@planet|Jupiter|1|3|、suitable_environment:emotionalResponse@angle|mc|3||+freedom、suitable_environment:emotionalResponse@planet|Sun|11|12|+visibility、suitable_environment:novelty@planet|Mercury|8|10|+dialogue、suitable_environment:consistency@planet|Venus|1|2|+structure、suitable_environment:visibility@planet|Saturn|4|12|+consistency、suitable_environment:structure@planet|Mars|9|6|+consistency、suitable_environment:dialogue@planet|Venus|2|2|+novelty、suitable_environment:selfDirection@planet|Mars|7|10|+depthTrust
- fallback：75%
- 重複風險：title/detail 0；headline/detail 0.23；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同；部分測試盤由空宮改採可追溯的宮主星資料

### 我在職場最拿手的是什麼？（career-core-skill）— WARNING

- category / topicId：career / career
- intent / questionFocus：career_strength / workplace_advantages
- answerTarget：workplace_advantages
- answerTargets：你最拿手的職場能力、別人會倚賴你的部分
- detailLabels：最拿手的職場能力、別人會倚賴你的部分
- semanticKeys：strength:selfDirection@planet|Mars|0|10|、strength:structure@planet|Saturn|9|10|、strength:freedom@planet|Uranus|10|1|+novelty、strength:emotionalResponse@planet|Moon|3|4|、strength:emotionalResponse@planet|Neptune|11|12|+selfDirection、strength:visibility@planet|Saturn|4|2|+selfDirection、strength:consistency@planet|Venus|1|2|、strength:selfDirection@planet|Mars|0|5|+visibility、strength:structure@planet|Mars|9|6|、strength:novelty@planet|Jupiter|8|9|、strength:depthTrust@planet|Mars|7|10|+visibility
- fallback：0%
- 重複風險：title/detail 0.33；headline/detail 0.06；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 適合穩定就業、自由工作或創業（career-work-mode）— WARNING

- category / topicId：career / career
- intent / questionFocus：style / employment_mode
- answerTarget：employment_mode
- answerTargets：適合的就業型態、你需要的自主程度
- detailLabels：適合的就業型態、你需要的自主程度
- semanticKeys：employment_mode:selfDirection@planet|Saturn|0|7|、employment_mode:structure@planet|Saturn|9|10|+consistency、employment_mode:novelty@planet|Pluto|8|4|+freedom、employment_mode:emotionalResponse@planet|Moon|3|4|、employment_mode:emotionalResponse@planet|Moon|8|4|+harmony、employment_mode:structure@planet|Jupiter|9|10|+emotionalResponse、employment_mode:harmony@planet|Venus|6|7|+visibility、employment_mode:consistency@planet|Venus|1|2|、employment_mode:visibility@planet|Sun|4|5|+selfDirection、employment_mode:structure@planet|Mercury|5|6|+consistency、employment_mode:novelty@planet|Jupiter|8|9|、employment_mode:visibility@planet|Sun|4|1|+consistency
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 我的職涯盲點（career-blindspot）— WARNING

- category / topicId：career / career
- intent / questionFocus：challenge / career_blindspot
- answerTarget：career_blindspot
- answerTargets：容易忽略的職涯風險、壓力下容易出現的反應
- detailLabels：容易忽略的職涯風險、壓力下的反應
- semanticKeys：blindspot:selfDirection@planet|Saturn|0|7|、blindspot:consistency@planet|Venus|1|6|+structure、blindspot:novelty@planet|Pluto|8|4|、blindspot:emotionalResponse@planet|Mars|11|2|+selfDirection、blindspot:structure@planet|Saturn|9|10|+selfDirection、blindspot:structure@planet|Jupiter|9|10|、blindspot:harmony@planet|Venus|6|7|+structure、blindspot:structure@planet|Saturn|9|2|、blindspot:selfDirection@planet|Mars|0|5|+harmony、blindspot:structure@planet|Mars|9|6|+consistency、blindspot:dialogue@planet|Mercury|2|9|+novelty、blindspot:visibility@planet|Sun|4|1|+selfDirection
- fallback：0%
- 重複風險：title/detail 0.25；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 如何建立長期職涯方向（career-longterm）— WARNING

- category / topicId：career / career
- intent / questionFocus：direction / longterm_career_direction
- answerTarget：career_long_term_direction
- answerTargets：值得投入的長期方向、成熟階段的樣子
- detailLabels：值得投入的長期方向、成熟階段的樣子
- semanticKeys：longterm_career_direction:structure@angle|mc|9||+selfDirection、longterm_career_direction:consistency@planet|Venus|1|6|+harmony、longterm_career_direction:depthTrust@angle|mc|7||+novelty、longterm_career_direction:selfDirection@angle|mc|0||、longterm_career_direction:emotionalResponse@angle|mc|3||+novelty、longterm_career_direction:structure@planet|Jupiter|9|10|+novelty、longterm_career_direction:harmony@angle|mc|6||、longterm_career_direction:freedom@angle|mc|10||+novelty、longterm_career_direction:consistency@angle|mc|1||+harmony、longterm_career_direction:dialogue@angle|mc|2||、longterm_career_direction:novelty@planet|Jupiter|8|9|+dialogue、longterm_career_direction:visibility@angle|mc|4||
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0.36；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 容易在哪些領域獲得成就感（career-fulfillment）— WARNING

- category / topicId：career / career
- intent / questionFocus：value / career_fulfillment_area
- answerTarget：achievement_source
- answerTargets：容易獲得成就感的領域、你真正在意的職場回饋
- detailLabels：容易獲得成就感的領域、你在意的職場回饋
- semanticKeys：career_fulfillment_area:selfDirection@planet|Mars|0|10|、career_fulfillment_area:structure@planet|Sun|9|10|、career_fulfillment_area:novelty@planet|Venus|8|10|、career_fulfillment_area:selfDirection@angle|mc|0||、career_fulfillment_area:structure@planet|Sun|9|10|+selfDirection、career_fulfillment_area:novelty@angle|mc|8||+structure、career_fulfillment_area:novelty@planet|Mercury|8|10|、career_fulfillment_area:freedom@angle|mc|10||+novelty、career_fulfillment_area:consistency@angle|mc|1||+visibility、career_fulfillment_area:emotionalResponse@planet|Moon|7|10|+depthTrust、career_fulfillment_area:novelty@planet|Sun|8|9|、career_fulfillment_area:visibility@angle|mc|4||+selfDirection
- fallback：0%
- 重複風險：title/detail 0.38；headline/detail 0.2；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 我在家庭中習慣扮演的角色（family-role）— WARNING

- category / topicId：family / family
- intent / questionFocus：profile / family_role
- answerTarget：family_role
- answerTargets：你習慣扮演的角色、家人容易依賴你的部分
- detailLabels：家人通常找你做什麼、你實際承擔的部分
- semanticKeys：role:harmony@planet|Venus|6|4|、role:structure@planet|Mars|5|8|+selfDirection、role:novelty@planet|Pluto|8|4|、role:emotionalResponse@planet|Moon|3|4|、role:structure@planet|Saturn|9|10|+novelty、role:freedom@planet|Mercury|10|12|+dialogue、role:novelty@planet|Neptune|8|4|+selfDirection、role:consistency@planet|Sun|1|2|+structure、role:freedom@planet|Pluto|10|3|+depthTrust、role:depthTrust@planet|Uranus|7|4|+emotionalResponse、role:selfDirection@planet|Neptune|0|7|+emotionalResponse、role:consistency@planet|Venus|1|4|
- fallback：33%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 0.68
- WARNING：部分測試盤由空宮改採可追溯的宮主星資料

### 原生家庭如何影響我（family-origin-impact）— WARNING

- category / topicId：family / family
- intent / questionFocus：origin / family_origin_impact
- answerTarget：family_origin_impact
- answerTargets：原生家庭留下的慣性、延續或需要修正的模式
- detailLabels：原生家庭留下的慣性、值得修正的模式
- semanticKeys：family_origin_impact:emotionalResponse@angle|ic|3||、family_origin_impact:selfDirection@angle|ic|0||、family_origin_impact:consistency@angle|ic|1||、family_origin_impact:harmony@angle|ic|6||、family_origin_impact:structure@angle|ic|9||、family_origin_impact:dialogue@angle|ic|2||、family_origin_impact:visibility@angle|ic|4||、family_origin_impact:depthTrust@angle|ic|7||、family_origin_impact:novelty@angle|ic|8||、family_origin_impact:emotionalResponse@angle|ic|11||、family_origin_impact:freedom@angle|ic|10||
- fallback：0%
- 重複風險：title/detail 0.29；headline/detail 0.05；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 和家人之間，我需要守住哪些底線（family-boundary）— WARNING

- category / topicId：family / family
- intent / questionFocus：challenge / family_boundary_setting
- answerTarget：family_boundary_setting
- answerTargets：需要練習劃清的底線、容易被跨越的地方
- detailLabels：需要練習的底線、容易被跨越的地方
- semanticKeys：family_boundary_setting:harmony@planet|Venus|6|4|、family_boundary_setting:structure@planet|Mars|5|8|+selfDirection、family_boundary_setting:novelty@planet|Pluto|8|4|、family_boundary_setting:emotionalResponse@planet|Saturn|3|4|、family_boundary_setting:structure@planet|Saturn|9|10|+novelty、family_boundary_setting:freedom@planet|Mercury|10|12|+dialogue、family_boundary_setting:novelty@planet|Neptune|8|4|+selfDirection、family_boundary_setting:consistency@planet|Sun|1|2|+structure、family_boundary_setting:freedom@planet|Pluto|10|3|+depthTrust、family_boundary_setting:depthTrust@planet|Uranus|7|4|+novelty、family_boundary_setting:selfDirection@planet|Neptune|0|7|、family_boundary_setting:consistency@planet|Venus|1|4|
- fallback：33%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同；部分測試盤由空宮改採可追溯的宮主星資料

### 我適合怎樣的居住環境（family-living-env）— WARNING

- category / topicId：family / family
- intent / questionFocus：environment / living_environment
- answerTarget：living_environment
- answerTargets：適合的居住條件、讓你安心的家庭氛圍
- detailLabels：適合的居住條件、讓你安心的氛圍
- semanticKeys：living_environment:harmony@planet|Venus|6|4|+emotionalResponse、living_environment:selfDirection@angle|ic|0||、living_environment:novelty@planet|Pluto|8|4|+consistency、living_environment:emotionalResponse@planet|Moon|3|4|、living_environment:structure@angle|ic|9||+novelty、living_environment:dialogue@angle|ic|2||、living_environment:visibility@angle|ic|4||+practicalCare、living_environment:depthTrust@angle|ic|7||、living_environment:novelty@angle|ic|8||+depthTrust、living_environment:emotionalResponse@angle|ic|11||、living_environment:consistency@planet|Venus|1|4|+freedom
- fallback：0%
- 重複風險：title/detail 0.2；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 如何建立內在安全感（family-inner-safety）— WARNING

- category / topicId：family / family
- intent / questionFocus：safety / inner_safety_practice
- answerTarget：inner_safety_practice
- answerTargets：能讓你安定下來的方式、值得練習的自我照顧
- detailLabels：能讓你安定的方式、值得練習的照顧方式
- semanticKeys：inner_safety_practice:emotionalResponse@angle|ic|3||+harmony、inner_safety_practice:selfDirection@angle|ic|0||、inner_safety_practice:consistency@angle|ic|1||、inner_safety_practice:emotionalResponse@planet|Moon|3|4|、inner_safety_practice:novelty@planet|Moon|8|4|+structure、inner_safety_practice:dialogue@angle|ic|2||、inner_safety_practice:visibility@angle|ic|4||、inner_safety_practice:depthTrust@angle|ic|7||、inner_safety_practice:novelty@angle|ic|8||+depthTrust、inner_safety_practice:emotionalResponse@angle|ic|11||、inner_safety_practice:freedom@angle|ic|10||+consistency
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 家庭與事業如何平衡（family-work-balance）— WARNING

- category / topicId：family / family
- intent / questionFocus：direction / family_career_balance
- answerTarget：family_career_balance
- answerTargets：家庭與事業如何互相支援、容易失衡的方向
- detailLabels：家庭與事業的關係、容易失衡的方向
- semanticKeys：family_career_balance:emotionalResponse@angle|ic|3||+structure、family_career_balance:selfDirection@angle|ic|0||+harmony、family_career_balance:depthTrust@angle|mc|7||+novelty、family_career_balance:harmony@angle|ic|6||+selfDirection、family_career_balance:structure@angle|ic|9||+emotionalResponse、family_career_balance:novelty@angle|mc|8||、family_career_balance:harmony@angle|mc|6||+selfDirection、family_career_balance:visibility@angle|ic|4||+freedom、family_career_balance:depthTrust@angle|ic|7||+consistency、family_career_balance:novelty@angle|ic|8||+dialogue、family_career_balance:dialogue@planet|Mercury|2|9|+emotionalResponse、family_career_balance:visibility@angle|mc|4||+freedom
- fallback：0%
- 重複風險：title/detail 0.5；headline/detail 0.11；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 壓力大時，我通常會出現哪些反應？（health-stress-pattern）— WARNING

- category / topicId：health / health
- intent / questionFocus：pattern / stress_reaction_pattern
- answerTarget：stress_reaction_pattern
- answerTargets：壓力來臨時的直覺反應、容易忽略的身體訊號
- detailLabels：壓力來臨時的反應、容易忽略的訊號
- semanticKeys：stress_reaction_pattern:selfDirection@planet|Sun|0|1|、stress_reaction_pattern:structure@angle|asc|9||、stress_reaction_pattern:freedom@planet|Uranus|10|1|+novelty、stress_reaction_pattern:emotionalResponse@angle|asc|3||、stress_reaction_pattern:harmony@angle|asc|6||、stress_reaction_pattern:emotionalResponse@angle|asc|11||、stress_reaction_pattern:consistency@angle|asc|1||、stress_reaction_pattern:visibility@angle|asc|4||+harmony、stress_reaction_pattern:structure@angle|asc|5||+consistency、stress_reaction_pattern:novelty@angle|asc|8||、stress_reaction_pattern:visibility@planet|Sun|4|1|+depthTrust
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 哪種生活習慣較適合我（health-lifestyle-fit）— WARNING

- category / topicId：health / health
- intent / questionFocus：fit / lifestyle_fit
- answerTarget：lifestyle_fit
- answerTargets：適合的生活步調、容易維持的作息方式
- detailLabels：適合的生活步調、容易維持的作息
- semanticKeys：lifestyle_fit:visibility@planet|Mercury|4|3|+selfDirection、lifestyle_fit:consistency@planet|Venus|1|6|、lifestyle_fit:visibility@planet|Moon|4|8|+emotionalResponse、lifestyle_fit:consistency@planet|Jupiter|1|3|、lifestyle_fit:freedom@planet|Neptune|10|11|+structure、lifestyle_fit:emotionalResponse@planet|Sun|11|12|+visibility、lifestyle_fit:novelty@planet|Mercury|8|10|、lifestyle_fit:consistency@planet|Venus|1|2|+structure、lifestyle_fit:visibility@planet|Saturn|4|12|+structure、lifestyle_fit:structure@planet|Mars|9|6|+consistency、lifestyle_fit:dialogue@planet|Venus|2|2|+novelty、lifestyle_fit:depthTrust@planet|Mars|7|10|+selfDirection
- fallback：75%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同；部分測試盤由空宮改採可追溯的宮主星資料

### 我容易忽略身體的哪些警訊（health-body-boundary）— WARNING

- category / topicId：health / health
- intent / questionFocus：challenge / body_boundary_blindspot
- answerTarget：body_boundary_blindspot
- answerTargets：容易忽略的身體警訊、硬撐的習慣
- detailLabels：容易忽略的警訊、硬撐的習慣
- semanticKeys：blindspot:selfDirection@planet|Sun|0|1|、blindspot:structure@angle|asc|9||+emotionalResponse、blindspot:freedom@angle|asc|10||+novelty、blindspot:emotionalResponse@angle|asc|3||、blindspot:harmony@angle|asc|6||、blindspot:emotionalResponse@angle|asc|11||、blindspot:structure@angle|asc|9||、blindspot:consistency@angle|asc|1||、blindspot:visibility@angle|asc|4||+harmony、blindspot:structure@angle|asc|5||、blindspot:novelty@angle|asc|8||、blindspot:visibility@planet|Sun|4|1|+depthTrust
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 什麼方式最能幫我恢復精力？（health-self-care）— WARNING

- category / topicId：health / health
- intent / questionFocus：safety / recovery_method
- answerTarget：recovery_method
- answerTargets：真正有恢復效果的活動、適合安排的休息節奏
- detailLabels：有效的恢復方式、適合的休息節奏
- semanticKeys：recovery_method:selfDirection@planet|Saturn|0|7|+visibility、recovery_method:consistency@planet|Venus|1|6|、recovery_method:visibility@planet|Moon|4|8|+dialogue、recovery_method:emotionalResponse@planet|Moon|3|4|、recovery_method:structure@planet|Saturn|9|10|+novelty、recovery_method:emotionalResponse@planet|Moon|0|12|+selfDirection、recovery_method:visibility@planet|Moon|4|7|、recovery_method:structure@planet|Mars|9|6|、recovery_method:harmony@planet|Moon|6|7|+visibility、recovery_method:structure@planet|Mars|9|6|+consistency、recovery_method:novelty@planet|Saturn|8|5|+freedom、recovery_method:freedom@planet|Moon|10|7|
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0.09；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 哪些日常情境最容易消耗我的能量？（health-energy-drain）— WARNING

- category / topicId：health / health
- intent / questionFocus：challenge / energy_drain_contexts
- answerTarget：energy_drain_contexts
- answerTargets：容易消耗能量的日常情境、需要降低負荷的環境條件
- detailLabels：容易消耗你的情境、需要降低的負荷
- semanticKeys：energy_drain_contexts:selfDirection@planet|Saturn|0|7|+visibility、energy_drain_contexts:consistency@planet|Neptune|1|12|、energy_drain_contexts:emotionalResponse@planet|Moon|4|8|+visibility、energy_drain_contexts:emotionalResponse@planet|Neptune|11|12|、energy_drain_contexts:selfDirection@planet|Pluto|0|12|+freedom、energy_drain_contexts:emotionalResponse@planet|Sun|11|12|、energy_drain_contexts:novelty@planet|Mercury|8|10|、energy_drain_contexts:structure@planet|Mars|9|6|+consistency、energy_drain_contexts:visibility@planet|Saturn|4|12|+structure、energy_drain_contexts:freedom@planet|Moon|10|12|+novelty、energy_drain_contexts:depthTrust@planet|Mars|7|10|+selfDirection
- fallback：42%
- 重複風險：title/detail 0.33；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同；部分測試盤由空宮改採可追溯的宮主星資料

### 我適合靠哪種收入模式賺錢？（wealth-earning-style）— WARNING

- category / topicId：wealth / wealth
- intent / questionFocus：pattern / earning_style
- answerTarget：money_source
- answerTargets：主要的賺錢方式、容易發揮的財務行動
- detailLabels：主要的賺錢方式、容易發揮的行動
- semanticKeys：earning_style:harmony@planet|Venus|6|4|+structure、earning_style:harmony@angle|mc|6||、earning_style:harmony@planet|Neptune|6|3|+depthTrust、earning_style:selfDirection@angle|mc|0||、earning_style:emotionalResponse@angle|mc|3||+selfDirection、earning_style:novelty@angle|mc|8||、earning_style:harmony@angle|mc|6||+visibility、earning_style:consistency@planet|Sun|1|2|、earning_style:novelty@planet|Mercury|8|8|+consistency、earning_style:emotionalResponse@planet|Jupiter|3|2|、earning_style:novelty@planet|Saturn|8|5|、earning_style:visibility@angle|mc|4||
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0.07；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 哪些能力最容易替我帶來收入？（wealth-monetizable）— WARNING

- category / topicId：wealth / wealth
- intent / questionFocus：capability / wealth_monetizable_skills
- answerTarget：monetizable_skills
- answerTargets：較容易變現的能力、市場願意付費的部分
- detailLabels：較容易變現的能力、市場願意付費的部分
- semanticKeys：wealth_monetizable_skills:harmony@planet|Venus|6|4|、wealth_monetizable_skills:novelty@planet|Uranus|11|11|+freedom、wealth_monetizable_skills:harmony@planet|Neptune|6|3|、wealth_monetizable_skills:selfDirection@planet|Mars|11|2|+emotionalResponse、wealth_monetizable_skills:selfDirection@planet|Pluto|0|12|+intensity、wealth_monetizable_skills:depthTrust@planet|Mars|7|9|+selfDirection、wealth_monetizable_skills:harmony@planet|Uranus|6|3|+visibility、wealth_monetizable_skills:consistency@planet|Venus|1|2|、wealth_monetizable_skills:novelty@planet|Mercury|8|8|+dialogue、wealth_monetizable_skills:emotionalResponse@planet|Jupiter|3|2|+harmony、wealth_monetizable_skills:novelty@planet|Saturn|8|5|+dialogue、wealth_monetizable_skills:novelty@planet|Jupiter|5|5|+dialogue
- fallback：50%
- 重複風險：title/detail 0；headline/detail 0.2；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同；部分測試盤由空宮改採可追溯的宮主星資料

### 我的消費與儲蓄模式（wealth-spend-save）— WARNING

- category / topicId：wealth / wealth
- intent / questionFocus：pattern / spend_save_pattern
- answerTarget：spending_pattern
- answerTargets：消費與儲蓄的習慣、面對金錢的直覺反應
- detailLabels：消費與儲蓄的習慣、面對金錢的直覺反應
- semanticKeys：spend_save_pattern:harmony@planet|Venus|6|4|、spend_save_pattern:freedom@planet|Uranus|11|11|+structure、spend_save_pattern:harmony@planet|Neptune|6|3|、spend_save_pattern:emotionalResponse@planet|Mars|11|2|+selfDirection、spend_save_pattern:selfDirection@planet|Pluto|0|12|+intensity、spend_save_pattern:depthTrust@planet|Mars|7|9|+selfDirection、spend_save_pattern:visibility@planet|Saturn|4|2|+structure、spend_save_pattern:consistency@planet|Sun|1|2|+structure、spend_save_pattern:novelty@planet|Mercury|8|8|、spend_save_pattern:emotionalResponse@planet|Jupiter|3|2|+harmony、spend_save_pattern:novelty@planet|Saturn|8|5|+dialogue、spend_save_pattern:novelty@planet|Jupiter|5|5|+dialogue
- fallback：50%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同；部分測試盤由空宮改採可追溯的宮主星資料

### 我對財務風險的態度（wealth-risk-attitude）— WARNING

- category / topicId：wealth / wealth
- intent / questionFocus：challenge / risk_attitude
- answerTarget：financial_risk_style
- answerTargets：面對財務風險的直覺反應、容易高估或低估的部分
- detailLabels：面對風險的直覺反應、容易高估或低估的部分
- semanticKeys：risk_attitude:harmony@planet|Pluto|6|10|+depthTrust、risk_attitude:structure@planet|Sun|9|10|、risk_attitude:dialogue@planet|Mercury|2|11|、risk_attitude:novelty@planet|Uranus|5|5|+freedom、risk_attitude:harmony@planet|Venus|11|10|+structure、risk_attitude:structure@planet|Venus|5|8|+harmony、risk_attitude:visibility@planet|Sun|4|8|、risk_attitude:novelty@planet|Jupiter|8|8|、risk_attitude:emotionalResponse@planet|Neptune|11|5|、risk_attitude:structure@planet|Mars|9|6|+consistency、risk_attitude:freedom@planet|Moon|10|12|+novelty、risk_attitude:dialogue@planet|Mercury|11|2|+emotionalResponse
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 適合個人收入還是合作資源（wealth-solo-or-shared）— WARNING

- category / topicId：wealth / wealth
- intent / questionFocus：fit / solo_or_shared_resource
- answerTarget：solo_or_shared_resource
- answerTargets：適合的資源運用方式、合作或獨立的傾向
- detailLabels：適合的資源運用方式、合作或獨立的傾向
- semanticKeys：solo_or_shared_resource:harmony@planet|Venus|6|4|+dialogue、solo_or_shared_resource:structure@planet|Sun|9|10|+selfDirection、solo_or_shared_resource:dialogue@planet|Mercury|2|11|+emotionalResponse、solo_or_shared_resource:visibility@planet|Sun|11|4|+freedom、solo_or_shared_resource:selfDirection@planet|Pluto|0|12|+visibility、solo_or_shared_resource:harmony@planet|Venus|5|8|+depthTrust、solo_or_shared_resource:visibility@planet|Sun|4|8|+selfDirection、solo_or_shared_resource:novelty@planet|Jupiter|8|8|+depthTrust、solo_or_shared_resource:novelty@planet|Mercury|8|8|、solo_or_shared_resource:harmony@planet|Venus|11|12|+structure、solo_or_shared_resource:novelty@planet|Saturn|8|5|+freedom、solo_or_shared_resource:emotionalResponse@planet|Mercury|11|2|
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 我的財務盲點（wealth-blindspot）— WARNING

- category / topicId：wealth / wealth
- intent / questionFocus：challenge / financial_blindspot
- answerTarget：financial_blindspot
- answerTargets：容易忽略的財務風險、壓力下容易出現的財務反應
- detailLabels：容易忽略的風險、壓力下的財務反應
- semanticKeys：blindspot:harmony@planet|Venus|6|4|、blindspot:structure@planet|Sun|9|10|、blindspot:dialogue@planet|Mercury|2|11|、blindspot:emotionalResponse@planet|Sun|11|4|+visibility、blindspot:selfDirection@planet|Pluto|0|12|+harmony、blindspot:depthTrust@planet|Mars|7|9|+harmony、blindspot:visibility@planet|Sun|4|8|、blindspot:novelty@planet|Jupiter|8|8|、blindspot:novelty@planet|Mercury|8|8|+emotionalResponse、blindspot:structure@planet|Mars|9|6|+consistency、blindspot:novelty@planet|Saturn|8|5|+freedom、blindspot:novelty@planet|Jupiter|5|5|+structure
- fallback：0%
- 重複風險：title/detail 0.25；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 如何建立更穩定的財務結構（wealth-stable-structure）— WARNING

- category / topicId：wealth / wealth
- intent / questionFocus：direction / stable_financial_structure
- answerTarget：financial_priority
- answerTargets：值得投入的財務方向、長期穩定的做法
- detailLabels：值得投入的方向、長期穩定的做法
- semanticKeys：stable_financial_structure:structure@angle|mc|9||+harmony、stable_financial_structure:harmony@angle|mc|6||、stable_financial_structure:depthTrust@angle|mc|7||+harmony、stable_financial_structure:selfDirection@angle|mc|0||+emotionalResponse、stable_financial_structure:emotionalResponse@angle|mc|3||+selfDirection、stable_financial_structure:novelty@angle|mc|8||+depthTrust、stable_financial_structure:harmony@angle|mc|6||+visibility、stable_financial_structure:consistency@planet|Sun|1|2|+structure、stable_financial_structure:consistency@angle|mc|1||+novelty、stable_financial_structure:emotionalResponse@planet|Jupiter|3|2|+dialogue、stable_financial_structure:novelty@planet|Saturn|8|5|+structure、stable_financial_structure:visibility@angle|mc|4||
- fallback：0%
- 重複風險：title/detail 0.2；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 我給人的第一印象（social-first-impression）— WARNING

- category / topicId：social / social
- intent / questionFocus：impression / first_impression
- answerTarget：first_impression
- answerTargets：別人對你的第一印象、還沒熟識前會注意到的樣子
- detailLabels：別人對你的第一印象、還沒熟識前會注意到的樣子
- semanticKeys：role:selfDirection@angle|asc|0||、role:structure@angle|asc|9||、role:freedom@angle|asc|10||+novelty、role:emotionalResponse@angle|asc|3||、role:harmony@angle|asc|6||、role:emotionalResponse@angle|asc|11||、role:consistency@angle|asc|1||、role:visibility@angle|asc|4||、role:structure@angle|asc|5||+practicalCare、role:novelty@angle|asc|8||、role:depthTrust@angle|asc|7||
- fallback：0%
- 重複風險：title/detail 0.5；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 我的溝通風格（social-comm-style）— WARNING

- category / topicId：social / social
- intent / questionFocus：style / communication_style
- answerTarget：communication_style
- answerTargets：你習慣的表達方式、容易讓對方感覺到的溝通特質
- detailLabels：你習慣的表達方式、對方會感覺到的特質
- semanticKeys：communication_style:visibility@planet|Mercury|4|3|+dialogue、communication_style:consistency@planet|Neptune|1|12|、communication_style:harmony@planet|Neptune|6|3|+freedom、communication_style:depthTrust@planet|Mercury|7|12|+consistency、communication_style:visibility@planet|Jupiter|4|8|+novelty、communication_style:harmony@planet|Venus|5|8|+structure、communication_style:novelty@planet|Neptune|8|4|、communication_style:emotionalResponse@planet|Moon|3|3|、communication_style:harmony@planet|Venus|6|5|+freedom、communication_style:depthTrust@planet|Pluto|11|6|+emotionalResponse、communication_style:freedom@planet|Uranus|10|9|+novelty、communication_style:freedom@planet|Saturn|10|7|+structure
- fallback：42%
- 重複風險：title/detail 0；headline/detail 0.06；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同；部分測試盤由空宮改採可追溯的宮主星資料

### 我在人群中的角色（social-group-role）— WARNING

- category / topicId：social / social
- intent / questionFocus：profile / group_role
- answerTarget：group_role
- answerTargets：你在群體中習慣扮演的角色、別人會找你做的事
- detailLabels：你在群體中的角色、別人會找你做的事
- semanticKeys：role:dialogue@planet|Uranus|2|8|+novelty、role:emotionalResponse@planet|Pluto|3|1|、role:dialogue@planet|Mercury|2|11|+novelty、role:depthTrust@planet|Venus|7|7|+harmony、role:freedom@planet|Neptune|10|11|+structure、role:structure@planet|Saturn|11|11|+emotionalResponse、role:freedom@planet|Pluto|10|5|+depthTrust、role:structure@planet|Neptune|5|10|+emotionalResponse、role:novelty@planet|Mercury|8|8|+dialogue、role:depthTrust@planet|Moon|7|10|+emotionalResponse、role:dialogue@planet|Venus|2|2|+harmony、role:dialogue@planet|Mercury|11|2|+emotionalResponse
- fallback：58%
- 重複風險：title/detail 0.33；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同；部分測試盤由空宮改採可追溯的宮主星資料

### 我的人際優勢（social-strength）— WARNING

- category / topicId：social / social
- intent / questionFocus：strength / social_strengths
- answerTarget：social_strengths
- answerTargets：你在人際中的優勢、別人容易依賴你的部分
- detailLabels：你在人際中的優勢、別人依賴你的部分
- semanticKeys：strength:selfDirection@angle|asc|0||+harmony、strength:structure@angle|asc|9||+consistency、strength:novelty@planet|Venus|8|10|+freedom、strength:emotionalResponse@angle|asc|3||+depthTrust、strength:harmony@angle|asc|6||、strength:harmony@planet|Venus|5|8|+emotionalResponse、strength:structure@angle|asc|9||+harmony、strength:consistency@angle|asc|1||、strength:visibility@angle|asc|4||+harmony、strength:structure@angle|asc|5||+harmony、strength:novelty@angle|asc|8||+dialogue、strength:depthTrust@angle|asc|7||+consistency
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 我的底線與面對衝突的方式（social-boundary-conflict）— WARNING

- category / topicId：social / social
- intent / questionFocus：tension / boundary_conflict_pattern
- answerTarget：boundary_conflict_pattern
- answerTargets：面對衝突時的直覺反應、容易被跨過的底線
- detailLabels：面對衝突的反應、容易被跨過的底線
- semanticKeys：boundary_conflict_pattern:harmony@planet|Venus|6|4|、boundary_conflict_pattern:emotionalResponse@planet|Moon|11|5|、boundary_conflict_pattern:visibility@planet|Sun|10|11|+freedom、boundary_conflict_pattern:emotionalResponse@planet|Saturn|3|4|、boundary_conflict_pattern:selfDirection@planet|Mars|0|10|、boundary_conflict_pattern:freedom@planet|Mercury|10|12|+dialogue、boundary_conflict_pattern:visibility@planet|Moon|4|7|+emotionalResponse、boundary_conflict_pattern:depthTrust@planet|Pluto|7|8|、boundary_conflict_pattern:harmony@planet|Uranus|6|1|、boundary_conflict_pattern:structure@planet|Neptune|9|5|+emotionalResponse、boundary_conflict_pattern:dialogue@planet|Mercury|2|9|、boundary_conflict_pattern:consistency@planet|Venus|1|4|
- fallback：0%
- 重複風險：title/detail 0.6；headline/detail 0.33；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 什麼樣的朋友圈最適合我？（social-circle-fit）— WARNING

- category / topicId：social / social
- intent / questionFocus：fit / social_circle_fit
- answerTarget：social_circle_fit
- answerTargets：適合你的社交圈類型、讓你自在的群體氛圍
- detailLabels：適合的社交圈類型、讓你自在的群體氛圍
- semanticKeys：social_circle_fit:dialogue@planet|Uranus|2|8|+novelty、social_circle_fit:emotionalResponse@planet|Pluto|3|1|、social_circle_fit:novelty@planet|Sun|10|11|+freedom、social_circle_fit:depthTrust@planet|Venus|7|7|+harmony、social_circle_fit:freedom@planet|Neptune|10|11|+structure、social_circle_fit:structure@planet|Saturn|11|11|+consistency、social_circle_fit:freedom@planet|Pluto|10|5|+depthTrust、social_circle_fit:consistency@planet|Venus|1|2|+practicalCare、social_circle_fit:novelty@planet|Mercury|8|8|+dialogue、social_circle_fit:emotionalResponse@planet|Moon|7|10|+depthTrust、social_circle_fit:dialogue@planet|Venus|2|2|+harmony、social_circle_fit:dialogue@planet|Mercury|11|2|+emotionalResponse
- fallback：58%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同；部分測試盤由空宮改採可追溯的宮主星資料

### 我用什麼方法最容易學會？（study-learning-style）— WARNING

- category / topicId：study / study
- intent / questionFocus：style / learning_style
- answerTarget：learning_style
- answerTargets：適合的學習方式、容易吸收的教學節奏
- detailLabels：適合的學習方式、容易吸收的節奏
- semanticKeys：learning_style:visibility@planet|Mercury|4|3|+dialogue、learning_style:consistency@planet|Neptune|1|12|、learning_style:harmony@planet|Neptune|6|3|+freedom、learning_style:depthTrust@planet|Mercury|7|12|+consistency、learning_style:visibility@planet|Jupiter|4|8|+novelty、learning_style:harmony@planet|Venus|5|8|+structure、learning_style:novelty@planet|Neptune|8|4|、learning_style:emotionalResponse@planet|Moon|3|3|、learning_style:harmony@planet|Venus|6|5|+freedom、learning_style:depthTrust@planet|Pluto|11|6|+emotionalResponse、learning_style:freedom@planet|Uranus|10|9|+novelty、learning_style:freedom@planet|Saturn|10|7|+structure
- fallback：42%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同；部分測試盤由空宮改採可追溯的宮主星資料

### 我的資訊理解與記憶模式（study-memory-mode）— WARNING

- category / topicId：study / study
- intent / questionFocus：pattern / memory_mode
- answerTarget：memory_mode
- answerTargets：理解新資訊的方式、容易記住的資訊類型
- detailLabels：理解新資訊的方式、容易記住的類型
- semanticKeys：memory_mode:selfDirection@planet|Saturn|0|7|+visibility、memory_mode:structure@planet|Saturn|9|10|、memory_mode:dialogue@planet|Mercury|2|11|、memory_mode:depthTrust@planet|Mercury|7|12|+emotionalResponse、memory_mode:structure@planet|Saturn|9|10|+freedom、memory_mode:freedom@planet|Mercury|10|12|+structure、memory_mode:novelty@planet|Mercury|8|10|+visibility、memory_mode:structure@planet|Saturn|9|2|、memory_mode:novelty@planet|Mercury|8|8|+visibility、memory_mode:consistency@planet|Saturn|1|6|+structure、memory_mode:novelty@planet|Saturn|8|5|+dialogue、memory_mode:freedom@planet|Saturn|10|7|+structure
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 容易拖延或分心的原因（study-procrastination）— WARNING

- category / topicId：study / study
- intent / questionFocus：challenge / procrastination_root
- answerTarget：procrastination_root
- answerTargets：容易拖延的根本原因、分心時常見的觸發點
- detailLabels：拖延的根本原因、分心的常見觸發點
- semanticKeys：procrastination_root:selfDirection@planet|Saturn|0|7|+visibility、procrastination_root:consistency@planet|Neptune|1|12|+structure、procrastination_root:freedom@planet|Uranus|10|1|+dialogue、procrastination_root:emotionalResponse@planet|Saturn|3|4|、procrastination_root:novelty@planet|Uranus|8|10|+freedom、procrastination_root:emotionalResponse@planet|Saturn|11|11|+consistency、procrastination_root:novelty@planet|Neptune|8|4|+harmony、procrastination_root:structure@planet|Saturn|9|2|+emotionalResponse、procrastination_root:harmony@planet|Uranus|6|1|、procrastination_root:consistency@planet|Saturn|1|6|+structure、procrastination_root:novelty@planet|Saturn|8|5|+freedom、procrastination_root:freedom@planet|Saturn|10|7|+structure
- fallback：0%
- 重複風險：title/detail 0.17；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 我比較適合學習哪一類內容？（study-mode-fit）— WARNING

- category / topicId：study / study
- intent / questionFocus：fit / study_mode_fit
- answerTarget：study_mode_fit
- answerTargets：適合的知識類型、容易發揮實力的學習形式
- detailLabels：適合的知識類型、容易發揮實力的形式
- semanticKeys：study_mode_fit:novelty@planet|Jupiter|8|9|、study_mode_fit:dialogue@planet|Mercury|5|10|+structure、study_mode_fit:novelty@planet|Venus|8|10|、study_mode_fit:emotionalResponse@planet|Neptune|11|12|、study_mode_fit:freedom@planet|Mercury|10|10|+novelty、study_mode_fit:depthTrust@planet|Pluto|7|12|、study_mode_fit:novelty@planet|Mercury|8|10|、study_mode_fit:structure@planet|Saturn|9|2|、study_mode_fit:selfDirection@planet|Mars|0|5|+novelty、study_mode_fit:emotionalResponse@planet|Venus|11|12|+harmony、study_mode_fit:novelty@planet|Sun|8|9|、study_mode_fit:emotionalResponse@planet|Moon|10|7|+freedom
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0.07；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 海外學習或高等教育傾向（study-overseas）— WARNING

- category / topicId：study / study
- intent / questionFocus：direction / overseas_education_direction
- answerTarget：overseas_education_direction
- answerTargets：海外或高等教育的傾向、值得投入的長期學習方向
- detailLabels：適合拓展的能力、現實條件要先確認
- semanticKeys：overseas_education_direction:novelty@planet|Jupiter|8|9|、overseas_education_direction:depthTrust@planet|Jupiter|7|9|+novelty、overseas_education_direction:harmony@planet|Jupiter|6|9|+novelty、overseas_education_direction:emotionalResponse@planet|Neptune|11|12|、overseas_education_direction:freedom@planet|Mercury|10|10|+novelty、overseas_education_direction:depthTrust@planet|Mars|7|9|+intensity、overseas_education_direction:novelty@planet|Mercury|8|10|、overseas_education_direction:structure@planet|Saturn|9|2|+novelty、overseas_education_direction:selfDirection@planet|Mars|0|5|、overseas_education_direction:emotionalResponse@planet|Venus|11|12|+harmony、overseas_education_direction:novelty@planet|Sun|8|9|、overseas_education_direction:consistency@planet|Pluto|1|9|+freedom
- fallback：42%
- 重複風險：title/detail 0；headline/detail 0.2；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同；部分測試盤由空宮改採可追溯的宮主星資料

### 我如何安排讀書時間比較有效？（study-rhythm）— WARNING

- category / topicId：study / study
- intent / questionFocus：safety / study_rhythm
- answerTarget：study_rhythm
- answerTargets：適合的讀書節奏、維持專注的方式
- detailLabels：適合的讀書節奏、維持專注的方式
- semanticKeys：study_rhythm:selfDirection@planet|Saturn|0|7|+visibility、study_rhythm:consistency@planet|Venus|1|6|、study_rhythm:dialogue@planet|Saturn|2|1|、study_rhythm:emotionalResponse@planet|Saturn|3|4|+depthTrust、study_rhythm:structure@planet|Saturn|9|10|、study_rhythm:freedom@planet|Mercury|10|12|+structure、study_rhythm:visibility@planet|Saturn|4|2|+novelty、study_rhythm:structure@planet|Mars|9|6|、study_rhythm:visibility@planet|Saturn|4|12|+novelty、study_rhythm:structure@planet|Mars|9|6|+consistency、study_rhythm:novelty@planet|Saturn|8|5|+dialogue、study_rhythm:freedom@planet|Saturn|10|7|+structure
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 我的學習優勢與盲點（study-strength-blindspot）— WARNING

- category / topicId：study / study
- intent / questionFocus：strength / study_strength_blindspot
- answerTarget：study_strength_blindspot
- answerTargets：學習上的明顯優勢、需要留意的學習盲點
- detailLabels：學習上的優勢、需要留意的盲點
- semanticKeys：blindspot:visibility@planet|Mercury|4|3|、blindspot:consistency@planet|Neptune|1|12|、blindspot:novelty@planet|Mars|10|11|+dialogue、blindspot:depthTrust@planet|Mercury|7|12|+dialogue、blindspot:visibility@planet|Jupiter|4|8|+novelty、blindspot:structure@planet|Venus|5|8|+harmony、blindspot:novelty@planet|Neptune|8|4|、blindspot:emotionalResponse@planet|Moon|3|3|、blindspot:harmony@planet|Venus|6|5|+novelty、blindspot:emotionalResponse@planet|Pluto|11|6|+depthTrust、blindspot:novelty@planet|Uranus|10|9|+freedom、blindspot:structure@planet|Saturn|10|7|+freedom
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 我適合用什麼成果證明自己學會了？（study-mastery-evidence）— WARNING

- category / topicId：study / study
- intent / questionFocus：capability / mastery_evidence
- answerTarget：mastery_evidence
- answerTargets：適合展現學習成果的形式、判斷自己真正學會的標準
- detailLabels：適合的成果形式、真正學會的判斷標準
- semanticKeys：mastery_evidence:novelty@planet|Jupiter|8|9|+visibility、mastery_evidence:consistency@planet|Neptune|1|12|+structure、mastery_evidence:novelty@planet|Venus|8|10|、mastery_evidence:emotionalResponse@planet|Neptune|11|12|+depthTrust、mastery_evidence:visibility@planet|Jupiter|4|8|、mastery_evidence:depthTrust@planet|Pluto|7|12|+harmony、mastery_evidence:novelty@planet|Mercury|8|10|、mastery_evidence:structure@planet|Saturn|9|2|+consistency、mastery_evidence:selfDirection@planet|Mars|0|5|、mastery_evidence:emotionalResponse@planet|Pluto|11|6|+harmony、mastery_evidence:novelty@planet|Sun|8|9|、mastery_evidence:freedom@planet|Saturn|10|7|+novelty
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 如何把學到的知識真正用出來？（study-knowledge-application）— WARNING

- category / topicId：study / study
- intent / questionFocus：direction / knowledge_application
- answerTarget：knowledge_application
- answerTargets：把知識轉成行動或作品的方式、適合的輸出與練習形式
- detailLabels：把知識用出來的方式、適合的輸出形式
- semanticKeys：knowledge_application:novelty@planet|Jupiter|8|9|+visibility、knowledge_application:practicalCare@planet|Mercury|5|10|+dialogue、knowledge_application:novelty@planet|Venus|8|10|+freedom、knowledge_application:depthTrust@planet|Mercury|7|12|+consistency、knowledge_application:freedom@planet|Mercury|10|10|+novelty、knowledge_application:depthTrust@planet|Pluto|7|12|+intensity、knowledge_application:novelty@planet|Mercury|8|10|、knowledge_application:consistency@planet|Venus|1|2|+structure、knowledge_application:selfDirection@planet|Mars|0|5|、knowledge_application:depthTrust@planet|Uranus|7|4|+emotionalResponse、knowledge_application:novelty@planet|Sun|8|9|、knowledge_application:freedom@planet|Saturn|10|7|+depthTrust
- fallback：0%
- 重複風險：title/detail 0.14；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 命盤中最重要的三個人生課題是什麼？（general-top-themes）— WARNING

- category / topicId：general / general
- intent / questionFocus：overview / top_life_themes
- answerTarget：top_life_themes
- answerTargets：命盤中最突出的主題、這些主題彼此的關聯
- detailLabels：命盤中最突出的主題、主題之間的關聯
- semanticKeys：top_life_themes:selfDirection@planet|Sun|0|1|、top_life_themes:structure@planet|Sun|9|10|、top_life_themes:novelty@planet|Venus|8|10|+freedom、top_life_themes:emotionalResponse@planet|Moon|3|4|、top_life_themes:novelty@planet|Moon|8|4|+freedom、top_life_themes:structure@planet|Jupiter|9|10|、top_life_themes:novelty@planet|Mercury|8|10|+visibility、top_life_themes:dialogue@planet|Mercury|5|4|+structure、top_life_themes:harmony@planet|Moon|6|7|、top_life_themes:depthTrust@planet|Moon|7|10|、top_life_themes:selfDirection@planet|Neptune|0|7|、top_life_themes:consistency@planet|Venus|1|4|+freedom
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0.04；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 我的核心優勢（general-core-strength）— WARNING

- category / topicId：general / general
- intent / questionFocus：strength / core_strength
- answerTarget：core_strength
- answerTargets：命盤中最核心的優勢、這股優勢展現的方式
- detailLabels：命盤中最核心的優勢、這股優勢展現的方式
- semanticKeys：strength:selfDirection@planet|Mars|0|10|、strength:structure@planet|Saturn|9|10|、strength:freedom@planet|Uranus|10|1|、strength:emotionalResponse@planet|Moon|3|4|、strength:harmony@planet|Venus|11|10|+emotionalResponse、strength:emotionalResponse@planet|Neptune|11|12|、strength:visibility@planet|Saturn|4|2|、strength:consistency@planet|Venus|1|2|、strength:visibility@planet|Sun|4|5|、strength:structure@planet|Mercury|5|6|+dialogue、strength:novelty@planet|Jupiter|8|9|、strength:consistency@planet|Pluto|1|9|+depthTrust
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0.05；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 最容易反覆出現的課題（general-recurring-issue）— PASS

- category / topicId：general / general
- intent / questionFocus：challenge / recurring_life_issue
- answerTarget：recurring_life_issue
- answerTargets：反覆出現的核心課題、這個課題通常出現的情境
- detailLabels：最常在哪種情況發生、接著通常怎麼反應
- semanticKeys：blindspot:consistency@point|Node|1||+selfDirection、blindspot:structure@planet|Saturn|9|10|+freedom、blindspot:emotionalResponse@point|Node|3||+dialogue、blindspot:visibility@point|Node|4||+emotionalResponse、blindspot:structure@planet|Saturn|9|10|+depthTrust、blindspot:selfDirection@point|Node|0||、blindspot:structure@planet|Saturn|4|2|+visibility、blindspot:structure@planet|Saturn|9|2|+dialogue、blindspot:visibility@planet|Saturn|4|12|+structure、blindspot:consistency@planet|Saturn|1|6|+harmony、blindspot:structure@point|Node|9||、blindspot:novelty@point|Node|8||+freedom
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 0.78

### 適合優先發展的方向（general-priority-direction）— WARNING

- category / topicId：general / general
- intent / questionFocus：direction / priority_direction
- answerTarget：priority_direction
- answerTargets：值得優先投入的方向、這個方向成熟後的樣子
- detailLabels：值得優先投入的方向、成熟後的樣子
- semanticKeys：priority_direction:selfDirection@planet|Mars|0|10|、priority_direction:structure@planet|Saturn|9|10|、priority_direction:freedom@planet|Uranus|10|1|+novelty、priority_direction:emotionalResponse@planet|Moon|3|4|、priority_direction:harmony@planet|Venus|11|10|+visibility、priority_direction:emotionalResponse@planet|Neptune|11|12|、priority_direction:visibility@planet|Saturn|4|2|、priority_direction:consistency@planet|Venus|1|2|、priority_direction:visibility@planet|Sun|4|5|、priority_direction:practicalCare@planet|Mercury|5|6|+structure、priority_direction:novelty@planet|Jupiter|8|9|、priority_direction:consistency@planet|Pluto|1|9|+visibility
- fallback：0%
- 重複風險：title/detail 0.14；headline/detail 0.05；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 如何平衡目前的內在矛盾（general-inner-tension）— WARNING

- category / topicId：general / general
- intent / questionFocus：tension / inner_tension_balance
- answerTarget：inner_tension_balance
- answerTargets：內在拉扯的兩股力量、練習整合的方向
- detailLabels：內在拉扯的兩股力量、練習整合的方向
- semanticKeys：inner_tension_balance:selfDirection@aspect|Mars-Sun:conjunction|||+visibility、inner_tension_balance:selfDirection@aspect|Mars-Sun:trine|||+visibility、inner_tension_balance:selfDirection@aspect|Mars-Sun:square|||+visibility、inner_tension_balance:visibility@aspect|Sun-Venus:sextile|||+harmony
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

### 面對重大選擇時，我最可靠的判斷依據是什麼？（general-decision-basis）— WARNING

- category / topicId：general / general
- intent / questionFocus：direction / major_decision_basis
- answerTarget：major_decision_basis
- answerTargets：重大選擇時最可靠的判斷原則、辨認方向是否適合的條件
- detailLabels：做決定時先確認什麼、方向適合你的具體訊號
- semanticKeys：major_decision_basis:selfDirection@planet|Mars|0|10|、major_decision_basis:structure@planet|Saturn|9|10|、major_decision_basis:freedom@planet|Uranus|10|1|+novelty、major_decision_basis:emotionalResponse@planet|Moon|3|4|、major_decision_basis:structure@planet|Sun|9|10|+harmony、major_decision_basis:emotionalResponse@planet|Neptune|11|12|、major_decision_basis:visibility@planet|Saturn|4|2|、major_decision_basis:consistency@planet|Venus|1|2|、major_decision_basis:visibility@planet|Sun|4|5|、major_decision_basis:practicalCare@planet|Mercury|5|6|+structure、major_decision_basis:novelty@planet|Jupiter|8|9|、major_decision_basis:novelty@point|Node|8||+consistency
- fallback：0%
- 重複風險：title/detail 0；headline/detail 0.11；跨命盤 1
- WARNING：其中兩張測試盤的主結論較接近，原因是主導語義或落座相同

