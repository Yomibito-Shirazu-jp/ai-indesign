/**
 * 縦書きツール定義
 */
export const verticalTextTools = [
    {
        name: 'create_vertical_text_frame',
        description: '縦組みテキストフレームを作成',
        inputSchema: {
            type: 'object',
            properties: {
                x: { type: 'number', description: 'X座標 (mm)' },
                y: { type: 'number', description: 'Y座標 (mm)' },
                width: { type: 'number', description: '幅 (mm)' },
                height: { type: 'number', description: '高さ (mm)' },
                content: { type: 'string', description: 'テキスト内容' },
                pageIndex: { type: 'number', default: 0 },
                preview: { type: 'boolean' },
            }
        }
    },
    {
        name: 'convert_frame_to_vertical',
        description: 'テキストフレームを横組み→縦組みに変換',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: { type: 'number', default: 0 },
                frameIndex: { type: 'number', description: '対象フレーム (省略+allFrames=true で全フレーム)' },
                allFrames: { type: 'boolean', description: '全フレーム変換' },
                preview: { type: 'boolean' },
            }
        }
    },
    {
        name: 'validate_vertical_layout',
        description: '縦書き品質検証（数字崩れ、英字崩れ、約物崩れ、オーバーセット検出）',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: { type: 'number', default: 0 },
            }
        }
    },
    {
        name: 'fix_tatechuyoko',
        description: '縦中横設定（縦組み中の数字・英字を横配置）',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: { type: 'number', default: 0 },
                maxDigits: { type: 'number', description: '縦中横対象の最大桁数', default: 2 },
                applyToAlpha: { type: 'boolean', description: '英字にも適用' },
                preview: { type: 'boolean' },
            }
        }
    },
    {
        name: 'fix_vertical_punctuation',
        description: '縦組みの約物回転・括弧・句読点位置補正',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: { type: 'number', default: 0 },
                preview: { type: 'boolean' },
            }
        }
    },
    {
        name: 'mix_vertical_and_horizontal_layout',
        description: '縦横混在レイアウト情報の取得・管理',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: { type: 'number', default: 0 },
            }
        }
    },
];
