import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { allToolDefinitions } from './src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let markdown = `# 全ツール（機能）一覧表\n\n`;
markdown += `AIアシスタント（indesign-uxp-server）に搭載されている、全 ${allToolDefinitions.length} 種類の操作ツール一覧です。AIはこれらを組み合わせてInDesignを自動操作します。\n\n`;
markdown += `| ツール名（システム名） | 説明（何ができるか） |\n`;
markdown += `| --- | --- |\n`;

for (const tool of allToolDefinitions) {
    const desc = tool.description.replace(/\n/g, '<br>');
    markdown += `| \`${tool.name}\` | ${desc} |\n`;
}

// Write to docs directory
const artifactPath = path.join(__dirname, 'docs', 'tool_list.md');
fs.writeFileSync(artifactPath, markdown);
console.log('Successfully generated docs/tool_list.md');
