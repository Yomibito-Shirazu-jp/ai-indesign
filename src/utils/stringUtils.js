/**
 * Utility functions for string handling and escaping.
 */

/**
 * Escapes backslashes, double quotes, and control characters for JSX/AppleScript.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
export function escapeJsxString(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t');
}

/**
 * Formats a response with a consistent structure.
 * @param {any} result - The result to format.
 * @param {string} [operation="Operation"] - The operation name.
 * @returns {object} Formatted response object.
 */
export function formatResponse(result, operation = "Operation") {
    return {
        success: true,
        operation,
        result,
        timestamp: new Date().toISOString()
    };
}

/**
 * Formats an error response with a consistent structure.
 * @param {any} error - The error to format.
 * @param {string} [operation="Operation"] - The operation name.
 * @returns {object} Formatted error response object.
 */
export function formatErrorResponse(error, operation = "Operation") {
    return {
        success: false,
        operation,
        result: error,
        timestamp: new Date().toISOString()
    };
}

/**
 * Removes emoticons (emoji characters) from a string.
 * @param {string} str - The string to process.
 * @returns {string} The string with emoticons removed.
 */
export function removeEmoticons(str) {
    if (typeof str !== 'string') return '';
    // Remove emoji using the Unicode Extended_Pictographic property, together with
    // any trailing variation selectors / skin-tone modifiers and ZWJ-joined
    // sequences. This avoids the old broad range [\u203C-\u3299] which also
    // stripped legitimate Japanese text (CJK punctuation, kana, \u301C, \u3231, \u2103, etc.).
    return str.replace(
        /\p{Extended_Pictographic}[\uFE0F\u{1F3FB}-\u{1F3FF}]*(\u200D\p{Extended_Pictographic}[\uFE0F\u{1F3FB}-\u{1F3FF}]*)*|[\u{1F1E6}-\u{1F1FF}]{2}/gu,
        ''
    );
}

/**
 * Converts a Markdown string to plain text by stripping Markdown syntax.
 * This is a simple implementation and does not cover all edge cases.
 * @param {string} markdown - The Markdown string to convert.
 * @returns {string} The plain text result.
 */
export function markdownToPlainText(markdown) {
    if (typeof markdown !== 'string') return '';
    let text = markdown;

    // Remove code blocks
    text = text.replace(/```[\s\S]*?```/g, '');

    // Remove inline code
    text = text.replace(/`([^`]+)`/g, '$1');

    // Remove images ![alt](url) — drop alt text entirely
    text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '');

    // Remove links [text](url) — keep the link text, allow empty/parenless URLs
    text = text.replace(/\[([^\]]*)\]\(([^)]*)\)/g, '$1');

    // Remove emphasis (bold, italics, strikethrough)
    text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
    text = text.replace(/(\*|_)(.*?)\1/g, '$2');
    text = text.replace(/~~(.*?)~~/g, '$1');

    // Remove headings
    text = text.replace(/^#{1,6}\s*/gm, '');

    // Remove blockquotes
    text = text.replace(/^\s*>+\s?/gm, '');

    // Remove horizontal rules (---, ___, *** with optional spaces), consistently anchored per line
    text = text.replace(/^[ \t]*(?:(?:-[ \t]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})$/gm, '');

    // Remove unordered list markers
    text = text.replace(/^\s*[-*+]\s+/gm, '');

    // Remove ordered list markers
    text = text.replace(/^\s*\d+\.\s+/gm, '');

    // Remove extra newlines
    text = text.replace(/\n{2,}/g, '\n');

    // Trim leading/trailing whitespace
    return text.trim();
}

/**
 * Finds all occurrences of a word or words in a string.
 * @param {string} text - The text to search in.
 * @param {string|string[]} words - The word or array of words to find.
 * @param {Object} [options] - Optional settings.
 * @param {boolean} [options.caseSensitive=false] - Whether the search is case sensitive.
 * @param {boolean} [options.wholeWord=true] - Whether to match whole words only.
 * @returns {Array<{word: string, index: number}>} Array of objects with found word and its index in the text.
 */
export function findWords(text, words, options = {}) {
    if (typeof text !== 'string' || !words) return [];
    const {
        caseSensitive = false,
        wholeWord = true
    } = options;

    const wordList = Array.isArray(words) ? words : [words];
    const results = [];

    for (const word of wordList) {
        if (!word) continue;
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = wholeWord ? `\\b${escapedWord}\\b` : escapedWord;
        const flags = 'g' + (caseSensitive ? '' : 'i');
        const regex = new RegExp(pattern, flags);

        let match;
        while ((match = regex.exec(text)) !== null) {
            results.push({ word, index: match.index });
            // Prevent infinite loop for zero-width matches
            if (regex.lastIndex === match.index) regex.lastIndex++;
        }
    }
    return results;
}
