/**
 * 原稿構造解析
 * テキストから見出し/本文/箇条書き/注記/キャプションを推定
 */

/**
 * 原稿テキストを構造解析
 * @param {string} text - 原稿テキスト
 * @returns {{ sections: Object[], stats: Object }}
 */
export function parseManuscript(text) {
    const lines = text.split(/\r?\n/);
    const sections = [];
    let currentSection = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (trimmed.length === 0) {
            // 空行は段落区切り
            if (currentSection && currentSection.type === 'body') {
                sections.push(currentSection);
                currentSection = null;
            }
            continue;
        }

        const classified = classifyLine(trimmed, i, lines);
        if (currentSection && currentSection.type === classified.type) {
            currentSection.content += '\n' + trimmed;
            currentSection.lineEnd = i;
        } else {
            if (currentSection) sections.push(currentSection);
            currentSection = {
                type: classified.type,
                content: trimmed,
                lineStart: i,
                lineEnd: i,
                confidence: classified.confidence,
                suggestedStyle: classified.suggestedStyle,
            };
        }
    }
    if (currentSection) sections.push(currentSection);

    const stats = {
        totalLines: lines.length,
        sectionCount: sections.length,
        headings: sections.filter(s => s.type === 'heading').length,
        subheadings: sections.filter(s => s.type === 'subheading').length,
        body: sections.filter(s => s.type === 'body').length,
        lists: sections.filter(s => s.type === 'list').length,
        captions: sections.filter(s => s.type === 'caption').length,
        footnotes: sections.filter(s => s.type === 'footnote').length,
        estimatedCharCount: text.replace(/\s/g, '').length,
    };

    return { sections, stats };
}

/**
 * 行を分類
 */
function classifyLine(line, index, allLines) {
    // 見出し判定（短い行で行末に句読点がない）
    if (line.length <= 30 && !line.match(/[。、.，]$/) && !line.match(/^[・●■□▪▶►▸→\-\*\d]/)) {
        if (index === 0 || (index > 0 && allLines[index - 1].trim() === '')) {
            if (line.length <= 15) {
                return { type: 'heading', confidence: 0.8, suggestedStyle: '見出し' };
            }
            return { type: 'subheading', confidence: 0.7, suggestedStyle: '小見出し' };
        }
    }

    // 箇条書き判定
    if (line.match(/^[・●■□▪▶►▸→]\s*/)) {
        return { type: 'list', confidence: 0.9, suggestedStyle: '箇条書き' };
    }
    if (line.match(/^\d+[.）)]\s*/)) {
        return { type: 'list', confidence: 0.85, suggestedStyle: '番号リスト' };
    }
    if (line.match(/^[\-\*]\s+/)) {
        return { type: 'list', confidence: 0.85, suggestedStyle: '箇条書き' };
    }

    // 注記判定
    if (line.match(/^[\*※注]/)) {
        return { type: 'footnote', confidence: 0.85, suggestedStyle: '注記' };
    }

    // キャプション判定（「図」「写真」「表」で始まる短文）
    if (line.match(/^(図|写真|表|Photo|Fig|Table)\s*\d/i) && line.length < 80) {
        return { type: 'caption', confidence: 0.85, suggestedStyle: 'キャプション' };
    }

    // デフォルトは本文
    return { type: 'body', confidence: 0.9, suggestedStyle: '本文' };
}
