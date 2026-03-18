# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note**: This project was renamed from "indesign-uxp-server" to **"AI in Design"** as of v2.0.0.

## [2.0.0] - 2026-03-06

### 🚀 Added
- **Japanese Typesetting System**: Full Japanese DTP support including kinsoku, kumihan, ruby, and typesetting presets (書籍/冊子/チラシ/広報紙/POP)
- **Vertical Text Engine**: Vertical text frames, tate-chu-yoko, vertical punctuation correction, right-binding auto-fix
- **Proofreading System**: Hyoki-yure (表記揺れ) detection, joyo kanji check, sensitive term detection with alternatives
- **Text Flow & Manuscript**: Auto-flow with page creation, manuscript structure analysis, overset resolution
- **Preflight & Print Checks**: K100% overprint enforcement, vertical glyph outlining, PDF/X-1a and PDF/X-4 export
- **Redline & Change Management**: Batch redline application, natural language text replacement, version comparison
- **Natural Language Operations**: Japanese instruction parsing to intermediate representation (IR)
- **Bridge Auto-Start**: MCP server now automatically spawns the bridge server (`bridge/server.js`) on startup — no more manual `node bridge/server.js`
- **Book Management**: Full InDesign Book support (create, synchronize, repaginate, export, package, preflight)
- **Spread Management**: Complete spread operations (duplicate, move, delete, guides, file placement)

### 🔧 Enhanced
- **Tool Definitions**: Expanded from 50+ to **179 professional tools**
- **Project Rename**: Renamed from "indesign-uxp-server" to "AI in Design"
- **Documentation**: Complete rewrite of README (Japanese, beginner-friendly), LLM_PROMPT, MCP_INSTRUCTIONS, CONTRIBUTING, and tool_list
- **Bridge Connection**: Auto-detection of port 3001 availability; spawns bridge as detached background process with 500ms startup wait

### 🐛 Fixed
- **Bridge Auto-Start**: Fixed bridge server not starting when Claude loads the MCP, causing "Disconnected — retrying in 3s" indefinitely
- **Port Conflict**: Added port-in-use check before spawning bridge to avoid duplicate processes

### ⚠️ Breaking Changes
- None — all v1.x functionality remains compatible

---

## [1.1.0] - 2025-07-27

### 🚀 Added
- **Help System**: Comprehensive `help` command with tool-specific help, category filtering, and multiple output formats
- **Image Scaling**: Advanced image placement with precise scaling (1-1000%) and multiple fit modes
- **Smart Positioning**: Enhanced session management with automatic bounds checking and optimal content placement
- **Color Management**: Fixed RGB to CMYK conversion with proper color swatch creation
- **Style Application**: Direct style application during text frame creation
- **Page Backgrounds**: Full-page background color application with opacity control
- **Enhanced Error Handling**: Improved error reporting and validation across all handlers
- **Comprehensive Documentation**: Added MCP_INSTRUCTIONS.md and LLM_PROMPT.md for better user guidance

### 🔧 Enhanced
- **Session Management**: Upgraded to EventTarget-based system with import/export capabilities
- **Tool Definitions**: Expanded from 35+ to 50+ professional tools
- **Image Handling**: Robust image placement with absolute path support and error recovery
- **Font Management**: Improved font application with fallback handling
- **Style System**: Enhanced paragraph, character, and object style creation and application
- **Layout Tools**: Advanced positioning and grouping capabilities
- **Export Functions**: Comprehensive PDF and image export options

### 🐛 Fixed
- **Color Creation**: Fixed RGB to CMYK conversion formula for accurate color representation
- **Font Application**: Resolved font name formatting issues in ExtendScript
- **Image Placement**: Fixed file path resolution and error handling for image placement
- **Style Application**: Corrected style application during text frame creation
- **Error Reporting**: Improved error message clarity and debugging information
- **Session Persistence**: Fixed session management across tool calls

### 📚 Documentation
- **MCP Instructions**: Comprehensive setup and usage guide for MCP integration
- **LLM Prompt**: Concise instructions for AI assistants using the MCP server
- **README Updates**: Enhanced documentation with examples and best practices
- **Help System**: Built-in documentation accessible via the `help` command

### 🧪 Testing
- **Unified Test Runner**: Single-document test suite for better session management testing
- **Comprehensive Coverage**: Tests for all major functionality including edge cases
- **Error Handling Tests**: Validation of error scenarios and recovery
- **Performance Tests**: Verification of scaling and positioning accuracy

### 🔧 Technical Improvements
- **Modular Architecture**: Clean separation of concerns with dedicated handler classes
- **Type Safety**: Comprehensive tool definitions with parameter validation
- **Error Recovery**: Graceful handling of missing resources and invalid inputs
- **Performance**: Optimized ExtendScript execution and response handling

## [1.0.0] - 2025-07-26

### 🎉 Initial Release
- **Core MCP Server**: Model Context Protocol implementation for Adobe InDesign
- **Document Management**: Create, open, save, and manage InDesign documents
- **Page Operations**: Add, delete, and manipulate pages
- **Content Creation**: Text frames, graphics, and basic styling
- **Basic Export**: PDF and image export capabilities
- **35+ Tools**: Comprehensive set of InDesign automation tools

---

## Migration Guide

### From v1.x to v2.0.0

#### New Features
- Japanese typesetting, vertical text, proofreading, and preflight tools are now available
- Bridge server starts automatically — remove any manual `node bridge/server.js` from your startup scripts
- Use `proofread_all` for comprehensive Japanese text checking
- Use `preflight_check` → `check_black_overprint` → `export_print_pdf` for print-ready output

#### Breaking Changes
- None — all existing functionality remains compatible

### From v1.0.0 to v1.1.0

#### New Features
- Use the `help` command to explore functionality
- Leverage image scaling with `place_image` tool
- Use the enhanced color management system

#### Breaking Changes
- None

---

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
