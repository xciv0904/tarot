var CITY_LIST = [{"zh":"台北市","en":"Taipei","lat":25.033,"lon":121.5654,"tz":"Asia/Taipei"},{"zh":"新北市","en":"New Taipei","lat":25.017,"lon":121.4627,"tz":"Asia/Taipei"},{"zh":"桃園市","en":"Taoyuan","lat":24.9936,"lon":121.301,"tz":"Asia/Taipei"},{"zh":"台中市","en":"Taichung","lat":24.1477,"lon":120.6736,"tz":"Asia/Taipei"},{"zh":"台南市","en":"Tainan","lat":22.9998,"lon":120.2269,"tz":"Asia/Taipei"},{"zh":"高雄市","en":"Kaohsiung","lat":22.6273,"lon":120.3014,"tz":"Asia/Taipei"},{"zh":"基隆市","en":"Keelung","lat":25.1276,"lon":121.7392,"tz":"Asia/Taipei"},{"zh":"新竹市","en":"Hsinchu City","lat":24.8138,"lon":120.9675,"tz":"Asia/Taipei"},{"zh":"新竹縣","en":"Hsinchu County","lat":24.8387,"lon":121.0177,"tz":"Asia/Taipei"},{"zh":"苗栗縣","en":"Miaoli","lat":24.5602,"lon":120.8214,"tz":"Asia/Taipei"},{"zh":"彰化縣","en":"Changhua","lat":24.0518,"lon":120.5161,"tz":"Asia/Taipei"},{"zh":"南投縣","en":"Nantou","lat":23.9609,"lon":120.9718,"tz":"Asia/Taipei"},{"zh":"雲林縣","en":"Yunlin","lat":23.7092,"lon":120.4313,"tz":"Asia/Taipei"},{"zh":"嘉義市","en":"Chiayi City","lat":23.4801,"lon":120.4491,"tz":"Asia/Taipei"},{"zh":"嘉義縣","en":"Chiayi County","lat":23.4518,"lon":120.2555,"tz":"Asia/Taipei"},{"zh":"屏東縣","en":"Pingtung","lat":22.5519,"lon":120.5487,"tz":"Asia/Taipei"},{"zh":"宜蘭縣","en":"Yilan","lat":24.7021,"lon":121.7378,"tz":"Asia/Taipei"},{"zh":"花蓮縣","en":"Hualien","lat":23.9871,"lon":121.6015,"tz":"Asia/Taipei"},{"zh":"台東縣","en":"Taitung","lat":22.7583,"lon":121.1444,"tz":"Asia/Taipei"},{"zh":"澎湖縣","en":"Penghu","lat":23.5711,"lon":119.5793,"tz":"Asia/Taipei"},{"zh":"金門縣","en":"Kinmen","lat":24.4326,"lon":118.317,"tz":"Asia/Taipei"},{"zh":"連江縣(馬祖)","en":"Lienchiang (Matsu)","lat":26.1608,"lon":119.9515,"tz":"Asia/Taipei"},{"zh":"北京","en":"Beijing","lat":39.9042,"lon":116.4074,"tz":"Asia/Shanghai"},{"zh":"上海","en":"Shanghai","lat":31.2304,"lon":121.4737,"tz":"Asia/Shanghai"},{"zh":"廣州","en":"Guangzhou","lat":23.1291,"lon":113.2644,"tz":"Asia/Shanghai"},{"zh":"深圳","en":"Shenzhen","lat":22.5431,"lon":114.0579,"tz":"Asia/Shanghai"},{"zh":"成都","en":"Chengdu","lat":30.5728,"lon":104.0668,"tz":"Asia/Shanghai"},{"zh":"杭州","en":"Hangzhou","lat":30.2741,"lon":120.1551,"tz":"Asia/Shanghai"},{"zh":"南京","en":"Nanjing","lat":32.0603,"lon":118.7969,"tz":"Asia/Shanghai"},{"zh":"武漢","en":"Wuhan","lat":30.5928,"lon":114.3055,"tz":"Asia/Shanghai"},{"zh":"西安","en":"Xi'an","lat":34.3416,"lon":108.9398,"tz":"Asia/Shanghai"},{"zh":"重慶","en":"Chongqing","lat":29.4316,"lon":106.9123,"tz":"Asia/Shanghai"},{"zh":"天津","en":"Tianjin","lat":39.3434,"lon":117.3616,"tz":"Asia/Shanghai"},{"zh":"蘇州","en":"Suzhou","lat":31.2989,"lon":120.5853,"tz":"Asia/Shanghai"},{"zh":"青島","en":"Qingdao","lat":36.0671,"lon":120.3826,"tz":"Asia/Shanghai"},{"zh":"廈門","en":"Xiamen","lat":24.4798,"lon":118.0894,"tz":"Asia/Shanghai"},{"zh":"昆明","en":"Kunming","lat":25.0389,"lon":102.7183,"tz":"Asia/Shanghai"},{"zh":"香港","en":"Hong Kong","lat":22.3193,"lon":114.1694,"tz":"Asia/Hong_Kong"},{"zh":"澳門","en":"Macau","lat":22.1987,"lon":113.5439,"tz":"Asia/Macau"},{"zh":"東京","en":"Tokyo","lat":35.6762,"lon":139.6503,"tz":"Asia/Tokyo"},{"zh":"大阪","en":"Osaka","lat":34.6937,"lon":135.5023,"tz":"Asia/Tokyo"},{"zh":"名古屋","en":"Nagoya","lat":35.1815,"lon":136.9066,"tz":"Asia/Tokyo"},{"zh":"橫濱","en":"Yokohama","lat":35.4437,"lon":139.638,"tz":"Asia/Tokyo"},{"zh":"福岡","en":"Fukuoka","lat":33.5904,"lon":130.4017,"tz":"Asia/Tokyo"},{"zh":"札幌","en":"Sapporo","lat":43.0618,"lon":141.3545,"tz":"Asia/Tokyo"},{"zh":"京都","en":"Kyoto","lat":35.0116,"lon":135.7681,"tz":"Asia/Tokyo"},{"zh":"沖繩(那霸)","en":"Okinawa (Naha)","lat":26.2124,"lon":127.6809,"tz":"Asia/Tokyo"},{"zh":"首爾","en":"Seoul","lat":37.5665,"lon":126.978,"tz":"Asia/Seoul"},{"zh":"釜山","en":"Busan","lat":35.1796,"lon":129.0756,"tz":"Asia/Seoul"},{"zh":"新加坡","en":"Singapore","lat":1.3521,"lon":103.8198,"tz":"Asia/Singapore"},{"zh":"吉隆坡","en":"Kuala Lumpur","lat":3.139,"lon":101.6869,"tz":"Asia/Kuala_Lumpur"},{"zh":"曼谷","en":"Bangkok","lat":13.7563,"lon":100.5018,"tz":"Asia/Bangkok"},{"zh":"雅加達","en":"Jakarta","lat":-6.2088,"lon":106.8456,"tz":"Asia/Jakarta"},{"zh":"馬尼拉","en":"Manila","lat":14.5995,"lon":120.9842,"tz":"Asia/Manila"},{"zh":"胡志明市","en":"Ho Chi Minh City","lat":10.8231,"lon":106.6297,"tz":"Asia/Ho_Chi_Minh"},{"zh":"河內","en":"Hanoi","lat":21.0285,"lon":105.8542,"tz":"Asia/Ho_Chi_Minh"},{"zh":"新德里","en":"New Delhi","lat":28.6139,"lon":77.209,"tz":"Asia/Kolkata"},{"zh":"孟買","en":"Mumbai","lat":19.076,"lon":72.8777,"tz":"Asia/Kolkata"},{"zh":"杜拜","en":"Dubai","lat":25.2048,"lon":55.2708,"tz":"Asia/Dubai"},{"zh":"伊斯坦堡","en":"Istanbul","lat":41.0082,"lon":28.9784,"tz":"Europe/Istanbul"},{"zh":"特拉維夫","en":"Tel Aviv","lat":32.0853,"lon":34.7818,"tz":"Asia/Jerusalem"},{"zh":"雪梨","en":"Sydney","lat":-33.8688,"lon":151.2093,"tz":"Australia/Sydney"},{"zh":"墨爾本","en":"Melbourne","lat":-37.8136,"lon":144.9631,"tz":"Australia/Melbourne"},{"zh":"奧克蘭","en":"Auckland","lat":-36.8485,"lon":174.7633,"tz":"Pacific/Auckland"},{"zh":"倫敦","en":"London","lat":51.5074,"lon":-0.1278,"tz":"Europe/London"},{"zh":"巴黎","en":"Paris","lat":48.8566,"lon":2.3522,"tz":"Europe/Paris"},{"zh":"柏林","en":"Berlin","lat":52.52,"lon":13.405,"tz":"Europe/Berlin"},{"zh":"羅馬","en":"Rome","lat":41.9028,"lon":12.4964,"tz":"Europe/Rome"},{"zh":"馬德里","en":"Madrid","lat":40.4168,"lon":-3.7038,"tz":"Europe/Madrid"},{"zh":"阿姆斯特丹","en":"Amsterdam","lat":52.3676,"lon":4.9041,"tz":"Europe/Amsterdam"},{"zh":"蘇黎世","en":"Zurich","lat":47.3769,"lon":8.5417,"tz":"Europe/Zurich"},{"zh":"維也納","en":"Vienna","lat":48.2082,"lon":16.3738,"tz":"Europe/Vienna"},{"zh":"莫斯科","en":"Moscow","lat":55.7558,"lon":37.6173,"tz":"Europe/Moscow"},{"zh":"雅典","en":"Athens","lat":37.9838,"lon":23.7275,"tz":"Europe/Athens"},{"zh":"斯德哥爾摩","en":"Stockholm","lat":59.3293,"lon":18.0686,"tz":"Europe/Stockholm"},{"zh":"都柏林","en":"Dublin","lat":53.3498,"lon":-6.2603,"tz":"Europe/Dublin"},{"zh":"里斯本","en":"Lisbon","lat":38.7223,"lon":-9.1393,"tz":"Europe/Lisbon"},{"zh":"布拉格","en":"Prague","lat":50.0755,"lon":14.4378,"tz":"Europe/Prague"},{"zh":"紐約","en":"New York","lat":40.7128,"lon":-74.006,"tz":"America/New_York"},{"zh":"洛杉磯","en":"Los Angeles","lat":34.0522,"lon":-118.2437,"tz":"America/Los_Angeles"},{"zh":"舊金山","en":"San Francisco","lat":37.7749,"lon":-122.4194,"tz":"America/Los_Angeles"},{"zh":"芝加哥","en":"Chicago","lat":41.8781,"lon":-87.6298,"tz":"America/Chicago"},{"zh":"休士頓","en":"Houston","lat":29.7604,"lon":-95.3698,"tz":"America/Chicago"},{"zh":"西雅圖","en":"Seattle","lat":47.6062,"lon":-122.3321,"tz":"America/Los_Angeles"},{"zh":"波士頓","en":"Boston","lat":42.3601,"lon":-71.0589,"tz":"America/New_York"},{"zh":"拉斯維加斯","en":"Las Vegas","lat":36.1699,"lon":-115.1398,"tz":"America/Los_Angeles"},{"zh":"多倫多","en":"Toronto","lat":43.6532,"lon":-79.3832,"tz":"America/Toronto"},{"zh":"溫哥華","en":"Vancouver","lat":49.2827,"lon":-123.1207,"tz":"America/Vancouver"},{"zh":"檀香山(夏威夷)","en":"Honolulu","lat":21.3069,"lon":-157.8583,"tz":"Pacific/Honolulu"},{"zh":"聖保羅","en":"Sao Paulo","lat":-23.5505,"lon":-46.6333,"tz":"America/Sao_Paulo"},{"zh":"布宜諾斯艾利斯","en":"Buenos Aires","lat":-34.6037,"lon":-58.3816,"tz":"America/Argentina/Buenos_Aires"},{"zh":"開羅","en":"Cairo","lat":30.0444,"lon":31.2357,"tz":"Africa/Cairo"},{"zh":"約翰尼斯堡","en":"Johannesburg","lat":-26.2041,"lon":28.0473,"tz":"Africa/Johannesburg"}];

var ZODIAC_SIGNS = [
  { zh: '牡羊座', en: 'Aries', sym: '♈', elem: '火', trait: '直接衝勁、敢於率先行動' },
  { zh: '金牛座', en: 'Taurus', sym: '♉', elem: '土', trait: '穩健務實、重視安全感與感官享受' },
  { zh: '雙子座', en: 'Gemini', sym: '♊', elem: '風', trait: '靈活善變、好奇心旺盛、擅長多工與交流' },
  { zh: '巨蟹座', en: 'Cancer', sym: '♋', elem: '水', trait: '敏感細膩、重視情感連結與歸屬感' },
  { zh: '獅子座', en: 'Leo', sym: '♌', elem: '火', trait: '熱情自信、渴望被看見與肯定' },
  { zh: '處女座', en: 'Virgo', sym: '♍', elem: '土', trait: '細膩理性、追求完美與實用效率' },
  { zh: '天秤座', en: 'Libra', sym: '♎', elem: '風', trait: '講求平衡、重視和諧與人際美感' },
  { zh: '天蠍座', en: 'Scorpio', sym: '♏', elem: '水', trait: '深沉專注、重視真相與強烈的情感深度' },
  { zh: '射手座', en: 'Sagittarius', sym: '♐', elem: '火', trait: '樂觀開闊、渴望自由與探索意義' },
  { zh: '摩羯座', en: 'Capricorn', sym: '♑', elem: '土', trait: '務實穩健、重視長期目標與社會地位' },
  { zh: '水瓶座', en: 'Aquarius', sym: '♒', elem: '風', trait: '獨立理性、重視自由與群體理想' },
  { zh: '雙魚座', en: 'Pisces', sym: '♓', elem: '水', trait: '感性浪漫、富同理心、容易受直覺與情緒牽引' },
];

var PLANET_DEFS = [
  { key: 'Sun', zh: '太陽', sym: '☉', meaning: '核心自我、意志與生命力', kw: '核心自我' },
  { key: 'Moon', zh: '月亮', sym: '☽', meaning: '情緒、內在需求與安全感', kw: '情緒安全感' },
  { key: 'Mercury', zh: '水星', sym: '☿', meaning: '思考方式與溝通表達', kw: '思考溝通' },
  { key: 'Venus', zh: '金星', sym: '♀', meaning: '愛與美的品味、人際吸引力', kw: '愛與美感' },
  { key: 'Mars', zh: '火星', sym: '♂', meaning: '行動力、慾望與衝勁', kw: '行動慾望' },
  { key: 'Jupiter', zh: '木星', sym: '♃', meaning: '擴展、幸運與信念成長', kw: '信念成長' },
  { key: 'Saturn', zh: '土星', sym: '♄', meaning: '紀律、責任與人生課題', kw: '紀律責任' },
  { key: 'Uranus', zh: '天王星', sym: '♅', meaning: '獨立、變革與突破常規', kw: '獨立求變' },
  { key: 'Neptune', zh: '海王星', sym: '♆', meaning: '靈感、夢想與直覺', kw: '直覺夢想' },
  { key: 'Pluto', zh: '冥王星', sym: '♇', meaning: '深層轉化與掌控力量', kw: '深層轉化' },
];

var HOUSE_MEANINGS = [
  '自我形象、外在表現與人生起點的態度',
  '金錢、物質資源與自我價值感',
  '溝通、學習、手足與日常生活的交流',
  '家庭、根源、內在安全感與情感基礎',
  '戀愛、創造力、玩樂與自我表現的舞台',
  '工作日常、健康習慣與服務他人的方式',
  '伴侶關係、合作與一對一的人際連結',
  '深層親密、共享資源、危機與轉化',
  '遠方、高等教育、信念與人生哲學',
  '事業、社會地位與公眾形象',
  '朋友、社群、理想與未來願景',
  '潛意識、隱藏面、靈性與需要獨處沉澱之處',
];

/* 給第一次接觸占星的使用者：把「行星＝什麼需求、星座＝怎麼做、宮位＝在哪裡發生」翻成生活語言。 */
var PLANET_BEGINNER = {
  Sun:{question:'什麼事情會讓你覺得「這就是我」？',verb:'建立自信、確認自己想成為誰',result:'感覺自己有價值、有方向',strength:'能逐漸活出自己的主見與存在感',watch:'不要只靠表現或別人的肯定證明自己',
    coreNeed:['確立自己的核心價值','知道自己真正想成為誰'],function:'整合自我意識，決定要活出什麼樣的核心方向',matureAim:'穩定地活出自己的方向',imbalance:'過度依賴掌聲或表現來確認自己'},
  Moon:{question:'累了或不安時，你真正需要什麼？',verb:'照顧情緒、尋找安心感',result:'讓心情慢慢穩定下來',strength:'能感覺自己與別人真正的情緒需求',watch:'不要等到情緒累積很久才承認自己需要休息',
    coreNeed:['找到讓情緒安定下來的方式','安頓好起伏不定的心情'],function:'感知內在需求，調節情緒與安全感',matureAim:'安穩地照顧自己的情緒',imbalance:'把情緒一直往內壓，直到突然爆發或封閉自己'},
  Mercury:{question:'你習慣怎麼思考、學習和說話？',verb:'理解事情、整理想法並與人溝通',result:'把腦中的想法說清楚',strength:'能發展出自己擅長的理解與表達方式',watch:'不要只顧著想得正確，卻忽略對方是否聽得懂',
    coreNeed:['把想法整理到自己和別人都懂','把腦中的想法說得清楚'],function:'蒐集資訊、進行邏輯連結並轉換成語言',matureAim:'依對象調整表達方式',imbalance:'想得太多、講得太快，或遲遲無法下決定'},
  Venus:{question:'什麼會讓你喜歡、靠近並覺得值得？',verb:'建立關係、表達喜歡與判斷價值',result:'感受到舒服、被欣賞與有連結',strength:'知道自己喜歡什麼，也能散發自然吸引力',watch:'不要為了維持喜歡或和諧而勉強迎合',
    coreNeed:['確認自己值得被喜歡與欣賞','找到讓彼此都舒服的相處方式'],function:'判斷價值、建立關係中的親密與美感連結',matureAim:'不靠討好去維持關係',imbalance:'為了維持和諧而勉強自己'},
  Mars:{question:'你想要一件事時，會怎麼採取行動？',verb:'爭取想要的事、表達慾望與界線',result:'把想法變成實際行動',strength:'能在需要時拿出勇氣與推進力',watch:'留意衝動、壓抑怒氣，或把所有事情都當成競爭',
    coreNeed:['把想要的東西真的爭取到手','把心裡的衝勁化為實際行動'],function:'轉化慾望為具體行動，捍衛自己的界線',matureAim:'拿捏力道、果斷推進',imbalance:'衝動行事後又後悔，或悶著怒氣不說'},
  Jupiter:{question:'你在哪裡容易看見機會並建立信心？',verb:'擴大眼界、嘗試機會與建立信念',result:'覺得人生還有更多可能',strength:'能用樂觀與格局帶動自己和別人',watch:'不要因為太有信心而答應過多或忽略細節',
    coreNeed:['相信人生還有更多可能','為自己的人生找到更大的格局'],function:'擴張視野、建立信念並辨識機會',matureAim:'樂觀而不失準頭',imbalance:'把話說得太滿，或忽略細節風險'},
  Saturn:{question:'你在哪裡需要練習耐心、責任與界線？',verb:'面對責任、建立規則並累積實力',result:'得到真正可靠的安全感與能力',strength:'願意長期投入，最後形成別人取代不了的專業',watch:'不要因為怕犯錯而過度嚴格、拖延或否定自己',
    coreNeed:['換來真正可靠、拿得出來的實力','打下經得起考驗的基礎'],function:'建立紀律、承擔責任並劃出穩固的界線',matureAim:'扛得住壓力、值得信任',imbalance:'害怕犯錯而不斷拖延、自我否定'},
  Uranus:{question:'你在哪裡最不想照別人的規則走？',verb:'打破舊做法、保有自由並嘗試改變',result:'活出更真實而有選擇的自己',strength:'能提出新方法，看見別人沒想到的可能',watch:'不要只為了反對而改變，或突然切斷重要連結',
    coreNeed:['照自己的方式活、保有選擇的自由','在既有框架外找到自己的路'],function:'打破慣性、引入改變並保留選擇的自由',matureAim:'保有步調仍維繫關係',imbalance:'為了反對而反對，或突然切斷關係'},
  Neptune:{question:'你在哪裡最容易有想像、同理與直覺？',verb:'感受氣氛、想像可能並追尋理想',result:'與內在感受、創意或信念連結',strength:'有細膩的同理心、創意與直覺感受力',watch:'需要分清楚理想與現實，避免過度投射或逃避',
    coreNeed:['貼近說不清楚但真實的感受','把心裡朦朧的感覺具體活出來'],function:'感受氛圍、想像可能性並靠近理想',matureAim:'把感受化為實際貢獻',imbalance:'分不清理想與現實，轉而逃避問題'},
  Pluto:{question:'你在哪裡會經歷「不能再照舊」的深層改變？',verb:'面對真相、放下控制並重新建立力量',result:'從危機或執著中長出更穩定的內在力量',strength:'能看見問題核心，也有走過低谷後重生的韌性',watch:'留意過度控制、猜疑，或把事情逼到非黑即白',
    coreNeed:['在危機中找回真正能掌握的力量','穿越低潮、重新拿回主導權'],function:'直視真相、放下無法控制的部分並重新整合力量',matureAim:'看穿核心、走出低潮',imbalance:'用控制或猜疑，避免再次感覺失控'}
};
var SIGN_BEGINNER = [
  {mode:'先做再說、直接嘗試',behavior:'很快表態並主動跨出第一步',strength:'能果斷開啟新局，快速做出反應',watch:'太急時容易忽略別人的速度',
    motivation:'想證明自己做得到、不想錯過先機',method:'直接嘗試、邊做邊修正',matureExpression:'敢於開創，也懂得留意同行的人跟不跟得上',shadow:'把別人的猶豫當成拖累，或用衝動代替真正的判斷'},
  {mode:'確認安全與實際價值後，穩穩進行',behavior:'先觀察是否可靠，再用自己的步調持續投入',strength:'能穩定累積，把過程中的成果扎實留下來',watch:'太想維持現狀時可能不容易轉彎',
    motivation:'想要確認眼前的東西是真的、值得投入',method:'慢慢觀察、反覆確認後才行動',matureExpression:'穩定地把事情做到底，也願意在必要時調整方向',shadow:'把不想改變當成安全感，拒絕調整'},
  {mode:'蒐集資訊、邊聊邊想並保持彈性',behavior:'先問、先比較，也可能同時嘗試幾種方法',strength:'能快速學習，把不同資訊串連並說給別人聽懂',watch:'資訊太多時容易分心或改變太快',
    motivation:'想知道更多，也想把想法跟別人交換、對照',method:'同時蒐集資訊、透過交談釐清想法',matureExpression:'能把龐雜的資訊整理成別人聽得懂的話',shadow:'什麼都碰一點卻不深入，說得快卻沒想清楚'},
  {mode:'先感受氣氛與關係是否安心',behavior:'留意彼此感受，確認有信任後才真正投入',strength:'能細膩察覺情緒，妥善照顧身邊的人',watch:'不安時容易退回保護殼或把話放在心裡',
    motivation:'想先確認這裡安全，才敢真正打開自己',method:'用感受判讀氣氛，記住情感細節',matureExpression:'能溫柔地照顧人，同時也記得照顧自己的情緒',shadow:'沒被回應時就退回殼裡，或用情緒勒索代替直接表達'},
  {mode:'大方投入、真誠表現並希望被看見',behavior:'用熱情與創意表達自己，也願意鼓舞別人',strength:'能用熱情與創意帶動氣氛，感染身邊的人',watch:'沒有得到回應時可能特別受傷或逞強',
    motivation:'想被真心看見、也想真心地為別人加油',method:'大方展現自己，用熱情帶動氣氛',matureExpression:'能享受被關注，也能把光分給身邊的人',shadow:'沒被注意到就覺得受傷，或需要不斷被讚美才安心'},
  {mode:'先觀察細節、找出問題，再一步步改善',behavior:'分析哪裡可以更好，並用實際行動處理',strength:'能拆解複雜狀況，把混亂整理成可執行的步驟',watch:'標準太高時容易焦慮、挑剔或看不到已完成的部分',
    motivation:'想把事情做到真正有用、經得起檢驗',method:'拆解問題、找出可改善的細節',matureExpression:'能把複雜的狀況整理出頭緒，並實際解決問題',shadow:'標準訂得太高，看不見自己已完成的部分'},
  {mode:'先考慮彼此立場，再尋找公平好看的做法',behavior:'比較不同選項，盡量讓關係與結果都平衡',strength:'能站在不同立場思考，協調出彼此都能接受的做法',watch:'太怕衝突時容易猶豫或把真正想法往後放',
    motivation:'想在關係裡找到公平，也想讓結果看起來順眼',method:'比較選項、考慮各方立場再決定',matureExpression:'能協調不同意見，也保有自己真正的立場',shadow:'太怕衝突而不斷妥協，或把決定一直往後拖延'},
  {mode:'深入觀察、確認真相與信任後才投入',behavior:'不只看表面，會追問真正的動機與核心問題',strength:'能看穿表象、抓住核心，撐過艱難的處境',watch:'不安全時容易猜疑、控制或不願放手',
    motivation:'想知道事情背後真正的動機和真相',method:'深入觀察、確認信任後才投入',matureExpression:'能在關係中保持深度，也懂得適時放手',shadow:'對還沒發生的事先起疑心'},
  {mode:'先看更大的可能，再從經驗中找答案',behavior:'願意嘗試新環境、新觀點或直接去體驗',strength:'能看見長遠的意義，坦率地把想法說出來',watch:'太追求自由時可能忽略承諾與眼前細節',
    motivation:'想看見更大的世界、找到人生真正的意義',method:'直接體驗、從經驗中歸納答案',matureExpression:'能保持坦率與樂觀，也懂得對承諾負責',shadow:'把自由看得比責任重要，或話說得太直接而傷到人'},
  {mode:'設定目標、安排步驟，再耐心做到有成果',behavior:'先判斷責任與效益，願意為長期結果努力',strength:'能自我要求，一步步把大目標落實完成',watch:'太重視成果時容易給自己過大壓力',
    motivation:'想靠自己的努力換來看得見的成果與地位',method:'設定目標、按部就班執行',matureExpression:'能穩定承擔重任，也懂得在有成果後放自己一馬',shadow:'把自我價值全押在成就上，過度壓榨自己'},
  {mode:'保持獨立、從不同角度思考',behavior:'先拉開距離觀察，再提出自己的新做法',strength:'能跳脫框架思考，看見群體與未來的可能',watch:'太理性時可能讓人感覺疏離或難以靠近',
    motivation:'想保有獨立思考，也想為更大的群體找出路',method:'拉開距離觀察，提出跳脫框架的做法',matureExpression:'能理性分析局勢，也懂得適時靠近身邊的人',shadow:'用疏離掩飾在意，或刻意唱反調'},
  {mode:'跟著直覺、感受與想像慢慢靠近答案',behavior:'先感受整體氛圍，再用同理或創意回應',strength:'能用細膩的想像力，理解難以言說的感受',watch:'界線不清時容易受影響、逃避或理想化',
    motivation:'想貼近說不清楚、但確實存在的感受與理想',method:'靠直覺和同理去感受',matureExpression:'能用細膩的想像力理解別人，也守得住自己的界線',shadow:'界線模糊到被別人的情緒淹沒，或用逃避代替面對'}
];
var HOUSE_BEGINNER = [
  {area:'你的第一印象、外在風格與面對新環境的方式',example:'剛認識人、開始新事情或需要自己做主',
    lifeArea:'新的開始與自我形象',coreQuestion:'我要用什麼樣子踏出第一步？',activation:'進入新環境、需要自己拿主意或第一次見面時',growthTask:'練習讓別人看到真實的自己，而非反射動作'},
  {area:'金錢、安全感、擁有的資源與自我價值',example:'談收入、花錢、累積能力或判斷自己值不值得',
    lifeArea:'安全感與自我價值',coreQuestion:'什麼能讓我真正感覺踏實、有底氣？',activation:'處理金錢或評估自己的能力時',growthTask:'練習把價值感建立在自己身上'},
  {area:'日常溝通、學習、資訊與身邊的人際往來',example:'聊天、學新東西、寫訊息或處理日常雜事',
    lifeArea:'日常學習與溝通',coreQuestion:'我要怎麼把想法說出去、聽懂別人在說什麼？',activation:'聊天、學新東西或處理雜事時',growthTask:'練習把資訊整理成真正有用的理解'},
  {area:'家庭、居住、內在安全感與私下的自己',example:'回到家、面對家人、需要休息或整理童年感受',
    lifeArea:'家庭根源與內在安全感',coreQuestion:'什麼樣的環境會讓我真正感覺到家？',activation:'回到家或面對家人時',growthTask:'練習分辨童年的慣性，自己決定延續或修正'},
  {area:'戀愛、創作、玩樂與讓自己發光的方式',example:'談戀愛、做作品、培養興趣或勇敢表現自己',
    lifeArea:'戀愛、創作與自我表現',coreQuestion:'什麼能讓我真心感到快樂、想投入其中？',activation:'談戀愛、做作品或展現自己時',growthTask:'練習享受過程，而非只在意結果或評價'},
  {area:'工作日常、健康、習慣與把事情做好',example:'安排工作流程、照顧身體或處理每天必須完成的事',
    lifeArea:'工作日常與健康習慣',coreQuestion:'我要怎麼把事情確實做好、把自己照顧好？',activation:'安排每天流程或處理例行任務時',growthTask:'練習做好事情之餘，不苛責自己不夠完美'},
  {area:'伴侶、合作與一對一的重要關係',example:'面對另一半、合作對象或需要協調彼此需求',
    lifeArea:'伴侶關係與合作',coreQuestion:'我要怎麼跟另一個人建立平等而長久的關係？',activation:'面對另一半或需要協調彼此需求時',growthTask:'練習在關係裡保有自己，也看見對方的需要'},
  {area:'親密、信任、共同金錢、失去與人生重大轉折',example:'需要談清楚金錢、界線、秘密，或陪自己／別人走過低潮',
    lifeArea:'深層關係與重大轉變',coreQuestion:'我能不能真正信任別人，也接受自己無法完全掌控一切？',activation:'需要談金錢、危機或關係轉折時',growthTask:'練習接受部分事情無法控制'},
  {area:'旅行、進修、信念與你如何理解更大的世界',example:'出國、深造、接觸新觀點或重新思考人生方向',
    lifeArea:'信念與人生視野',coreQuestion:'我相信什麼樣的人生值得去過？',activation:'出國進修或重新思考人生方向時',growthTask:'練習把信念落實成具體行動'},
  {area:'事業、責任、成就與社會如何看見你',example:'做職涯選擇、承擔重要任務或建立專業形象',
    lifeArea:'事業成就與社會地位',coreQuestion:'我想在這個世界上留下什麼樣的印記？',activation:'做職涯選擇或承擔重要任務時',growthTask:'練習讓外在成就與內在想要的方向對齊'},
  {area:'朋友、社群、團隊與對未來的期待',example:'加入團體、經營人脈、共同完成理想或規劃未來',
    lifeArea:'朋友、社群與未來期待',coreQuestion:'我想和什麼樣的人一起走向什麼樣的未來？',activation:'加入團體或規劃共同理想時',growthTask:'練習在群體中保有自己的獨特性'},
  {area:'獨處、潛意識、休息與不容易說出口的感受',example:'需要退到幕後、做夢、療癒、放空或面對內心深處',
    lifeArea:'獨處、潛意識與內在世界',coreQuestion:'當沒有人在看的時候，我真正在面對什麼？',activation:'需要獨處或面對內心深處的時刻',growthTask:'練習把獨處當成充電，而非逃避該面對的事'}
];

var ASPECT_DEFS = {
  conjunction: { zh: '合相', tpl: '緊密融合，{A}的{ak}與{B}的{bk}疊加在一起，力量集中但也可能難以分辨彼此的界線' },
  sextile: { zh: '六分相', tpl: '互相呼應，{A}的{ak}與{B}的{bk}能自然彼此支援，只要主動把握機會就能順勢發揮' },
  square: { zh: '四分相', tpl: '彼此摩擦，{A}的{ak}與{B}的{bk}之間存在需要努力整合的張力，這股拉扯也是推動成長的動力' },
  trine: { zh: '三分相', tpl: '天生和諧，{A}的{ak}與{B}的{bk}能毫不費力地互相配合，是與生俱來的天賦組合' },
  opposition: { zh: '對分相', tpl: '彼此拉扯對照，{A}的{ak}與{B}的{bk}像天秤的兩端，需要練習在中間找到動態平衡' },
};
var ASPECT_COLOR = {
  conjunction: 'rgba(230,205,154,.65)',
  sextile: 'rgba(140,200,150,.55)',
  trine: 'rgba(140,200,150,.55)',
  square: 'rgba(214,120,120,.55)',
  opposition: 'rgba(214,120,120,.55)',
};

/* ---- timezone-aware local time -> UTC ---- */
