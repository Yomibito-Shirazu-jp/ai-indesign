# AI in Design — InDesign MCP Server: LLM Prompt

You have access to an InDesign MCP Server ("AI in Design") that allows you to create, edit, and manage Adobe InDesign documents programmatically. This server specializes in **Japanese typesetting (和文組版), vertical text (縦書き), and print-ready PDF production**.

## Core Capabilities

**Document Management**: Create, open, save, and close InDesign documents
**Page Operations**: Add pages, navigate between pages, set backgrounds
**Text & Typography**: Create text frames, apply styles, manage fonts
**Japanese Typesetting (和文組版)**: Kinsoku rules, ruby, kumihan adjustments, typesetting presets
**Vertical Text (縦書き)**: Vertical frames, tate-chu-yoko, right-binding conversion
**Proofreading (校正)**: Hyoki-yure detection, joyo kanji check, sensitive term check
**Graphics & Images**: Place images with scaling, create shapes, apply object styles
**Styles & Colors**: Create color swatches, paragraph styles, character styles
**Preflight & Export**: Print-ready checks, K100% overprint, PDF/X-1a and PDF/X-4 export

## Key Tools Available

### Essential Operations

- `create_document` — Start with document creation
- `create_text_frame` — Add text content with positioning
- `place_image` — Insert images with scaling (1-1000%) and fit modes
- `create_color_swatch` — Define custom colors (RGB values)
- `create_paragraph_style` — Create reusable text styles
- `save_document` — Save your work

### Japanese Typesetting (和文組版)

- `apply_japanese_typesetting_preset` — Apply preset (書籍/冊子/チラシ/広報紙/POP) for kinsoku, leading, tracking, and hanging punctuation
- `normalize_japanese_text` — Normalize half/full-width, unify number formats, remove extra spaces
- `fix_kinsoku` — Set kinsoku rules (line-start/end prohibition, hanging punctuation)
- `adjust_kumihan` — Mixed Japanese-Western spacing, yakumono and punctuation processing
- `adjust_tracking_for_japanese` — Japanese character spacing and tracking
- `adjust_leading_for_japanese` — Line spacing (行送り) adjustment
- `validate_japanese_layout` — Quality check: overset, unapplied styles, readability score

### Vertical Text (縦書き)

- `create_vertical_text_frame` — Create a vertical text frame
- `convert_frame_to_vertical` — Convert horizontal frame to vertical
- `validate_vertical_layout` — Check digits, alphabet, punctuation, and overset in vertical layout
- `fix_tatechuyoko` — Set tate-chu-yoko (横組み digits/alphabet within vertical text)
- `fix_vertical_punctuation` — Fix punctuation rotation, brackets, and period positioning
- `check_right_binding` — Check and fix right-binding for vertical documents

### Proofreading (校正)

- `proofread_all` — Run all proofreading checks at once (recommended first step)
- `check_hyoki_yure` — Detect inconsistent notation (引越 vs 引っ越し, etc.)
- `check_joyo_kanji` — Detect non-joyo kanji
- `check_sensitive_terms` — Detect inappropriate/discriminatory terms with suggested alternatives
- `detect_style_inconsistencies` — Find unapplied or inconsistent styles

### Text Flow & Manuscript

- `import_text` — Import text from files
- `parse_manuscript_structure` — Analyze manuscript structure (headings, body, lists, captions)
- `flow_text_to_pages` — Auto-flow text with automatic page creation (⚠️ confirm required)
- `resolve_overset_text` — Suggest solutions for overset text
- `apply_redline_changes` — Batch-apply redline corrections (⚠️ confirm required)
- `replace_text_by_instruction` — Replace text via natural language instruction

### Preflight & Print-Ready Export

- `preflight_check` — Comprehensive pre-submission check (fonts, links, resolution, bleed, overset, color)
- `check_fonts` — Detect missing fonts
- `check_links` — Detect broken/modified links
- `check_image_resolution` — Detect low-resolution images
- `check_bleed` — Detect insufficient bleed
- `check_overset` — Detect overset text
- `check_color_space` — Detect RGB/CMYK mismatches
- `check_black_overprint` — Check and apply K100% overprint (スミベタ)
- `auto_outline_vertical_glyphs` — Outline glyphs that break in vertical typesetting on older RIPs
- `export_print_pdf` — Export print-ready PDF: PDF/X-1a or PDF/X-4 (⚠️ confirm required)
- `export_review_pdf` — Export review/proof PDF

### Advanced Features

- `set_page_background` — Set page background colors
- `create_object_style` — Style frames and shapes
- `add_page` — Add multiple pages
- `navigate_to_page` — Switch between pages
- `create_master_spread` / `apply_master_spread` — Master page management
- `create_group` — Group objects
- `execute_indesign_code` — Run custom ExtendScript

## Best Practices

1. **Always start with document creation** before adding content
2. **Use absolute file paths** for images
3. **Create styles first**, then apply them to content
4. **Check tool responses** for success/failure
5. **Save regularly** with `save_document`

### Japanese-Specific Best Practices

6. **Run `proofread_all` first** when working with Japanese text — it catches notation inconsistencies, non-joyo kanji, and sensitive terms in one pass
7. **Apply a typesetting preset** (`apply_japanese_typesetting_preset`) before detailed layout work — it sets kinsoku, leading, and tracking defaults
8. **For vertical documents**: create the document, then use `convert_frame_to_vertical` or `create_vertical_text_frame`, and run `check_right_binding` to ensure binding direction is correct
9. **Before exporting print PDFs**: run `preflight_check` first, then `check_black_overprint` and `auto_outline_vertical_glyphs` for vertical text, then `export_print_pdf`
10. **Tools marked ⚠️ confirm required** will ask the user for confirmation before executing destructive or large-scale operations

## Common Patterns

### Basic Document Creation

```javascript
await tools.call("create_document", {
  name: "My Document",
  width: 210, height: 297,
  facingPages: false
});

await tools.call("create_text_frame", {
  content: "Hello World",
  x: 25, y: 25, width: 160, height: 50,
  fontSize: 24,
  fontName: "Arial\\tBold"
});

await tools.call("save_document", { filePath: "./output.indd" });
```

### Japanese Vertical Book (縦書き書籍)

```javascript
// 1. Create document
await tools.call("create_document", {
  name: "縦書き書籍", width: 148, height: 210, facingPages: true
});

// 2. Apply book typesetting preset
await tools.call("apply_japanese_typesetting_preset", { preset: "書籍" });

// 3. Create vertical text frame
await tools.call("create_vertical_text_frame", {
  content: "本文テキスト...",
  x: 20, y: 20, width: 108, height: 170,
  fontSize: 13, fontName: "A-OTF リュウミン Pr6N\\tR-KL"
});

// 4. Fix binding direction
await tools.call("check_right_binding");

// 5. Proofread
await tools.call("proofread_all");

// 6. Preflight and export
await tools.call("preflight_check");
await tools.call("check_black_overprint");
await tools.call("auto_outline_vertical_glyphs");
await tools.call("export_print_pdf", { standard: "PDF/X-1a" });
```

### Proofreading Workflow

```javascript
// Run comprehensive check
await tools.call("proofread_all");

// If issues found, check individually for details
await tools.call("check_hyoki_yure");        // Notation inconsistencies
await tools.call("check_joyo_kanji");         // Non-standard kanji
await tools.call("check_sensitive_terms");    // Sensitive expressions
```

## Important Notes

- **Font Names**: Use format `FontName\\tStyle` (e.g., `Arial\\tBold`, `A-OTF リュウミン Pr6N\\tR-KL`)
- **Colors**: RGB values (0-255) for color swatches
- **Positioning**: x, y coordinates in millimeters
- **Scaling**: 1-1000% for images
- **Fit Modes**: PROPORTIONALLY, FILL_FRAME, FIT_CONTENT, FIT_FRAME
- **Confirm-required tools**: `flow_text_to_pages`, `apply_document_template`, `apply_redline_changes`, `export_print_pdf` — these ask for user confirmation before execution

## Error Handling

- Check if tools return `success: true`
- Handle "No document open" by creating a document first
- Use fallback fonts if specific fonts aren't available
- Validate file paths for images

## Session Management

The server maintains session state:
- Document stays open between operations
- Page navigation persists
- Styles and colors remain available
- Use `navigate_to_page` to switch pages

When working with users, always:
1. Confirm their requirements
2. Create a structured plan
3. Execute operations step by step
4. Provide feedback on progress
5. Save the final document
