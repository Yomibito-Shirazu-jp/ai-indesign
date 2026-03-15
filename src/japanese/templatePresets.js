/**
 * テンプレートプリセット (CCPM: JSON外出し、ローダーのみ)
 * テンプレート定義は templates/*.json に置く
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates');

// フォールバック：インラインテンプレート定義
const INLINE_TEMPLATES = {
    a4_flyer: { name: 'A4チラシ', size: { width: 210, height: 297 }, orientation: 'portrait', margins: { top: 10, bottom: 10, left: 10, right: 10 }, bleed: 3, columns: 1, styles: { heading: { font: 'Noto Sans JP', size: 24, weight: 'Bold' }, body: { font: 'Noto Sans JP', size: 10, leading: 17 }, caption: { font: 'Noto Sans JP', size: 8, leading: 12 } }, pageNumbers: false, runningHeaders: false, pdfPreset: 'High Quality Print' },
    a4_company_profile: { name: 'A4会社案内', size: { width: 210, height: 297 }, orientation: 'portrait', margins: { top: 15, bottom: 15, left: 20, right: 15 }, bleed: 3, columns: 1, facingPages: true, styles: { heading: { font: 'Noto Sans JP', size: 20, weight: 'Bold' }, subheading: { font: 'Noto Sans JP', size: 14, weight: 'Medium' }, body: { font: 'Noto Serif JP', size: 10, leading: 18 }, caption: { font: 'Noto Sans JP', size: 8, leading: 12 } }, pageNumbers: { position: 'bottom-center' }, runningHeaders: { position: 'top-outside' }, pdfPreset: 'PDF/X-4' },
    b5_booklet: { name: 'B5冊子', size: { width: 182, height: 257 }, orientation: 'portrait', margins: { top: 18, bottom: 20, left: 22, right: 18 }, bleed: 3, columns: 1, facingPages: true, styles: { heading: { font: 'Noto Serif JP', size: 18, weight: 'Bold' }, body: { font: 'Noto Serif JP', size: 9, leading: 16 }, caption: { font: 'Noto Sans JP', size: 7.5, leading: 11 } }, pageNumbers: { position: 'bottom-outside' }, runningHeaders: { position: 'top-center' }, pdfPreset: 'PDF/X-4' },
    a5_pamphlet: { name: 'A5パンフレット', size: { width: 148, height: 210 }, orientation: 'portrait', margins: { top: 12, bottom: 12, left: 15, right: 12 }, bleed: 3, columns: 1, styles: { heading: { font: 'Noto Sans JP', size: 16, weight: 'Bold' }, body: { font: 'Noto Sans JP', size: 9, leading: 15 }, caption: { font: 'Noto Sans JP', size: 7.5, leading: 11 } }, pageNumbers: { position: 'bottom-center' }, pdfPreset: 'High Quality Print' },
    book_vertical: { name: '書籍縦組み本文', size: { width: 127, height: 188 }, orientation: 'portrait', margins: { top: 18, bottom: 20, left: 15, right: 20 }, bleed: 3, columns: 1, facingPages: true, writingMode: 'vertical', styles: { heading: { font: 'Noto Serif JP', size: 16, weight: 'Bold' }, body: { font: 'Noto Serif JP', size: 8.5, leading: 15 }, caption: { font: 'Noto Sans JP', size: 7, leading: 10 } }, pageNumbers: { position: 'bottom-outside' }, runningHeaders: { position: 'top-outside' }, typesetting: { kinsoku: 'Hard', leadingRatio: 1.7, hangingPunctuation: true }, pdfPreset: 'PDF/X-4' },
    book_horizontal: { name: '書籍横組み本文', size: { width: 148, height: 210 }, orientation: 'portrait', margins: { top: 20, bottom: 22, left: 18, right: 18 }, bleed: 3, columns: 1, facingPages: true, writingMode: 'horizontal', styles: { heading: { font: 'Noto Sans JP', size: 16, weight: 'Bold' }, body: { font: 'Noto Serif JP', size: 9, leading: 16 }, caption: { font: 'Noto Sans JP', size: 7.5, leading: 11 } }, pageNumbers: { position: 'bottom-center' }, runningHeaders: { position: 'top-outside' }, pdfPreset: 'PDF/X-4' },
    newsletter: { name: '自治体広報紙', size: { width: 257, height: 364 }, orientation: 'portrait', margins: { top: 15, bottom: 15, left: 15, right: 15 }, bleed: 3, columns: 3, columnGutter: 5, styles: { heading: { font: 'Noto Sans JP', size: 22, weight: 'Bold' }, subheading: { font: 'Noto Sans JP', size: 14, weight: 'Medium' }, body: { font: 'Noto Sans JP', size: 9, leading: 16 }, caption: { font: 'Noto Sans JP', size: 7.5, leading: 11 } }, pageNumbers: { position: 'bottom-center' }, pdfPreset: 'High Quality Print' },
    event_poster: { name: 'イベント告知ポスター', size: { width: 297, height: 420 }, orientation: 'portrait', margins: { top: 15, bottom: 15, left: 15, right: 15 }, bleed: 3, columns: 1, styles: { heading: { font: 'Noto Sans JP', size: 48, weight: 'Black' }, subheading: { font: 'Noto Sans JP', size: 24, weight: 'Bold' }, body: { font: 'Noto Sans JP', size: 14, leading: 22 } }, pageNumbers: false, pdfPreset: 'High Quality Print' },
    shop_pop: { name: '店頭POP', size: { width: 210, height: 297 }, orientation: 'landscape', margins: { top: 10, bottom: 10, left: 10, right: 10 }, bleed: 0, columns: 1, styles: { heading: { font: 'Noto Sans JP', size: 36, weight: 'Black' }, body: { font: 'Noto Sans JP', size: 18, leading: 28 } }, pageNumbers: false, pdfPreset: 'High Quality Print' },
    vertical_poster: { name: '和風縦書きポスター', size: { width: 297, height: 420 }, orientation: 'portrait', margins: { top: 20, bottom: 20, left: 25, right: 25 }, bleed: 3, columns: 1, writingMode: 'vertical', styles: { heading: { font: 'Noto Serif JP', size: 42, weight: 'Bold' }, body: { font: 'Noto Serif JP', size: 16, leading: 28 } }, pageNumbers: false, typesetting: { kinsoku: 'Hard', hangingPunctuation: true }, pdfPreset: 'High Quality Print' },
};

/**
 * テンプレート読み込み（JSONファイル優先、フォールバックでインライン）
 * @param {string} templateId
 * @returns {Object|null}
 */
export function loadTemplate(templateId) {
    // JSONファイルから読む試み
    try {
        const jsonPath = path.join(TEMPLATES_DIR, `${templateId}.json`);
        if (fs.existsSync(jsonPath)) {
            const content = fs.readFileSync(jsonPath, 'utf-8');
            return JSON.parse(content);
        }
    } catch { /* fall through to inline */ }

    // インラインフォールバック
    return INLINE_TEMPLATES[templateId] || null;
}

/**
 * 利用可能テンプレート一覧
 */
export function listTemplates() {
    const templates = [];

    // JSONファイル
    try {
        if (fs.existsSync(TEMPLATES_DIR)) {
            const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.json'));
            for (const file of files) {
                try {
                    const content = JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf-8'));
                    templates.push({ id: file.replace('.json', ''), name: content.name, source: 'file' });
                } catch { /* skip */ }
            }
        }
    } catch { /* no templates dir */ }

    // インライン（まだリストにない分）
    for (const [id, tpl] of Object.entries(INLINE_TEMPLATES)) {
        if (!templates.find(t => t.id === id)) {
            templates.push({ id, name: tpl.name, source: 'builtin' });
        }
    }

    return templates;
}

/**
 * テンプレート名（日本語）からID解決
 */
export function resolveTemplateByName(name) {
    for (const [id, tpl] of Object.entries(INLINE_TEMPLATES)) {
        if (tpl.name === name || tpl.name.includes(name) || name.includes(tpl.name)) {
            return id;
        }
    }
    return null;
}
