/**
 * Book tool definitions for InDesign MCP Server
 * Book management and multi-document functionality
 */

export const bookToolDefinitions = [
    // =================== BOOK MANAGEMENT ===================
    {
        name: 'create_book',
        description: 'ブックを作成',
        inputSchema: {
            type: 'object',
            properties: {
                filePath: { type: 'string', description: 'Path where to save the book file' }
            },
            required: ['filePath']
        }
    },
    {
        name: 'open_book',
        description: 'ブックを開く',
        inputSchema: {
            type: 'object',
            properties: {
                filePath: { type: 'string', description: 'Path to the book file' }
            },
            required: ['filePath']
        }
    },
    {
        name: 'list_books',
        description: 'ブック一覧を取得',
        inputSchema: { type: 'object', properties: {} }
    },
    {
        name: 'add_document_to_book',
        description: 'ドキュメントをブックに追加',
        inputSchema: {
            type: 'object',
            properties: {
                bookPath: { type: 'string', description: 'Path to the book file' },
                documentPath: { type: 'string', description: 'Path to the document to add' }
            },
            required: ['bookPath', 'documentPath']
        }
    },
    {
        name: 'synchronize_book',
        description: 'ブックを同期',
        inputSchema: {
            type: 'object',
            properties: {
                bookPath: { type: 'string', description: 'Path to the book file' }
            },
            required: ['bookPath']
        }
    },
    {
        name: 'repaginate_book',
        description: 'ブックのページを再割り付け',
        inputSchema: {
            type: 'object',
            properties: {
                bookPath: { type: 'string', description: 'Path to the book file' }
            },
            required: ['bookPath']
        }
    },
    {
        name: 'update_all_cross_references',
        description: '全相互参照を更新',
        inputSchema: {
            type: 'object',
            properties: {
                bookPath: { type: 'string', description: 'Path to the book file' }
            },
            required: ['bookPath']
        }
    },
    {
        name: 'update_all_numbers',
        description: '全番号を更新',
        inputSchema: {
            type: 'object',
            properties: {
                bookPath: { type: 'string', description: 'Path to the book file' }
            },
            required: ['bookPath']
        }
    },
    {
        name: 'update_chapter_and_paragraph_numbers',
        description: '章番号・段落番号を更新',
        inputSchema: {
            type: 'object',
            properties: {
                bookPath: { type: 'string', description: 'Path to the book file' }
            },
            required: ['bookPath']
        }
    },
    {
        name: 'export_book',
        description: 'ブックをエクスポート',
        inputSchema: {
            type: 'object',
            properties: {
                bookPath: { type: 'string', description: 'Path to the book file' },
                format: {
                    type: 'string',
                    enum: ['PDF', 'EPUB', 'HTML'],
                    description: 'Export format',
                    default: 'PDF'
                },
                outputPath: { type: 'string', description: 'Path for the exported file' }
            },
            required: ['bookPath', 'outputPath']
        }
    },
    {
        name: 'package_book',
        description: 'ブックをパッケージ',
        inputSchema: {
            type: 'object',
            properties: {
                bookPath: { type: 'string', description: 'Path to the book file' },
                outputPath: { type: 'string', description: 'Path for the package folder' },
                copyingFonts: { type: 'boolean', description: 'Copy fonts to package', default: true },
                copyingLinkedGraphics: { type: 'boolean', description: 'Copy linked graphics', default: true },
                copyingProfiles: { type: 'boolean', description: 'Copy color profiles', default: true },
                updatingGraphics: { type: 'boolean', description: 'Update graphics links', default: true },
                includingHiddenLayers: { type: 'boolean', description: 'Include hidden layers', default: false },
                ignorePreflightErrors: { type: 'boolean', description: 'Ignore preflight errors', default: false },
                creatingReport: { type: 'boolean', description: 'Create package report', default: true },
                includeIdml: { type: 'boolean', description: 'Include IDML file', default: false },
                includePdf: { type: 'boolean', description: 'Include PDF file', default: false }
            },
            required: ['bookPath', 'outputPath']
        }
    },
    {
        name: 'preflight_book',
        description: 'ブックのプリフライトチェック',
        inputSchema: {
            type: 'object',
            properties: {
                bookPath: { type: 'string', description: 'Path to the book file' },
                outputPath: { type: 'string', description: 'Path for the preflight report (optional)' },
                autoOpen: { type: 'boolean', description: 'Automatically open the report', default: false }
            },
            required: ['bookPath']
        }
    },
    {
        name: 'print_book',
        description: 'ブックを印刷',
        inputSchema: {
            type: 'object',
            properties: {
                bookPath: { type: 'string', description: 'Path to the book file' },
                printDialog: { type: 'boolean', description: 'Show print dialog', default: true },
                printerPreset: {
                    type: 'string',
                    enum: ['DEFAULT_VALUE', 'CUSTOM'],
                    description: 'Printer preset to use',
                    default: 'DEFAULT_VALUE'
                }
            },
            required: ['bookPath']
        }
    },
    {
        name: 'get_book_info',
        description: 'ブックの情報を取得',
        inputSchema: {
            type: 'object',
            properties: {
                bookPath: { type: 'string', description: 'Path to the book file' }
            },
            required: ['bookPath']
        }
    },
    {
        name: 'set_book_properties',
        description: 'ブックのプロパティを設定',
        inputSchema: {
            type: 'object',
            properties: {
                bookPath: { type: 'string', description: 'Path to the book file' },
                automaticPagination: { type: 'boolean', description: 'Enable automatic pagination' },
                automaticDocumentConversion: { type: 'boolean', description: 'Enable automatic document conversion' },
                insertBlankPage: { type: 'boolean', description: 'Insert blank pages as necessary' },
                mergeIdenticalLayers: { type: 'boolean', description: 'Merge identical layers when exporting to PDF' },
                synchronizeBulletNumberingList: { type: 'boolean', description: 'Synchronize bullets and numbering' },
                synchronizeCellStyle: { type: 'boolean', description: 'Synchronize cell styles' },
                synchronizeCharacterStyle: { type: 'boolean', description: 'Synchronize character styles' },
                synchronizeConditionalText: { type: 'boolean', description: 'Synchronize conditional text' },
                synchronizeCrossReferenceFormat: { type: 'boolean', description: 'Synchronize cross reference formats' },
                synchronizeMasterPage: { type: 'boolean', description: 'Synchronize master pages' },
                synchronizeObjectStyle: { type: 'boolean', description: 'Synchronize object styles' },
                synchronizeParagraphStyle: { type: 'boolean', description: 'Synchronize paragraph styles' },
                synchronizeSwatch: { type: 'boolean', description: 'Synchronize swatches' },
                synchronizeTableOfContentStyle: { type: 'boolean', description: 'Synchronize table of content styles' },
                synchronizeTableStyle: { type: 'boolean', description: 'Synchronize table styles' },
                synchronizeTextVariable: { type: 'boolean', description: 'Synchronize text variables' },
                synchronizeTrapStyle: { type: 'boolean', description: 'Synchronize trap styles' }
            },
            required: ['bookPath']
        }
    }
]; 