# InDesign MCP Server - Modular Architecture

This directory contains the modular implementation of the InDesign MCP Server, organized for better maintainability and scalability. The server now exposes ~179 tools across English DTP operations and a full Japanese DTP (和文組版) extension.

## Directory Structure

```bash
src/
├── core/                       # Core server functionality
│   ├── InDesignMCPServer.js    # Main MCP server class
│   ├── scriptExecutor.js       # ExtendScript execution via the bridge
│   ├── sessionManager.js       # Session / state management
│   ├── operationLogger.js      # Operation logging
│   └── safetyManager.js        # Safety / guard checks
├── handlers/                   # Tool handlers organized by category
│   ├── index.js                # Central handler exports
│   ├── documentHandlers.js     # Document lifecycle & preferences
│   ├── pageHandlers.js         # Page operations & layout
│   ├── textHandlers.js         # Text frames, tables, find/replace
│   ├── graphicsHandlers.js     # Shapes, images, object styles
│   ├── styleHandlers.js        # Paragraph/character styles, colors
│   ├── masterSpreadHandlers.js # Master spread templates
│   ├── pageItemHandlers.js     # Individual page item control
│   ├── groupHandlers.js        # Object grouping
│   ├── bookHandlers.js         # Multi-document book management
│   ├── exportHandlers.js       # PDF, images, packaging
│   ├── utilityHandlers.js      # Code execution, session utilities
│   ├── helpHandlers.js         # Built-in help system
│   ├── systemHandlers.js       # System-level operations
│   ├── japaneseTypesettingHandlers.js # 和文組版 (禁則・約物・字詰め)
│   ├── verticalTextHandlers.js # 縦書き (変換・検証・縦中横)
│   ├── preflightHandlers.js    # 入稿前チェック (フォント・リンク・解像度)
│   ├── textFlowHandlers.js     # 流し込み (原稿解析・テンプレート)
│   ├── revisionHandlers.js     # 修正運用 (赤字・差分比較)
│   ├── proofreadingHandlers.js # 校正 (表記揺れ・常用漢字・要注意語)
│   └── ruleHandlers.js         # 顧客ルールの学習・適用
├── types/                      # Tool definitions and schemas
│   ├── index.js                # Combines all tool definitions
│   ├── toolDefinitionsDocument.js
│   ├── toolDefinitionsPage.js
│   ├── toolDefinitionsContent.js
│   ├── toolDefinitionsExport.js
│   ├── toolDefinitionsBook.js
│   ├── toolDefinitionsUtility.js
│   ├── toolDefinitionsPageItemGroup.js
│   ├── toolDefinitionsMasterSpread.js
│   ├── toolDefinitionsSpread.js
│   ├── toolDefinitionsLayer.js
│   ├── toolDefinitionsJapanese.js
│   ├── toolDefinitionsVertical.js
│   ├── toolDefinitionsPreflight.js
│   ├── toolDefinitionsTextFlow.js
│   ├── toolDefinitionsProofreading.js
│   ├── toolDefinitionsRevision.js
│   └── toolDefinitionsRule.js
├── japanese/                   # Japanese DTP support modules
│   ├── instructionParser.js    # Natural-language instruction parsing
│   ├── intermediateRepresentation.js # Intermediate representation (IR)
│   ├── manuscriptParser.js     # Manuscript structure analysis
│   ├── templatePresets.js      # 組版プリセット (書籍/冊子/チラシ/広報紙/POP)
│   ├── dtpDictionary.js        # DTP terminology dictionary
│   ├── proofreadingDictionary.js # Proofreading dictionary
│   └── confirmationMode.js     # Confirmation-mode helpers
├── normalizer/                 # Text normalization
│   ├── index.js
│   ├── normalizer.js
│   └── semanticMap.js
├── council/                    # 三者合議エンジン (deliberation engine)
│   ├── index.js
│   ├── councilEngine.js
│   └── agents.js
├── rules/                      # Customer rule learning / store
│   ├── index.js
│   ├── ruleLearner.js
│   └── ruleStore.js
├── dashboard/                  # Web dashboard
│   └── index.html
├── utils/                      # Utility functions
│   └── stringUtils.js
├── server-http.js              # HTTP server entry
└── index.js                    # Main entry point
```

## Architecture Overview

### Core Module (`core/`)

- **InDesignMCPServer.js**: Main server class handling MCP protocol communication.
- **scriptExecutor.js**: Executes ExtendScript in InDesign via the WebSocket bridge.
- **sessionManager.js**: Tracks session state (document dimensions, smart positioning, etc.).
- **operationLogger.js**: Records operations for auditing and debugging.
- **safetyManager.js**: Guard checks before potentially destructive operations.

### Handlers Module (`handlers/`)

Each handler class groups related tools. The handler set is exported from `handlers/index.js` and covers both English DTP operations and the Japanese DTP extension:

- **DocumentHandlers / PageHandlers**: Document lifecycle, preferences, grid, page operations.
- **TextHandlers / GraphicsHandlers / StyleHandlers**: Content creation — text, tables, shapes, images, styles, colors.
- **MasterSpreadHandlers / PageItemHandlers / GroupHandlers**: Advanced layout and object organization.
- **BookHandlers / ExportHandlers**: Multi-document books, PDF/image export, packaging.
- **UtilityHandlers / HelpHandlers / SystemHandlers**: Code execution, session utilities, built-in help, system operations.
- **JapaneseTypesettingHandlers / VerticalTextHandlers / PreflightHandlers / TextFlowHandlers / RevisionHandlers / ProofreadingHandlers / RuleHandlers**: Japanese DTP — 和文組版, 縦書き, 入稿前チェック, 流し込み, 修正運用, 校正, 顧客ルール学習.

### Types Module (`types/`)

Tool definitions (JSON schemas) are split by category (document, page, content, export, book, utility, page item/group, master spread, spread, layer) plus the Japanese DTP definitions (Japanese typesetting, vertical text, preflight, text flow, proofreading, revision, rule). `index.js` combines them into the full tool list.

### Japanese DTP Modules (`japanese/`, `normalizer/`, `council/`, `rules/`)

- **japanese/**: Natural-language instruction parsing, intermediate representation, manuscript analysis, typesetting presets, and dictionaries.
- **normalizer/**: Text normalization and semantic mapping.
- **council/**: 三者合議 (three-party deliberation) engine for cross-checking decisions.
- **rules/**: Customer rule learning and persistent rule store.

### Utils Module (`utils/`)

- **stringUtils.js**: String escaping and response formatting utilities.

## Benefits of Modular Structure

1. **Maintainability**: Each module has a single responsibility.
2. **Scalability**: Easy to add new handlers and tool definitions.
3. **Testability**: Individual modules can be tested in isolation.
4. **Code Reuse**: Common utilities are shared across handlers.
5. **Organization**: Clear separation of concerns.

## Adding New Functionality

### 1. Add Tool Definitions

Add the new tool's schema to the appropriate file in `types/` (or create a new `toolDefinitions<Category>.js`) and wire it into `types/index.js`.

### 2. Create Handler

Create a new handler file in `handlers/`:

```javascript
import { ScriptExecutor } from '../core/scriptExecutor.js';
import { formatResponse } from '../utils/stringUtils.js';

export class NewFeatureHandlers {
  static async newTool(args) {
    // Implementation
  }
}
```

Export it from `handlers/index.js`.

### 3. Register Handler

Wire the new tool into the dispatch logic in `core/InDesignMCPServer.js`:

```javascript
import { NewFeatureHandlers } from '../handlers/newFeatureHandlers.js';

// In the tool-call dispatch:
case 'new_tool': return await NewFeatureHandlers.newTool(args);
```
