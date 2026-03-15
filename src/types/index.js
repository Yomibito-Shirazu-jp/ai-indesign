/**
 * Tool definitions index for InDesign MCP Server
 * Central import and export of all tool definitions
 * Includes: original 135+ tools + Japanese DTP tools (37+)
 */

import { pageToolDefinitions } from './toolDefinitionsPage.js';
import { contentToolDefinitions } from './toolDefinitionsContent.js';
import { documentToolDefinitions } from './toolDefinitionsDocument.js';
import { exportToolDefinitions } from './toolDefinitionsExport.js';
import { bookToolDefinitions } from './toolDefinitionsBook.js';
import { utilityToolDefinitions } from './toolDefinitionsUtility.js';
import { pageItemGroupToolDefinitions } from './toolDefinitionsPageItemGroup.js';
import { masterSpreadToolDefinitions } from './toolDefinitionsMasterSpread.js';
import { spreadToolDefinitions } from './toolDefinitionsSpread.js';
import { layerToolDefinitions } from './toolDefinitionsLayer.js';

// 日本語DTP拡張ツール定義
import { japaneseTypesettingTools } from './toolDefinitionsJapanese.js';
import { verticalTextTools } from './toolDefinitionsVertical.js';
import { preflightTools } from './toolDefinitionsPreflight.js';
import { textFlowTools } from './toolDefinitionsTextFlow.js';
import { proofreadingTools } from './toolDefinitionsProofreading.js';
import { revisionTools, interpretationTools } from './toolDefinitionsRevision.js';

// Combine all tool definitions into a single array
export const allToolDefinitions = [
    ...pageToolDefinitions,
    ...contentToolDefinitions,
    ...documentToolDefinitions,
    ...exportToolDefinitions,
    ...bookToolDefinitions,
    ...utilityToolDefinitions,
    ...pageItemGroupToolDefinitions,
    ...masterSpreadToolDefinitions,
    ...spreadToolDefinitions,
    ...layerToolDefinitions,
    // 日本語DTP拡張
    ...japaneseTypesettingTools,
    ...verticalTextTools,
    ...preflightTools,
    ...textFlowTools,
    ...revisionTools,
    ...interpretationTools,
    ...proofreadingTools,
];

// Export individual modules for specific use cases
export { pageToolDefinitions } from './toolDefinitionsPage.js';
export { contentToolDefinitions } from './toolDefinitionsContent.js';
export { documentToolDefinitions } from './toolDefinitionsDocument.js';
export { exportToolDefinitions } from './toolDefinitionsExport.js';
export { bookToolDefinitions } from './toolDefinitionsBook.js';
export { utilityToolDefinitions } from './toolDefinitionsUtility.js';
export { pageItemGroupToolDefinitions } from './toolDefinitionsPageItemGroup.js';
export { masterSpreadToolDefinitions } from './toolDefinitionsMasterSpread.js';
export { spreadToolDefinitions } from './toolDefinitionsSpread.js';
export { layerToolDefinitions } from './toolDefinitionsLayer.js';

// 日本語DTP拡張
export { japaneseTypesettingTools } from './toolDefinitionsJapanese.js';
export { verticalTextTools } from './toolDefinitionsVertical.js';
export { preflightTools } from './toolDefinitionsPreflight.js';
export { textFlowTools } from './toolDefinitionsTextFlow.js';
export { revisionTools, interpretationTools } from './toolDefinitionsRevision.js';
export { proofreadingTools } from './toolDefinitionsProofreading.js'; 