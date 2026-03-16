# AI in Design — InDesign MCP Server: Setup & Integration Guide

## Overview

AI in Design (formerly indesign-uxp-server) provides programmatic access to Adobe InDesign through Model Context Protocol (MCP). This allows AI assistants (Claude, etc.) to create, edit, and manage InDesign documents — with specialized support for **Japanese typesetting, vertical text, and print-ready production**.

## Architecture

The system consists of two components that work together:

1. **MCP Server** (`src/index.js`) — Started automatically by the AI client (Claude Desktop, etc.) via MCP config. Handles communication with the AI.
2. **Bridge Server** (`bridge/server.js`) — A WebSocket/HTTP relay that connects to the UXP plugin inside InDesign. **Automatically spawned** by the MCP server on startup (port 3001).

```
AI (Claude) ←—MCP—→ MCP Server (Node.js) ←—WebSocket—→ Bridge Server ←—UXP—→ InDesign
```

## Setup Requirements

### Prerequisites

- **Adobe InDesign**: Must be installed and running
- **Node.js**: Version 18 or higher
- **Adobe UXP Developer Tool**: For loading the bridge plugin into InDesign

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-org>/ai-in-design.git
cd ai-in-design

# Install dependencies
npm install

# Install bridge dependencies
cd bridge && npm install && cd ..
```

### Loading the UXP Plugin

1. Open `Adobe UXP Developer Tool`
2. Click **"Load and Watch"** and select `plugin/manifest.json` from this repository
3. The Bridge Panel should appear in InDesign and show **"Connected to bridge ✓"**

> **Tip**: Minimize the Bridge Panel to the dock — do not close it with ×, as this will disconnect the communication. If the connection drops, it will auto-reconnect every 3 seconds.

### MCP Configuration

Add to your MCP client configuration (e.g., `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "indesign": {
      "command": "node",
      "args": ["/path/to/ai-in-design/src/index.js"],
      "env": {}
    }
  }
}
```

The MCP server will automatically start the bridge server on port 3001. No separate manual startup is required.

## Available Tools (179 total)

For the complete list of all 179 tools with descriptions, see [`tool_list.md`](tool_list.md).
For AI-facing usage instructions and patterns, see [`LLM_PROMPT.md`](LLM_PROMPT.md).

### Tool Categories

| Category | Tools | Description |
| :--- | :---: | :--- |
| Page Management | 19 | Add, delete, move, resize pages; guides; backgrounds |
| Text & Tables | 5 | Create/edit text frames, find/replace, tables |
| Images & Shapes | 5 | Place images with scaling, rectangles, ellipses, polygons |
| Styles & Colors | 10 | Paragraph/character/object styles, color swatches |
| Document Management | 31 | Create/open/save, preferences, layers, hyperlinks, XML, cloud |
| Export | 4 | PDF, images, EPUB, packaging |
| Book Management | 15 | Create/manage InDesign books, synchronize, export |
| Page Item Operations | 8 | Select, move, resize, duplicate, delete page items |
| Groups | 8 | Create, manage, modify groups |
| Master Spreads | 11 | Create, apply, manage master pages |
| Spread Management | 11 | List, duplicate, move, delete spreads |
| Layers | 3 | Create, set active, list layers |
| **Japanese Typesetting** | **8** | Kinsoku, kumihan, ruby, presets, text normalization |
| **Vertical Text** | **6** | Vertical frames, tate-chu-yoko, punctuation, binding |
| **Preflight & Print** | **12** | Fonts, links, resolution, bleed, K100% overprint, PDF/X export |
| **Text Import & Flow** | **6** | Import, manuscript analysis, auto-flow, templates |
| **Corrections & Changes** | **4** | Redline, natural language replacement, version comparison |
| **Proofreading** | **4** | Joyo kanji, hyoki-yure, sensitive terms, comprehensive check |
| Natural Language Ops | 2 | Parse Japanese instructions to IR, confirm operations |
| Session & Logging | 7 | ExtendScript execution, session info, operation logs, help |

## Best Practices

### Session Management
- Always create a document before adding content
- Use `navigate_to_page` to ensure you're on the correct page
- Save documents regularly with `save_document`

### Japanese Typesetting Workflow
1. Create document → apply typesetting preset (`apply_japanese_typesetting_preset`)
2. Create vertical frames or convert existing frames (`create_vertical_text_frame` / `convert_frame_to_vertical`)
3. Check binding direction (`check_right_binding`)
4. Run proofreading (`proofread_all`)
5. Run preflight (`preflight_check` → `check_black_overprint` → `auto_outline_vertical_glyphs`)
6. Export (`export_print_pdf`)

### Image Handling
- Use absolute file paths for images
- Consider scaling and fit modes for optimal placement
- Fit modes: `PROPORTIONALLY`, `FILL_FRAME`, `FIT_CONTENT`, `FIT_FRAME`

### Error Handling
- Check tool responses for `success: true`
- Handle missing fonts or resources gracefully
- Validate parameters before tool calls

## Troubleshooting

### Common Issues

| Problem | Solution |
| :--- | :--- |
| "No document open" | Create a document first with `create_document` |
| "Font not found" | Use available fonts or provide fallbacks |
| "Image file not found" | Use absolute file paths |
| "Page out of bounds" | Check positioning parameters |
| Bridge Panel shows "Disconnected" | Ensure the MCP server is running; the bridge auto-starts on port 3001 |
| Bridge port conflict | Another process may be using port 3001; stop it or change the port |

### Debug Tips

- Use `get_document_info` to check document state
- Use `list_color_swatches` to see available colors
- Use `list_styles` to see available styles
- Use `get_session_info` to check session state
- Check tool responses for detailed error messages

## Support & Resources

### Documentation
- [README.md](README.md) — Project overview and usage guide (Japanese)
- [LLM_PROMPT.md](LLM_PROMPT.md) — AI-facing tool usage instructions
- [tool_list.md](tool_list.md) — Complete list of all 179 tools
- [CONTRIBUTING.md](CONTRIBUTING.md) — How to contribute
- [CHANGELOG.md](CHANGELOG.md) — Version history

### External References
- InDesign ExtendScript API: https://www.indesignjs.de/extendscriptAPI/
- MCP Protocol: https://modelcontextprotocol.io/
- Node.js Documentation: https://nodejs.org/docs/

### Community
- GitHub Issues for bug reports
- Feature requests and contributions welcome
