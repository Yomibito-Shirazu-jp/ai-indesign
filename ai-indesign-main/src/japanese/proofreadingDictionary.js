/**
 * 校閲辞書データ
 * 常用漢字リスト、表記揺れパターン、不適切表現辞書
 */

// ─────────────────────────────────────────
// 常用漢字 (2,136字) — 2010年改定常用漢字表
// 画数順に全字を収録
// ─────────────────────────────────────────
export const JOYO_KANJI = new Set([
    // 一画
    '一', '乙',
    // 二画
    '二', '十', '人', '入', '八', '九', '七', '又', '了', '力', '刀', '丁',
    // 三画
    '三', '上', '下', '万', '丈', '与', '久', '丸', '及', '口', '土', '士',
    '夕', '大', '女', '子', '寸', '小', '山', '川', '工', '己', '干', '弓',
    '才', '凡', '刃', '千', '叉',
    // 四画
    '不', '中', '予', '互', '五', '井', '仁', '今', '介', '仏', '元', '公',
    '内', '円', '冗', '分', '切', '匹', '化', '区', '午', '升', '収', '友',
    '双', '反', '天', '太', '夫', '孔', '少', '尺', '屯', '幻', '引', '心',
    '戸', '手', '支', '文', '斗', '方', '日', '月', '木', '欠', '止', '比',
    '毛', '氏', '水', '火', '父', '片', '牛', '犬', '王',
    // 五画
    '世', '丘', '主', '以', '仕', '他', '付', '令', '代', '写', '出', '刊',
    '功', '加', '包', '北', '半', '占', '可', '句', '右', '司', '史', '号',
    '四', '外', '央', '失', '奴', '左', '巨', '市', '布', '平', '幼', '広',
    '庁', '弁', '必', '打', '払', '未', '末', '本', '札', '正', '民', '氷',
    '永', '汁', '玉', '甘', '生', '用', '田', '由', '甲', '申', '皮', '目',
    '矛', '矢', '石', '示', '礼', '穴', '立', '冊', '処', '去', '旧', '犯',
    '白', '皿', '込',
    // 六画
    '交', '仮', '会', '伝', '伏', '件', '任', '企', '休', '先', '光', '全',
    '共', '再', '刑', '列', '劣', '各', '合', '吉', '同', '名', '向', '吸',
    '回', '因', '団', '地', '在', '壮', '多', '好', '如', '字', '存', '宅',
    '安', '守', '年', '式', '当', '成', '旨', '早', '旬', '曲', '有', '次',
    '死', '気', '汚', '汗', '江', '池', '灯', '灰', '争', '行', '血', '衣',
    '西', '両', '串', '亜', '兆', '印', '危', '后', '吐', '吏', '壱', '宇',
    '州', '帆', '忙', '扱', '旭', '机', '朱', '朴', '肉', '肌', '臣', '舌',
    '舟', '色', '虫', '耳', '自', '至', '缶', '羊', '米', '竹', '糸', '羽',
    '老', '考', '而', '肋',
    // 七画
    '何', '体', '作', '但', '低', '住', '余', '初', '判', '別', '利', '助',
    '努', '労', '医', '即', '却', '含', '吹', '呈', '告', '吾', '困', '囲',
    '坑', '均', '坊', '壊', '声', '売', '妊', '妙', '完', '対', '寿', '尾',
    '希', '序', '床', '弟', '形', '忌', '応', '忍', '志', '快', '戒', '折',
    '技', '把', '抑', '投', '抗', '攻', '改', '更', '材', '束', '条', '来',
    '杉', '村', '求', '決', '汽', '沈', '没', '沢', '沖', '災', '状', '社',
    '私', '秀', '究', '系', '花', '芸', '角', '言', '谷', '豆', '貝', '赤',
    '走', '足', '身', '車', '近', '返', '里', '麦', '見', '男', '町', '良',
    '免', '乱', '冷', '坂', '妨', '拒', '択', '批', '抜', '忘', '肝', '邪',
    '没', '我',
    // 八画
    '並', '事', '京', '供', '使', '例', '依', '価', '具', '典', '制', '効',
    '券', '刷', '刺', '到', '卒', '協', '参', '叔', '取', '受', '周', '呼',
    '命', '固', '国', '委', '始', '姉', '妹', '姓', '季', '学', '宗', '官',
    '宙', '定', '宝', '実', '居', '届', '岩', '岸', '幸', '底', '店', '府',
    '延', '弦', '性', '怪', '房', '所', '押', '招', '拠', '抱', '放', '斉',
    '昆', '昇', '明', '易', '昔', '松', '林', '枚', '果', '枝', '杯', '東',
    '板', '武', '歩', '毒', '河', '法', '泊', '波', '泣', '注', '油', '治',
    '沿', '炎', '炉', '版', '牧', '物', '的', '直', '知', '空', '突', '者',
    '育', '肢', '肥', '股', '肩', '花', '苦', '茂', '若', '英', '表', '長',
    '門', '雨', '青', '非', '金', '奈', '奉', '拘', '拙', '拓', '披', '泥',
    '阻', '附', '屈', '径', '征', '佳', '舎', '彼', '念', '忠', '怖',
    // 九画
    '信', '保', '便', '修', '俗', '促', '侵', '前', '則', '勇', '勉', '南',
    '厚', '咲', '品', '型', '垣', '城', '変', '奏', '契', '威', '姿', '客',
    '宣', '室', '封', '専', '屋', '建', '待', '律', '後', '思', '急', '政',
    '故', '施', '映', '春', '昨', '星', '昭', '染', '査', '柔', '柱', '段',
    '洋', '洗', '活', '派', '浄', '海', '点', '炭', '界', '畑', '発', '皆',
    '盆', '省', '看', '相', '砂', '研', '祝', '科', '秋', '穂', '約', '紀',
    '美', '耐', '計', '貞', '負', '軍', '郊', '郎', '重', '限', '面', '革',
    '音', '食', '首', '香', '飛', '独', '狭', '胞', '胃', '胆', '拝', '指',
    '持', '挑', '挟', '挙', '昼', '柄', '某', '枯', '架', '要', '侯', '俊',
    '冠', '削', '勅', '叙', '咽', '哀', '帝', '幽', '怒', '恒', '恨', '悔',
    '拾', '洞', '津', '疫', '祈', '紅', '背', '虐', '迫', '逃', '逆', '盾',
    // 十画
    '個', '倍', '倒', '候', '借', '値', '党', '准', '凍', '剣', '剤', '効',
    '勤', '原', '唐', '唇', '哲', '員', '埋', '夏', '害', '家', '宮', '容',
    '射', '展', '差', '席', '師', '庫', '座', '弱', '恐', '恩', '恵', '息',
    '悟', '悦', '振', '挿', '捜', '捕', '料', '旅', '時', '書', '校', '株',
    '根', '格', '桃', '案', '殊', '殺', '流', '浮', '浸', '消', '涙', '烈',
    '特', '珠', '班', '畜', '益', '真', '破', '神', '祖', '秘', '租', '称',
    '素', '紛', '納', '純', '紙', '級', '索', '脂', '脈', '能', '般', '航',
    '荒', '荘', '草', '討', '訓', '記', '財', '起', '酒', '配', '針', '院',
    '陣', '降', '陛', '高', '鬼', '竜', '泰', '胸', '脅', '恥', '悩', '核',
    '桜', '栽', '残', '殿', '浜', '耕', '粉', '笑', '致', '蚊', '蚕', '衷',
    '被', '袖', '透', '途', '陥', '隻', '馬', '骨',
    // 十一画
    '乾', '偏', '停', '健', '側', '副', '動', '勘', '務', '商', '問', '啓',
    '唯', '国', '域', '執', '培', '基', '堂', '婚', '婆', '寂', '密', '宿',
    '寄', '崇', '巣', '帯', '常', '張', '強', '彩', '彫', '得', '患', '悠',
    '情', '惨', '掃', '授', '掘', '採', '接', '控', '推', '措', '描', '救',
    '教', '断', '族', '望', '械', '梅', '条', '梨', '清', '淡', '添', '深',
    '混', '済', '液', '涯', '渇', '猛', '猟', '猫', '率', '現', '理', '産',
    '略', '異', '盛', '眼', '祭', '移', '窒', '章', '笛', '符', '粗', '粒',
    '経', '終', '組', '細', '船', '菓', '菊', '術', '規', '訪', '設', '許',
    '責', '販', '貧', '貨', '週', '進', '都', '部', '閉', '陪', '陰', '雪',
    '頂', '鹿', '魚', '鳥', '麻', '黄', '黒', '累', '脚', '脱', '豚', '逮',
    '野', '釈', '釣', '鎖', '険', '巻', '殻', '球', '瓶', '甚', '粘', '紫',
    '舶', '処', '習', '翌', '蛇', '袋', '陶', '頃',
    // 十二画以上（代表的な常用漢字）
    '割', '創', '勝', '善', '場', '報', '富', '属', '復', '循', '悲', '惑',
    '換', '握', '揮', '援', '揚', '提', '散', '敬', '晩', '普', '景', '最',
    '期', '検', '極', '森', '棋', '植', '業', '欧', '歯', '残', '殖', '減',
    '渡', '温', '港', '湖', '湾', '焦', '然', '無', '番', '画', '痛', '登',
    '短', '硬', '程', '税', '童', '筆', '等', '答', '策', '結', '絶', '統',
    '編', '給', '裁', '装', '覚', '象', '貯', '買', '越', '超', '距', '軽',
    '運', '道', '達', '遅', '量', '開', '間', '集', '雇', '雲', '項', '順',
    '飲', '感', '暗', '想', '意', '愛', '楽', '歌', '概', '準', '溝', '窓',
    '義', '試', '詩', '話', '誠', '認', '誤', '説', '読', '課', '調', '談',
    '論', '質', '賃', '資', '賞', '践', '輪', '選', '遺', '鉄', '銀', '銅',
    '際', '障', '雑', '電', '需', '静', '頑', '題', '願', '養', '駅', '駐',
    '確', '管', '算', '精', '練', '語', '誌', '誕', '劇', '標', '模', '権',
    '横', '機', '歴', '築', '禁', '種', '積', '穀', '窮', '端', '複', '適',
    '際', '関', '閣', '頭', '額', '館', '駆', '験', '騎', '観', '議', '護',
    '鑑', '響', '驚', '警', '競', '験',
    // 追加頻出常用漢字
    '会', '社', '事', '業', '年', '者', '方', '行', '出', '分', '時', '上',
    '前', '後', '間', '日', '月', '目', '手', '回', '自', '中', '見', '生',
    '国', '度', '長', '場', '合', '新', '気', '小', '高', '地', '名', '大',
    '子', '動', '力', '同', '化', '学', '定', '実', '経', '体', '部', '問',
    '理', '的', '用', '制', '性', '政', '点', '意', '家', '世', '正', '対',
    '発', '通', '関', '立', '相', '全', '表', '当', '代', '明', '記', '内',
    '数', '水', '以', '法', '主', '公', '第', '民', '現', '品', '取', '金',
    '作', '市', '特', '機', '本', '結', '心', '開', '原', '計', '利', '決',
    '話', '持', '電', '集', '道', '員', '感', '言', '考', '受', '入', '先',
    '連', '戦', '物', '議', '等', '変', '面', '調', '重', '教', '今', '女',
    '明', '知', '活', '情', '報', '思', '望', '白', '書', '少', '初', '産',
    '位', '加', '味', '指', '進', '選', '最', '近', '形', '論', '強', '信',
]);

// ─────────────────────────────────────────
// 表記揺れパターン辞書
// [正規表現パターン, 統一推奨表記, 説明]
// ─────────────────────────────────────────
export const HYOKI_YURE_PATTERNS = [
    // 送り仮名の揺れ
    { variants: ['行う', '行なう'], recommended: '行う', category: '送り仮名' },
    { variants: ['取り扱い', '取扱い', '取扱'], recommended: '取り扱い', category: '送り仮名' },
    { variants: ['受け付け', '受付け', '受付'], recommended: '受け付け', category: '送り仮名' },
    { variants: ['申し込み', '申込み', '申込'], recommended: '申し込み', category: '送り仮名' },
    { variants: ['引き受け', '引受け', '引受'], recommended: '引き受け', category: '送り仮名' },
    { variants: ['立ち上げ', '立上げ', '立ち上げる'], recommended: '立ち上げ', category: '送り仮名' },
    { variants: ['繰り返し', '繰返し'], recommended: '繰り返し', category: '送り仮名' },
    { variants: ['見積もり', '見積り', '見積'], recommended: '見積もり', category: '送り仮名' },
    { variants: ['打ち合わせ', '打合せ', '打ち合せ'], recommended: '打ち合わせ', category: '送り仮名' },
    { variants: ['組み合わせ', '組合せ', '組合わせ'], recommended: '組み合わせ', category: '送り仮名' },

    // 漢字・ひらがなの揺れ
    { variants: ['下さい', 'ください'], recommended: 'ください', category: '漢字/かな' },
    { variants: ['致します', 'いたします'], recommended: 'いたします', category: '漢字/かな' },
    { variants: ['頂く', 'いただく'], recommended: 'いただく', category: '漢字/かな' },
    { variants: ['出来る', 'できる'], recommended: 'できる', category: '漢字/かな' },
    { variants: ['事', 'こと'], recommended: 'こと', category: '漢字/かな' },
    { variants: ['物', 'もの'], recommended: 'もの', category: '漢字/かな' },
    { variants: ['時', 'とき'], recommended: 'とき', category: '漢字/かな' },
    { variants: ['所', 'ところ'], recommended: 'ところ', category: '漢字/かな' },
    { variants: ['為', 'ため'], recommended: 'ため', category: '漢字/かな' },
    { variants: ['是非', 'ぜひ'], recommended: 'ぜひ', category: '漢字/かな' },
    { variants: ['有難う', 'ありがとう'], recommended: 'ありがとう', category: '漢字/かな' },
    { variants: ['宜しく', 'よろしく'], recommended: 'よろしく', category: '漢字/かな' },
    { variants: ['但し', 'ただし'], recommended: 'ただし', category: '漢字/かな' },
    { variants: ['尚', 'なお'], recommended: 'なお', category: '漢字/かな' },
    { variants: ['又は', 'または'], recommended: 'または', category: '漢字/かな' },
    { variants: ['及び', 'および'], recommended: 'および', category: '漢字/かな' },
    { variants: ['若しくは', 'もしくは'], recommended: 'もしくは', category: '漢字/かな' },
    { variants: ['従って', 'したがって'], recommended: 'したがって', category: '漢字/かな' },
    { variants: ['予め', 'あらかじめ'], recommended: 'あらかじめ', category: '漢字/かな' },
    { variants: ['概ね', 'おおむね'], recommended: 'おおむね', category: '漢字/かな' },

    // 外来語表記の揺れ
    { variants: ['サーバー', 'サーバ'], recommended: 'サーバー', category: '外来語' },
    { variants: ['コンピューター', 'コンピュータ'], recommended: 'コンピューター', category: '外来語' },
    { variants: ['ユーザー', 'ユーザ'], recommended: 'ユーザー', category: '外来語' },
    { variants: ['データー', 'データ'], recommended: 'データ', category: '外来語' },
    { variants: ['プリンター', 'プリンタ'], recommended: 'プリンター', category: '外来語' },
    { variants: ['メモリー', 'メモリ'], recommended: 'メモリー', category: '外来語' },
    { variants: ['ドライバー', 'ドライバ'], recommended: 'ドライバー', category: '外来語' },
    { variants: ['マネージャー', 'マネジャー', 'マネージャ'], recommended: 'マネージャー', category: '外来語' },
    { variants: ['インターフェース', 'インタフェース', 'インターフェイス'], recommended: 'インターフェース', category: '外来語' },
    { variants: ['ウェブ', 'ウエブ', 'Web'], recommended: 'Web', category: '外来語' },
    { variants: ['ウィンドウ', 'ウインドウ'], recommended: 'ウィンドウ', category: '外来語' },
    { variants: ['フォルダー', 'フォルダ'], recommended: 'フォルダー', category: '外来語' },
    { variants: ['ボランティア', 'ボランテイア'], recommended: 'ボランティア', category: '外来語' },

    // 数字・記号の揺れ
    { variants: ['％', '%'], recommended: '％', category: '記号' },
    { variants: ['＆', '&'], recommended: '＆', category: '記号' },

    // 漢字の異体字・旧字
    { variants: ['斉', '齊', '斎'], recommended: '斉', category: '字体' },
    { variants: ['桧', '檜'], recommended: '桧', category: '字体' },
    { variants: ['鯖', '鯵'], recommended: null, category: '字体' },
];

// ─────────────────────────────────────────
// 不適切表現・差別用語辞書
// 報道・出版業界で使用回避が推奨される表現
// ─────────────────────────────────────────
export const SENSITIVE_TERMS = [
    // 身体関連
    { term: '片手落ち', suggestion: '不十分、不公平', category: '身体', severity: 'high' },
    { term: '盲点', suggestion: '見落とし、死角', category: '身体', severity: 'medium' },
    { term: '盲目的', suggestion: '無批判に、やみくもに', category: '身体', severity: 'medium' },
    { term: 'つんぼ', suggestion: '聴覚障害', category: '身体', severity: 'high' },
    { term: 'めくら', suggestion: '視覚障害', category: '身体', severity: 'high' },
    { term: 'びっこ', suggestion: '足が不自由', category: '身体', severity: 'high' },
    { term: 'おし', suggestion: '言語障害', category: '身体', severity: 'high' },
    { term: '気違い', suggestion: '精神障害', category: '身体', severity: 'high' },
    { term: '狂人', suggestion: '精神障害者', category: '身体', severity: 'high' },
    { term: '白痴', suggestion: '知的障害', category: '身体', severity: 'high' },

    // 職業関連
    { term: '百姓', suggestion: '農家、農業従事者', category: '職業', severity: 'medium' },
    { term: '土方', suggestion: '建設作業員', category: '職業', severity: 'medium' },
    { term: '小使い', suggestion: '用務員', category: '職業', severity: 'medium' },
    { term: '女中', suggestion: 'お手伝いさん、家事従事者', category: '職業', severity: 'medium' },
    { term: '看護婦', suggestion: '看護師', category: '職業', severity: 'low' },
    { term: '保母', suggestion: '保育士', category: '職業', severity: 'low' },
    { term: 'スチュワーデス', suggestion: '客室乗務員、CA', category: '職業', severity: 'low' },
    { term: '八百屋', suggestion: '青果店', category: '職業', severity: 'low' },
    { term: '床屋', suggestion: '理髪店、理容室', category: '職業', severity: 'low' },
    { term: '産婆', suggestion: '助産師', category: '職業', severity: 'low' },

    // 性別関連
    { term: '女流', suggestion: '（不要な限定を除く）', category: '性別', severity: 'medium' },
    { term: '女史', suggestion: '氏、さん', category: '性別', severity: 'low' },
    { term: '未亡人', suggestion: '故人の配偶者', category: '性別', severity: 'medium' },
    { term: '嫁にもらう', suggestion: '結婚する', category: '性別', severity: 'medium' },
    { term: '主人', suggestion: '夫、パートナー', category: '性別', severity: 'low' },
    { term: '嫁', suggestion: '妻、配偶者', category: '性別', severity: 'low' },

    // 人種・民族・出自関連
    { term: '土人', suggestion: '先住民、現地の人々', category: '人種', severity: 'high' },
    { term: '後進国', suggestion: '開発途上国、発展途上国', category: '地域', severity: 'medium' },
    { term: '未開', suggestion: '独自の文化を持つ', category: '地域', severity: 'medium' },

    // 年齢関連
    { term: '老人', suggestion: '高齢者、シニア', category: '年齢', severity: 'low' },
    { term: 'ボケ老人', suggestion: '認知症の方', category: '年齢', severity: 'high' },
    { term: '徘徊', suggestion: 'ひとり歩き', category: '年齢', severity: 'low' },

    // その他
    { term: '外人', suggestion: '外国人、外国の方', category: 'その他', severity: 'medium' },
    { term: 'ハーフ', suggestion: 'ダブル、ミックス', category: 'その他', severity: 'low' },
    { term: '部落', suggestion: '地区、集落（文脈注意）', category: 'その他', severity: 'medium' },
];

// ─────────────────────────────────────────
// 検出ユーティリティ関数
// ─────────────────────────────────────────

/**
 * テキスト中の常用漢字外の漢字を検出
 * @param {string} text - 検査対象テキスト
 * @returns {{ nonJoyoKanji: Array<{char: string, position: number, context: string}>, count: number }}
 */
export function detectNonJoyoKanji(text) {
    const CJK_RANGE = /[\u4E00-\u9FFF\u3400-\u4DBF]/;
    const results = [];

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (CJK_RANGE.test(char) && !JOYO_KANJI.has(char)) {
            const start = Math.max(0, i - 5);
            const end = Math.min(text.length, i + 6);
            results.push({
                char,
                position: i,
                context: text.substring(start, end),
            });
        }
    }

    return { nonJoyoKanji: results, count: results.length };
}

/**
 * テキスト中の表記揺れを検出
 * @param {string} text - 検査対象テキスト
 * @returns {{ issues: Array<{pattern: Object, found: string[], positions: Object}>, count: number }}
 */
export function detectHyokiYure(text) {
    const issues = [];

    for (const pattern of HYOKI_YURE_PATTERNS) {
        const found = [];
        const positions = {};

        // 長い語から先にマッチして、短い語の誤検出を防ぐ
        const sortedVariants = [...pattern.variants].sort((a, b) => b.length - a.length);
        const matchedRanges = []; // [{start, end}] 既にマッチした範囲

        for (const variant of sortedVariants) {
            let idx = text.indexOf(variant);
            while (idx !== -1) {
                // 既にマッチ済み範囲に含まれるかチェック
                const overlaps = matchedRanges.some(
                    r => idx >= r.start && idx < r.end
                );
                if (!overlaps) {
                    if (!found.includes(variant)) found.push(variant);
                    if (!positions[variant]) positions[variant] = [];
                    positions[variant].push(idx);
                    matchedRanges.push({ start: idx, end: idx + variant.length });
                }
                idx = text.indexOf(variant, idx + 1);
            }
        }

        // 表記揺れ＝2種類以上の表記が混在
        if (found.length >= 2) {
            issues.push({
                variants: found,
                recommended: pattern.recommended,
                category: pattern.category,
                positions,
            });
        }
    }

    return { issues, count: issues.length };
}

/**
 * テキスト中の不適切表現を検出
 * @param {string} text - 検査対象テキスト
 * @param {Object} options - オプション
 * @param {string} [options.minSeverity='low'] - 最低検出レベル ('low'|'medium'|'high')
 * @returns {{ issues: Array<{term: string, suggestion: string, category: string, severity: string, positions: number[]}>, count: number }}
 */
export function detectSensitiveTerms(text, options = {}) {
    const { minSeverity = 'low' } = options;
    const severityOrder = { low: 0, medium: 1, high: 2 };
    const minLevel = severityOrder[minSeverity] || 0;
    const issues = [];

    for (const entry of SENSITIVE_TERMS) {
        if (severityOrder[entry.severity] < minLevel) continue;

        const positions = [];
        let idx = text.indexOf(entry.term);
        while (idx !== -1) {
            positions.push(idx);
            idx = text.indexOf(entry.term, idx + 1);
        }

        if (positions.length > 0) {
            issues.push({
                term: entry.term,
                suggestion: entry.suggestion,
                category: entry.category,
                severity: entry.severity,
                positions,
                count: positions.length,
            });
        }
    }

    return { issues, count: issues.length };
}
