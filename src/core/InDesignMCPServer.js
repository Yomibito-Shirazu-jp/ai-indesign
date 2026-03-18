/**
 * Main InDesign MCP Server class
 * 日本語DTP拡張対応版 (170+ tools)
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { allToolDefinitions } from '../types/index.js';
import {
    BookHandlers,
    DocumentHandlers,
    ExportHandlers,
    GraphicsHandlers,
    GroupHandlers,
    HelpHandlers,
    MasterSpreadHandlers,
    PageHandlers,
    PageItemHandlers,
    StyleHandlers,
    TextHandlers,
    UtilityHandlers,
    // 日本語DTP拡張ハンドラー
    JapaneseTypesettingHandlers,
    VerticalTextHandlers,
    PreflightHandlers,
    TextFlowHandlers,
    RevisionHandlers,
    ProofreadingHandlers,
    RuleHandlers,
} from '../handlers/index.js';
import { SystemHandlers } from '../handlers/systemHandlers.js';
import { formatResponse, formatErrorResponse } from '../utils/stringUtils.js';
import { operationLogger } from './operationLogger.js';
import { safetyManager } from './safetyManager.js';
import { parseInstruction, parseMultipleInstructions } from '../japanese/instructionParser.js';
import { ConfirmationMode } from '../japanese/confirmationMode.js';

export class InDesignMCPServer {
    constructor() {
        this.server = new Server(
            {
                name: 'indesign-server-complete',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupToolHandlers();
    }

    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: allToolDefinitions,
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                const result = await this.handleToolCall(name, args);
                return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
            }
        });
    }

    async handleToolCall(name, args) {
        // Document Management
        switch (name) {
            case 'get_document_info': return await DocumentHandlers.getDocumentInfo();
            case 'create_document': return await DocumentHandlers.createDocument(args);
            case 'open_document': return await DocumentHandlers.openDocument(args);
            case 'save_document': return await DocumentHandlers.saveDocument(args);
            case 'close_document': return await DocumentHandlers.closeDocument();

            // Document Advanced Tools
            case 'preflight_document': return await DocumentHandlers.preflightDocument(args);
            case 'zoom_to_page': return await DocumentHandlers.zoomToPage(args);
            case 'data_merge': return await DocumentHandlers.dataMerge(args);

            // Document Elements & Styles
            case 'get_document_elements': return await DocumentHandlers.getDocumentElements(args);
            case 'get_document_styles': return await DocumentHandlers.getDocumentStyles(args);
            case 'get_document_colors': return await DocumentHandlers.getDocumentColors(args);

            // Document Preferences
            case 'get_document_preferences': return await DocumentHandlers.getDocumentPreferences(args);
            case 'set_document_preferences': return await DocumentHandlers.setDocumentPreferences(args);

            // Document Stories & Text
            case 'get_document_stories': return await DocumentHandlers.getDocumentStories(args);
            case 'find_text_in_document': return await DocumentHandlers.findTextInDocument(args);

            // Document Layers & Organization
            case 'get_document_layers': return await DocumentHandlers.getDocumentLayers(args);
            case 'organize_document_layers': return await DocumentHandlers.organizeDocumentLayers(args);

            // Document Hyperlinks & Interactivity
            case 'get_document_hyperlinks': return await DocumentHandlers.getDocumentHyperlinks(args);
            case 'create_document_hyperlink': return await DocumentHandlers.createDocumentHyperlink(args);

            // Document Sections & Numbering
            case 'get_document_sections': return await DocumentHandlers.getDocumentSections();
            case 'create_document_section': return await DocumentHandlers.createDocumentSection(args);

            // Document XML & Structure
            case 'get_document_xml_structure': return await DocumentHandlers.getDocumentXmlStructure(args);
            case 'export_document_xml': return await DocumentHandlers.exportDocumentXml(args);

            // Document Cloud & Collaboration
            case 'save_document_to_cloud': return await DocumentHandlers.saveDocumentToCloud(args);
            case 'open_cloud_document': return await DocumentHandlers.openCloudDocument(args);

            // Document Grid & Layout
            case 'get_document_grid_settings': return await DocumentHandlers.getDocumentGridSettings();
            case 'set_document_grid_settings': return await DocumentHandlers.setDocumentGridSettings(args);
            case 'get_document_layout_preferences': return await DocumentHandlers.getDocumentLayoutPreferences();
            case 'set_document_layout_preferences': return await DocumentHandlers.setDocumentLayoutPreferences(args);

            // Document Validation & Cleanup
            case 'validate_document': return await DocumentHandlers.validateDocument(args);
            case 'cleanup_document': return await DocumentHandlers.cleanupDocument(args);

            // Page Management
            case 'add_page': return await PageHandlers.addPage(args);
            case 'get_page_info': return await PageHandlers.getPageInfo(args);
            case 'navigate_to_page': return await PageHandlers.navigateToPage(args);

            // Advanced Page Management
            case 'duplicate_page': return await PageHandlers.duplicatePage(args);
            case 'move_page': return await PageHandlers.movePage(args);
            case 'delete_page': return await PageHandlers.deletePage(args);
            case 'set_page_properties': return await PageHandlers.setPageProperties(args);
            case 'set_page_background': return await PageHandlers.setPageBackground(args);
            case 'adjust_page_layout': return await PageHandlers.adjustPageLayout(args);
            case 'resize_page': return await PageHandlers.resizePage(args);
            case 'create_page_guides': return await PageHandlers.createPageGuides(args);
            case 'place_file_on_page': return await PageHandlers.placeFileOnPage(args);
            case 'place_xml_on_page': return await PageHandlers.placeXmlOnPage(args);
            case 'snapshot_page_layout': return await PageHandlers.snapshotPageLayout(args);
            case 'delete_page_layout_snapshot': return await PageHandlers.deletePageLayoutSnapshot(args);
            case 'delete_all_page_layout_snapshots': return await PageHandlers.deleteAllPageLayoutSnapshots(args);
            case 'reframe_page': return await PageHandlers.reframePage(args);
            case 'select_page': return await PageHandlers.selectPage(args);
            case 'get_page_content_summary': return await PageHandlers.getPageContentSummary(args);

            // Text Management
            case 'create_text_frame': return await TextHandlers.createTextFrame(args);
            case 'edit_text_frame': return await TextHandlers.editTextFrame(args);
            case 'create_table': return await TextHandlers.createTable(args);
            case 'populate_table': return await TextHandlers.populateTable(args);
            case 'find_replace_text': return await TextHandlers.findReplaceText(args);

            // Graphics Management
            case 'create_rectangle': return await GraphicsHandlers.createRectangle(args);
            case 'create_ellipse': return await GraphicsHandlers.createEllipse(args);
            case 'create_polygon': return await GraphicsHandlers.createPolygon(args);
            case 'place_image': return await GraphicsHandlers.placeImage(args);
            case 'create_object_style': return await GraphicsHandlers.createObjectStyle(args);
            case 'list_object_styles': return await GraphicsHandlers.listObjectStyles();
            case 'apply_object_style': return await GraphicsHandlers.applyObjectStyle(args);
            case 'get_image_info': return await GraphicsHandlers.getImageInfo(args);

            // Style Management
            case 'create_paragraph_style': return await StyleHandlers.createParagraphStyle(args);
            case 'create_character_style': return await StyleHandlers.createCharacterStyle(args);
            case 'apply_paragraph_style': return await StyleHandlers.applyParagraphStyle(args);
            case 'apply_character_style': return await StyleHandlers.applyCharacterStyle(args);
            case 'apply_color': return await StyleHandlers.applyColor(args);
            case 'create_color_swatch': return await StyleHandlers.createColorSwatch(args);
            case 'list_styles': return await StyleHandlers.listStyles(args);
            case 'list_color_swatches': return await StyleHandlers.listColorSwatches();

            // Export Functions
            case 'export_pdf': return await ExportHandlers.exportPDF(args);
            case 'export_images': return await ExportHandlers.exportImages(args);
            case 'package_document': return await ExportHandlers.packageDocument(args);

            // Master Spread Management
            case 'create_master_spread': return await MasterSpreadHandlers.createMasterSpread(args);
            case 'list_master_spreads': return await MasterSpreadHandlers.listMasterSpreads(args);
            case 'delete_master_spread': return await MasterSpreadHandlers.deleteMasterSpread(args);
            case 'duplicate_master_spread': return await MasterSpreadHandlers.duplicateMasterSpread(args);
            case 'apply_master_spread': return await MasterSpreadHandlers.applyMasterSpread(args);
            case 'create_master_text_frame': return await MasterSpreadHandlers.createMasterTextFrame(args);
            case 'create_master_rectangle': return await MasterSpreadHandlers.createMasterRectangle(args);
            case 'create_master_guides': return await MasterSpreadHandlers.createMasterGuides(args);
            case 'get_master_spread_info': return await MasterSpreadHandlers.getMasterSpreadInfo(args);

            // Book Management
            case 'create_book': return await BookHandlers.createBook(args);
            case 'open_book': return await BookHandlers.openBook(args);
            case 'list_books': return await BookHandlers.listBooks(args);
            case 'add_document_to_book': return await BookHandlers.addDocumentToBook(args);
            case 'synchronize_book': return await BookHandlers.synchronizeBook(args);
            case 'repaginate_book': return await BookHandlers.repaginateBook(args);
            case 'update_all_cross_references': return await BookHandlers.updateAllCrossReferences(args);
            case 'update_all_numbers': return await BookHandlers.updateAllNumbers(args);
            case 'update_chapter_and_paragraph_numbers': return await BookHandlers.updateChapterAndParagraphNumbers(args);
            case 'export_book': return await BookHandlers.exportBook(args);
            case 'package_book': return await BookHandlers.packageBook(args);
            case 'preflight_book': return await BookHandlers.preflightBook(args);
            case 'print_book': return await BookHandlers.printBook(args);
            case 'get_book_info': return await BookHandlers.getBookInfo(args);
            case 'set_book_properties': return await BookHandlers.setBookProperties(args);

            // PageItem Management
            case 'get_page_item_info': return await PageItemHandlers.getPageItemInfo(args);
            case 'select_page_item': return await PageItemHandlers.selectPageItem(args);
            case 'move_page_item': return await PageItemHandlers.movePageItem(args);
            case 'resize_page_item': return await PageItemHandlers.resizePageItem(args);
            case 'set_page_item_properties': return await PageItemHandlers.setPageItemProperties(args);
            case 'duplicate_page_item': return await PageItemHandlers.duplicatePageItem(args);
            case 'delete_page_item': return await PageItemHandlers.deletePageItem(args);
            case 'list_page_items': return await PageItemHandlers.listPageItems(args);

            // Group Management
            case 'create_group': return await GroupHandlers.createGroup(args);
            case 'create_group_from_items': return await GroupHandlers.createGroupFromItems(args);
            case 'ungroup': return await GroupHandlers.ungroup(args);
            case 'get_group_info': return await GroupHandlers.getGroupInfo(args);
            case 'add_item_to_group': return await GroupHandlers.addItemToGroup(args);
            case 'remove_item_from_group': return await GroupHandlers.removeItemFromGroup(args);
            case 'list_groups': return await GroupHandlers.listGroups(args);
            case 'set_group_properties': return await GroupHandlers.setGroupProperties(args);

            // Utility Functions
            case 'execute_indesign_code': return await UtilityHandlers.executeInDesignCode(args);
            case 'view_document': return await UtilityHandlers.viewDocument();
            case 'get_session_info': return await UtilityHandlers.getSessionInfo();
            case 'clear_session': return await UtilityHandlers.clearSession();

            // Help System
            case 'help': return await HelpHandlers.getHelp(args);

            // ═══════════════════════════════════════════
            // 日本語DTP拡張ツール
            // ═══════════════════════════════════════════

            // 和文組版 (Japanese Typesetting)
            case 'apply_japanese_typesetting_preset': return await JapaneseTypesettingHandlers.applyJapaneseTypesettingPreset(args);
            case 'normalize_japanese_text': return await JapaneseTypesettingHandlers.normalizeJapaneseText(args);
            case 'fix_kinsoku': return await JapaneseTypesettingHandlers.fixKinsoku(args);
            case 'adjust_kumihan': return await JapaneseTypesettingHandlers.adjustKumihan(args);
            case 'adjust_tracking_for_japanese': return await JapaneseTypesettingHandlers.adjustTrackingForJapanese(args);
            case 'adjust_leading_for_japanese': return await JapaneseTypesettingHandlers.adjustLeadingForJapanese(args);
            case 'validate_japanese_layout': return await JapaneseTypesettingHandlers.validateJapaneseLayout(args);
            case 'detect_style_inconsistencies': return await JapaneseTypesettingHandlers.detectStyleInconsistencies(args);

            // 縦書き (Vertical Text)
            case 'create_vertical_text_frame': return await VerticalTextHandlers.createVerticalTextFrame(args);
            case 'convert_frame_to_vertical': return await VerticalTextHandlers.convertFrameToVertical(args);
            case 'validate_vertical_layout': return await VerticalTextHandlers.validateVerticalLayout(args);
            case 'fix_tatechuyoko': return await VerticalTextHandlers.fixTatechuyoko(args);
            case 'fix_vertical_punctuation': return await VerticalTextHandlers.fixVerticalPunctuation(args);
            case 'mix_vertical_and_horizontal_layout': return await VerticalTextHandlers.mixVerticalAndHorizontalLayout(args);

            // 入稿前チェック (Preflight)
            case 'preflight_check': return await PreflightHandlers.preflightCheck(args);
            case 'check_fonts': return await PreflightHandlers.checkFonts(args);
            case 'check_links': return await PreflightHandlers.checkLinks(args);
            case 'check_image_resolution': return await PreflightHandlers.checkImageResolution(args);
            case 'check_bleed': return await PreflightHandlers.checkBleed(args);
            case 'check_overset': return await PreflightHandlers.checkOverset(args);
            case 'check_color_space': return await PreflightHandlers.checkColorSpace(args);
            case 'export_print_pdf': return await PreflightHandlers.exportPrintPDF(args);
            case 'export_review_pdf': return await PreflightHandlers.exportReviewPDF(args);

            // テキスト流し込み (Text Flow)
            case 'import_text': return await TextFlowHandlers.importText(args);
            case 'parse_manuscript_structure': return await TextFlowHandlers.parseManuscriptStructure(args);
            case 'flow_text_to_pages': return await TextFlowHandlers.flowTextToPages(args);
            case 'apply_document_template': return await TextFlowHandlers.applyDocumentTemplate(args);
            case 'resolve_overset_text': return await TextFlowHandlers.resolveOversetText(args);
            case 'list_available_templates': return TextFlowHandlers.listAvailableTemplates();

            // 修正運用 (Revision)
            case 'apply_redline_changes': return await RevisionHandlers.applyRedlineChanges(args);
            case 'replace_text_by_instruction': return await RevisionHandlers.replaceTextByInstruction(args);
            case 'export_change_log': return await RevisionHandlers.exportChangeLog(args);
            case 'compare_versions': return await RevisionHandlers.compareVersions(args);

            // 日本語自然文解釈 (Interpretation & Logging)
            case 'parse_instruction': {
                const ir = parseMultipleInstructions(args.text);
                return formatResponse(ir, '自然文解釈結果');
            }
            case 'confirm_instruction': {
                if (!this._confirmationMode) this._confirmationMode = new ConfirmationMode();
                if (args.approve) {
                    const pending = this._confirmationMode.approve();
                    return formatResponse({ approved: true, operations: pending }, '操作承認');
                } else {
                    this._confirmationMode.reject();
                    return formatResponse({ approved: false, message: '操作を却下しました' }, '操作却下');
                }
            }
            case 'get_operation_log': {
                if (args?.failedOnly) return formatResponse(operationLogger.getFailedLogs(args?.limit), '失敗ログ');
                if (args?.tool) return formatResponse(operationLogger.getLogsByTool(args.tool, args?.limit), 'ツール別ログ');
                return formatResponse(operationLogger.getRecentLogs(args?.limit), '操作ログ');
            }
            case 'export_operation_log':
                return formatResponse({ logs: operationLogger.exportLogs(), summary: operationLogger.getSummary() }, '操作ログ出力');

            // Add more handlers as we create them

            // 校閲 (Proofreading)
            case 'check_joyo_kanji': return await ProofreadingHandlers.checkJoyoKanji(args);
            case 'check_hyoki_yure': return await ProofreadingHandlers.checkHyokiYure(args);
            case 'check_sensitive_terms': return await ProofreadingHandlers.checkSensitiveTerms(args);
            case 'proofread_all': return await ProofreadingHandlers.proofreadAll(args);

            // ルールエンジン (Rule Engine)
            case 'get_customer_rules': return await RuleHandlers.getCustomerRules(args);
            case 'save_customer_rules': return await RuleHandlers.saveCustomerRules(args);
            case 'add_notation_rule': return await RuleHandlers.addNotationRule(args);
            case 'list_customers': return await RuleHandlers.listCustomers();
            case 'learn_rules_from_diff': return await RuleHandlers.learnRulesFromDiff(args);

            // システム管理（ブリッジ・デモ）
            case 'check_bridge_status':   return await SystemHandlers.checkBridgeStatus();
            case 'start_bridge':          return await SystemHandlers.startBridge();
            case 'stop_bridge':           return await SystemHandlers.stopBridge();
            case 'run_demo_broadcast':    return await SystemHandlers.runDemoBroadcast(args);
            case 'auto_setup':            return await SystemHandlers.autoSetup();

            default:
                return formatErrorResponse(`Tool '${name}' not found or not implemented. Use 'help' to see available tools.`, "Tool Call");
        }
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        // Don't log to stdout as it interferes with MCP protocol
        // console.log('InDesign MCP Server started');
    }
} 