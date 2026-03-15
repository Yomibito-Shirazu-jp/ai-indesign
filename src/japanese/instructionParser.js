/**
 * 日本語自然文指示パーサー (CCPM修正版)
 * 
 * ★ 解析のみ。以下は禁止:
 * - parser内でツール呼び出し
 * - parser内でsession更新
 * - parser内でconfirm判定を完結
 * 
 * 役割分離:
 * instructionParser.js → 解析のみ (IR生成)
 * confirmationMode.js  → confidence判定+保留制御
 * InDesignMCPServer.js → 実行ルーティング
 * safetyManager.js     → 危険操作判定
 */
import {
    lookupTerm, parsePageSize, resolveFontCategory, resolveAmbiguousValue,
    resolveDocumentType, DTP_TERMS, ORIENTATIONS,
} from './dtpDictionary.js';
import { IntermediateRepresentationBuilder } from './intermediateRepresentation.js';

/**
 * 指示パターン定義
 * pattern: 正規表現
 * handler: IRビルダーへ操作を追加するだけ（実行しない）
 */
const INSTRUCTION_PATTERNS = [
    // ドキュメント作成: 「A4縦、8ページの会社案内を作って」
    {
        pattern: /(?:(.+?)の)?(?:(縦|横)(?:置き)?[、,]?\s*)?(\d+)\s*ページ(?:の|で)?(.+?)(?:を|で)?(?:作(?:って|成|る)|新規)/,
        handler: (match, builder) => {
            const sizeText = match[1] || 'A4';
            const orientation = match[2];
            const pages = parseInt(match[3]);
            const docType = match[4];
            const pageInfo = parsePageSize(sizeText);
            const typeInfo = resolveDocumentType(docType);

            const args = {
                width: pageInfo?.size?.width || 210,
                height: pageInfo?.size?.height || 297,
                pages,
                facingPages: pages > 2,
            };
            if (orientation) {
                const ori = ORIENTATIONS[orientation];
                if (ori === 'landscape' && args.width < args.height) {
                    [args.width, args.height] = [args.height, args.width];
                }
            }

            builder.addOperation('create_document', args, 0.9, {
                reason: `ドキュメント作成: ${sizeText} ${orientation || ''} ${pages}ページ`,
                scope: { document: true, pages: [], objects: [] },
            });

            if (typeInfo) {
                builder.addOperation('apply_document_template', { templateType: typeInfo.type }, 0.8, {
                    reason: `テンプレート適用: ${typeInfo.source}`,
                    requiresConfirmation: true,
                    scope: { document: true, pages: [], objects: [] },
                });
                builder.setMetadata('documentType', typeInfo.type);
            }
        }
    },
    // 簡易ドキュメント: 「A4チラシを作って」
    {
        pattern: /(A[3-6]|B[4-6])\s*(?:の\s*)?(チラシ|会社案内|冊子|パンフレット|ポスター|POP|名刺|カタログ|メニュー)(?:を|で)?(?:作(?:って|成|る)|新規)/,
        handler: (match, builder) => {
            const sizeText = match[1];
            const docType = match[2];
            const pageInfo = parsePageSize(sizeText);
            const typeInfo = resolveDocumentType(docType);

            builder.addOperation('create_document', {
                width: pageInfo?.size?.width || 210,
                height: pageInfo?.size?.height || 297,
                pages: 1,
            }, 0.95, {
                reason: `簡易ドキュメント作成: ${sizeText} ${docType}`,
                scope: { document: true, pages: [], objects: [] },
            });

            if (typeInfo) {
                builder.addOperation('apply_document_template', { templateType: typeInfo.type }, 0.85, {
                    reason: `テンプレート適用: ${docType}`,
                    scope: { document: true, pages: [], objects: [] },
                });
            }
        }
    },
    // スタイル: 「本文は明朝、見出しはゴシックで」
    {
        pattern: /(本文|見出し|小見出し|キャプション|注記)(?:は|を)\s*(明朝|ゴシック|丸ゴシック|太ゴシック|教科書体)(?:で|に|体)?/g,
        handler: (match, builder) => {
            const elementType = match[1];
            const fontCategory = match[2];
            const fonts = resolveFontCategory(fontCategory);

            builder.addOperation('create_paragraph_style', {
                name: elementType,
                fontFamily: fonts[0] || 'Noto Sans JP',
                _fontCandidates: fonts,
            }, 0.85, {
                reason: `${elementType}に${fontCategory}を設定`,
                scope: { document: true, pages: [], objects: [] },
            });
        }
    },
    // 縦書き: 「このページだけ縦組みにして」「2ページ目だけ縦書きで」
    {
        pattern: /(?:(\d+)\s*ページ(?:目)?(?:だけ|のみ)?|このページ(?:だけ|のみ)?)\s*(?:を|は)?\s*縦(?:組み|書き)(?:に(?:して|する)|で)/,
        handler: (match, builder) => {
            const pageNum = match[1] ? parseInt(match[1]) - 1 : null;
            const pages = pageNum !== null ? [pageNum] : [];

            builder.addOperation('convert_frame_to_vertical', {
                pageIndex: pageNum,
                allFrames: true,
            }, 0.85, {
                reason: `${pageNum !== null ? (pageNum + 1) + 'ページ目' : 'このページ'}を縦組みに変換`,
                scope: { document: false, pages, objects: [] },
            });

            if (pageNum === null) builder.addContextReference('このページ');
        }
    },
    // 余白: 「余白を少し広げて」
    {
        pattern: /余白(?:を)?\s*(少し|もう少し|だいぶ|かなり|広め|狭め)?\s*(広げ|狭め|増やし|減らし|詰め)/,
        handler: (match, builder) => {
            const degree = match[1] || '少し';
            const direction = match[2];
            const value = resolveAmbiguousValue(degree, 'margin') || 5;
            const delta = direction.match(/狭|減|詰/) ? -Math.abs(value) : Math.abs(value);

            builder.addOperation('set_document_preferences', {
                preferenceType: 'MARGINS',
                preferences: { marginDelta: delta },
            }, 0.75, {
                reason: `余白を${degree}${direction}る (${delta > 0 ? '+' : ''}${delta}mm)`,
                scope: { document: true, pages: [], objects: [] },
                warnings: ['あいまい表現の解釈です。数値は推定値です。'],
            });
        }
    },
    // 見出し調整: 「見出しをもう少し強く」
    {
        pattern: /(見出し|本文|キャプション|小見出し)(?:を)?\s*(もう少し|もっと|少し|だいぶ|かなり)?\s*(強く|弱く|大きく|小さく|太く|細く)/,
        handler: (match, builder) => {
            const element = match[1];
            const degree = match[2] || '少し';
            const direction = match[3];
            const adjustments = {};
            if (direction.match(/強|大|太/)) {
                adjustments.fontSizeDelta = 2;
                if (direction === '太く') adjustments.fontWeight = 'Bold';
            } else {
                adjustments.fontSizeDelta = -2;
            }

            builder.addOperation('adjust_style_by_element', {
                elementType: element,
                adjustments,
            }, 0.7, {
                reason: `${element}を${degree}${direction}`,
                scope: { document: true, pages: [], objects: [] },
                warnings: ['あいまい表現の解釈です。'],
            });
        }
    },
    // 可読性: 「この本文、詰まり気味だから読みやすく」
    {
        pattern: /(本文|テキスト|文字)(?:が|を|、)?\s*(?:詰まり気味|詰まっ|狭い|窮屈|読み(?:にくい|づらい|やすく))/,
        handler: (match, builder) => {
            builder.addOperation('adjust_leading_for_japanese', {
                target: 'body',
                adjustment: 'readable',
                leadingDelta: 2,
            }, 0.7, {
                reason: '本文の行送りを広げて可読性向上',
                scope: { document: true, pages: [], objects: [] },
            });
            builder.addOperation('adjust_tracking_for_japanese', {
                target: 'body',
                adjustment: 'readable',
                trackingDelta: 20,
            }, 0.65, {
                reason: '本文の字間を少し広げる',
                scope: { document: true, pages: [], objects: [] },
                requiresConfirmation: true,
            });
        }
    },
    // 流し込み: 「この原稿を流して」
    {
        pattern: /(?:この)?原稿(?:を)?\s*(?:流し(?:込[んむ]|て)|流して|入れて|配置して)/,
        handler: (match, builder) => {
            builder.addOperation('flow_text_to_pages', {
                autoAddPages: true,
                applyStyles: true,
            }, 0.8, {
                reason: '原稿を自動流し込み（ページ自動追加）',
                requiresConfirmation: true,
                scope: { document: true, pages: [], objects: [] },
            });
            builder.addContextReference('原稿テキスト');
        }
    },
    // 入稿チェック: 「入稿チェックして」
    {
        pattern: /入稿(?:前)?(?:の)?チェック(?:して|する|を)/,
        handler: (match, builder) => {
            builder.addOperation('preflight_check', { checkAll: true }, 0.95, {
                reason: '入稿前総合チェック実行',
                previewAvailable: false,
                scope: { document: true, pages: [], objects: [] },
            });
        }
    },
    // PDF: 「入稿用PDFを書き出して」
    {
        pattern: /(入稿用|校正用|確認用|高品質)?\s*PDF(?:を)?\s*(?:書き出し|出力|エクスポート)(?:して|する)?/,
        handler: (match, builder) => {
            const purpose = match[1] || '入稿用';
            const tool = (purpose === '校正用' || purpose === '確認用')
                ? 'export_review_pdf' : 'export_print_pdf';

            builder.addOperation(tool, { purpose }, 0.85, {
                reason: `${purpose}PDF出力`,
                requiresConfirmation: true,
                scope: { document: true, pages: [], objects: [] },
            });
        }
    },
    // 赤字: 「赤字を反映して」
    {
        pattern: /赤字(?:を|の)?(?:指示(?:を)?)?(?:反映|適用|修正)(?:して|する)?/,
        handler: (match, builder) => {
            builder.addOperation('apply_redline_changes', {}, 0.6, {
                reason: '赤字修正を反映（詳細指示が必要）',
                requiresConfirmation: true,
                scope: { document: true, pages: [], objects: [] },
                warnings: ['赤字の具体的な修正内容を指定する必要があります。'],
            });
            builder.addContextReference('赤字指示');
        }
    },
    // 画像解像度: 「画像が荒いところを確認して」
    {
        pattern: /(?:画像|写真|図版)(?:が|の)?\s*(?:荒い|低い|粗い|ぼやけ|解像度)(?:ところ|箇所|部分)?(?:を)?\s*(?:確認|チェック|検出)/,
        handler: (match, builder) => {
            builder.addOperation('check_image_resolution', { minDPI: 300 }, 0.9, {
                reason: '画像解像度チェック (300dpi未満を検出)',
                previewAvailable: false,
                scope: { document: true, pages: [], objects: [] },
            });
        }
    },
];

/**
 * 自然文 → IR変換（解析のみ、実行しない）
 * @param {string} text - 日本語指示文
 * @param {Object} context - sessionManagerから渡される文脈情報
 * @returns {Object} IntermediateRepresentation
 */
export function parseInstruction(text, context = {}) {
    const builder = new IntermediateRepresentationBuilder();
    builder.setSource(text);

    let matched = false;

    for (const pattern of INSTRUCTION_PATTERNS) {
        const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags || '');

        if (pattern.pattern.flags?.includes('g')) {
            let m;
            while ((m = regex.exec(text)) !== null) {
                try { pattern.handler(m, builder); matched = true; }
                catch (e) { builder.addUnresolved(`パターンマッチエラー: ${m[0]}`); }
            }
        } else {
            const m = text.match(regex);
            if (m) {
                try { pattern.handler(m, builder); matched = true; }
                catch (e) { builder.addUnresolved(`パターンマッチエラー: ${m[0]}`); }
            }
        }
    }

    if (!matched) {
        const knownTerms = Object.keys(DTP_TERMS).filter(t => text.includes(t));
        if (knownTerms.length > 0) {
            builder.setMetadata('detectedTerms', knownTerms);
            builder.addUnresolved(`指示を解釈できませんでしたが、以下の用語を検出: ${knownTerms.join(', ')}`);
        } else {
            builder.addUnresolved(`指示を解釈できませんでした: 「${text}」`);
        }
    }

    return builder.build();
}

/**
 * 複数指示の一括パース（句点・改行区切り）
 */
export function parseMultipleInstructions(text, context = {}) {
    const sentences = text.split(/[。\n]+/).map(s => s.trim()).filter(s => s.length > 0);
    const builder = new IntermediateRepresentationBuilder();
    builder.setSource(text);

    for (const sentence of sentences) {
        const subIR = parseInstruction(sentence, context);
        for (const op of subIR.operations) {
            builder.addOperation(op.tool, op.args, op.confidence, {
                reason: op.reason, warnings: op.warnings, scope: op.scope,
                requiresConfirmation: op.requiresConfirmation,
                previewAvailable: op.previewAvailable,
            });
        }
        for (const u of subIR.unresolved) builder.addUnresolved(u);
        for (const ref of subIR.contextReferences) builder.addContextReference(ref);
    }

    return builder.build();
}
