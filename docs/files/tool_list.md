# 全ツール（機能）一覧表 / Complete Tool List

AI in Design（旧称: indesign-uxp-server）に搭載されている、全 **179種類** の操作ツール一覧です。
AIはこれらを組み合わせてInDesignを自動操作します。

All 179 tools available in AI in Design. The AI combines these tools to automate InDesign operations.

---

## 📄 ページ管理 / Page Management

| ツール名 | 説明 / Description |
| :--- | :--- |
| `add_page` | ページを追加 / Add a new page |
| `delete_page` | ページを削除 / Delete a page |
| `duplicate_page` | ページを複製 / Duplicate a page |
| `navigate_to_page` | 指定ページへ移動 / Navigate to a specific page |
| `get_page_info` | ページ情報を取得 / Get detailed page information |
| `move_page` | ページを移動 / Move a page to a different position |
| `set_page_properties` | ページ属性を設定 / Set properties for a page |
| `adjust_page_layout` | ページレイアウトを調整 / Adjust page layout with new dimensions and margins |
| `resize_page` | ページサイズを変更 / Resize a page |
| `place_file_on_page` | ページにファイルを配置 / Place a file on a page |
| `place_xml_on_page` | ページにXMLを配置 / Place XML content on a page |
| `snapshot_page_layout` | レイアウトのスナップショットを作成 / Create a snapshot of the current page layout |
| `delete_page_layout_snapshot` | スナップショットを削除 / Delete the layout snapshot for a page |
| `delete_all_page_layout_snapshots` | 全スナップショットを削除 / Delete all layout snapshots |
| `reframe_page` | ページをリフレーム / Reframe (resize) a page |
| `create_page_guides` | ガイドを作成 / Create guides on a page |
| `select_page` | ページを選択 / Select a page |
| `get_page_content_summary` | ページ内容の概要を取得 / Get a summary of content on a page |
| `set_page_background` | ページ背景色を設定 / Set page background color |

## 📝 テキスト・表 / Text & Tables

| ツール名 | 説明 / Description |
| :--- | :--- |
| `create_text_frame` | テキストフレームを作成 / Create a text frame on the active page |
| `edit_text_frame` | テキストフレームを編集 / Edit an existing text frame |
| `find_replace_text` | 検索と置換 / Find and replace text in the document |
| `create_table` | 表を作成 / Create a table on the active page |
| `populate_table` | 表にデータを入力 / Populate a table with data |

## 🖼️ 画像・図形 / Images & Shapes

| ツール名 | 説明 / Description |
| :--- | :--- |
| `place_image` | 画像を配置（スケーリング・フィット対応） / Place an image with scaling and fitting options |
| `get_image_info` | 画像情報を取得 / Get detailed image information |
| `create_rectangle` | 長方形を作成 / Create a rectangle |
| `create_ellipse` | 楕円を作成 / Create an ellipse |
| `create_polygon` | 多角形を作成 / Create a polygon |

## 🎨 スタイル・カラー / Styles & Colors

| ツール名 | 説明 / Description |
| :--- | :--- |
| `create_paragraph_style` | 段落スタイルを作成 / Create a paragraph style |
| `create_character_style` | 文字スタイルを作成 / Create a character style |
| `apply_paragraph_style` | 段落スタイルを適用 / Apply a paragraph style to text |
| `list_styles` | 全スタイル一覧 / List all paragraph and character styles |
| `create_object_style` | オブジェクトスタイルを作成 / Create an object style |
| `list_object_styles` | オブジェクトスタイル一覧 / List all object styles |
| `apply_object_style` | オブジェクトスタイルを適用 / Apply an object style to a page item |
| `create_color_swatch` | カラースウォッチを作成 / Create a color swatch |
| `list_color_swatches` | カラースウォッチ一覧 / List all color swatches |
| `apply_color` | オブジェクトに色を適用 / Apply color to an object |

## 📁 ドキュメント管理 / Document Management

| ツール名 | 説明 / Description |
| :--- | :--- |
| `create_document` | 新規ドキュメントを作成 / Create a new document |
| `open_document` | ドキュメントを開く / Open an existing document |
| `save_document` | ドキュメントを保存 / Save the active document |
| `close_document` | ドキュメントを閉じる / Close the active document |
| `get_document_info` | ドキュメント情報を取得 / Get document information |
| `preflight_document` | プリフライトを実行 / Run preflight on the document |
| `zoom_to_page` | ページにズーム / Zoom to fit page in view |
| `data_merge` | データ結合 / Perform data merge operation |
| `get_document_elements` | 全要素を取得 / Get all elements |
| `get_document_styles` | 全スタイルを取得 / Get all styles |
| `get_document_colors` | 全カラーを取得 / Get all colors and swatches |
| `get_document_preferences` | ドキュメント設定を取得 / Get document preferences |
| `set_document_preferences` | ドキュメント設定を変更 / Set document preferences |
| `get_document_stories` | 全ストーリーを取得 / Get all stories |
| `find_text_in_document` | テキスト検索 / Find text across the entire document |
| `get_document_layers` | 全レイヤーを取得 / Get all layers |
| `organize_document_layers` | レイヤーを整理 / Organize and clean up layers |
| `get_document_hyperlinks` | ハイパーリンクを取得 / Get all hyperlinks |
| `create_document_hyperlink` | ハイパーリンクを作成 / Create a hyperlink |
| `get_document_sections` | セクションを取得 / Get all sections |
| `create_document_section` | セクションを作成 / Create a new section |
| `get_document_xml_structure` | XML構造を取得 / Get XML structure |
| `export_document_xml` | XMLエクスポート / Export document as XML |
| `save_document_to_cloud` | Creative Cloudに保存 / Save to Adobe Creative Cloud |
| `open_cloud_document` | Creative Cloudから開く / Open from Adobe Creative Cloud |
| `get_document_grid_settings` | グリッド設定を取得 / Get grid settings |
| `set_document_grid_settings` | グリッド設定を変更 / Set grid settings |
| `get_document_layout_preferences` | レイアウト設定を取得 / Get layout preferences |
| `set_document_layout_preferences` | レイアウト設定を変更 / Set layout preferences |
| `validate_document` | ドキュメントを検証 / Validate document structure and content |
| `cleanup_document` | 不要要素を削除 / Clean up document |

## 📤 エクスポート / Export

| ツール名 | 説明 / Description |
| :--- | :--- |
| `export_pdf` | PDF書き出し / Export document to PDF |
| `export_images` | 画像書き出し / Export pages as images |
| `export_epub` | EPUB書き出し / Export document to EPUB |
| `package_document` | パッケージ化 / Package document for printing |

## 📚 ブック管理 / Book Management

| ツール名 | 説明 / Description |
| :--- | :--- |
| `create_book` | 新規ブック作成 / Create a new InDesign book |
| `open_book` | ブックを開く / Open an existing book |
| `list_books` | ブック一覧 / List all open books |
| `add_document_to_book` | ブックにドキュメント追加 / Add a document to a book |
| `synchronize_book` | スタイル同期 / Synchronize styles across all documents |
| `repaginate_book` | ページ番号更新 / Repaginate all documents |
| `update_all_cross_references` | 相互参照更新 / Update all cross references |
| `update_all_numbers` | 全番号更新 / Update all numbers |
| `update_chapter_and_paragraph_numbers` | 章・段落番号更新 / Update chapter and paragraph numbers |
| `export_book` | ブック書き出し / Export an entire book |
| `package_book` | ブックパッケージ化 / Package a book for production |
| `preflight_book` | ブックプリフライト / Preflight a book |
| `print_book` | ブック印刷 / Print a book |
| `get_book_info` | ブック情報取得 / Get book information |
| `set_book_properties` | ブック属性設定 / Set book properties |

## 🔧 ページアイテム操作 / Page Item Operations

| ツール名 | 説明 / Description |
| :--- | :--- |
| `get_page_item_info` | アイテム情報取得 / Get page item information |
| `select_page_item` | アイテムを選択 / Select a page item |
| `move_page_item` | アイテムを移動 / Move a page item |
| `resize_page_item` | アイテムをリサイズ / Resize a page item |
| `set_page_item_properties` | アイテム属性設定 / Set page item properties |
| `duplicate_page_item` | アイテムを複製 / Duplicate a page item |
| `delete_page_item` | アイテムを削除 / Delete a page item |
| `list_page_items` | 全アイテム一覧 / List all page items on a page |

## 📦 グループ / Groups

| ツール名 | 説明 / Description |
| :--- | :--- |
| `create_group` | 選択アイテムをグループ化 / Group selected items |
| `create_group_from_items` | 指定アイテムをグループ化 / Group specific items by indices |
| `ungroup` | グループ解除 / Ungroup |
| `get_group_info` | グループ情報取得 / Get group information |
| `add_item_to_group` | グループに追加 / Add item to a group |
| `remove_item_from_group` | グループから削除 / Remove item from a group |
| `list_groups` | グループ一覧 / List all groups on a page |
| `set_group_properties` | グループ属性設定 / Set group properties |

## 📐 マスタースプレッド / Master Spreads

| ツール名 | 説明 / Description |
| :--- | :--- |
| `create_master_spread` | マスタースプレッド作成 / Create a new master spread |
| `list_master_spreads` | マスタースプレッド一覧 / List all master spreads |
| `delete_master_spread` | マスタースプレッド削除 / Delete a master spread |
| `duplicate_master_spread` | マスタースプレッド複製 / Duplicate a master spread |
| `apply_master_spread` | マスタースプレッド適用 / Apply a master spread to pages |
| `create_master_text_frame` | マスターにテキストフレーム作成 / Create text frame on master |
| `create_master_rectangle` | マスターに長方形作成 / Create rectangle on master |
| `create_master_guides` | マスターにガイド作成 / Create guides on master |
| `get_master_spread_info` | マスタースプレッド情報取得 / Get master spread information |
| `detach_master_items` | マスターアイテム切り離し / Detach master page items |
| `remove_master_override` | オーバーライド解除 / Remove master override |

## 📋 スプレッド管理 / Spread Management

| ツール名 | 説明 / Description |
| :--- | :--- |
| `list_spreads` | スプレッド一覧 / List all spreads |
| `get_spread_info` | スプレッド情報取得 / Get spread information |
| `duplicate_spread` | スプレッド複製 / Duplicate a spread |
| `move_spread` | スプレッド移動 / Move a spread |
| `delete_spread` | スプレッド削除 / Delete a spread |
| `set_spread_properties` | スプレッド属性設定 / Set spread properties |
| `create_spread_guides` | スプレッドにガイド作成 / Create guides on a spread |
| `place_file_on_spread` | スプレッドにファイル配置 / Place a file on a spread |
| `place_xml_on_spread` | スプレッドにXML配置 / Place XML on a spread |
| `select_spread` | スプレッド選択 / Select a spread |
| `get_spread_content_summary` | スプレッド内容概要 / Get spread content summary |

## 🗂️ レイヤー / Layers

| ツール名 | 説明 / Description |
| :--- | :--- |
| `create_layer` | 新規レイヤー作成 / Create a new layer |
| `set_active_layer` | アクティブレイヤー設定 / Set the active layer |
| `list_layers` | レイヤー一覧 / List all layers |

## 🇯🇵 和文組版 / Japanese Typesetting

| ツール名 | 説明 / Description |
| :--- | :--- |
| `apply_japanese_typesetting_preset` | 和文組版プリセット適用（書籍/冊子/チラシ/広報紙/POP） / Apply typesetting preset |
| `normalize_japanese_text` | テキスト正規化（半角全角変換、数字統一、スペース削除） / Normalize text |
| `fix_kinsoku` | 禁則処理設定（行頭禁則、行末禁則、ぶら下がり） / Set kinsoku rules |
| `adjust_kumihan` | 和欧混植調整、約物・句読点処理 / Mixed spacing, yakumono, punctuation |
| `adjust_tracking_for_japanese` | 和文字詰め・字送り調整 / Japanese tracking adjustment |
| `adjust_leading_for_japanese` | 行送り調整 / Leading adjustment |
| `validate_japanese_layout` | 組版品質検証（オーバーセット、スタイル、可読性） / Layout quality check |
| `detect_style_inconsistencies` | スタイル不整合検出 / Detect style inconsistencies |

## 📐 縦書き / Vertical Text

| ツール名 | 説明 / Description |
| :--- | :--- |
| `create_vertical_text_frame` | 縦組みテキストフレーム作成 / Create vertical text frame |
| `convert_frame_to_vertical` | 横組み→縦組み変換 / Convert to vertical |
| `validate_vertical_layout` | 縦書き品質検証（数字・英字・約物崩れ） / Validate vertical layout |
| `fix_tatechuyoko` | 縦中横設定 / Set tate-chu-yoko |
| `fix_vertical_punctuation` | 約物回転・括弧・句読点補正 / Fix vertical punctuation |
| `mix_vertical_and_horizontal_layout` | 縦横混在レイアウト管理 / Mixed layout management |

## ✅ 入稿前チェック / Preflight & Print

| ツール名 | 説明 / Description |
| :--- | :--- |
| `preflight_check` | 入稿前総合チェック / Comprehensive preflight check |
| `check_fonts` | フォント問題検出 / Detect font issues |
| `check_links` | リンク切れ検出 / Detect broken links |
| `check_image_resolution` | 低解像度画像検出 / Detect low-resolution images |
| `check_bleed` | 塗り足し不足検出 / Detect insufficient bleed |
| `check_overset` | オーバーセット検出 / Detect overset text |
| `check_color_space` | カラーモード不整合検出 / Detect color mode mismatches |
| `check_right_binding` | 右綴じチェック・補正 / Check/fix right-binding |
| `check_black_overprint` | スミベタ（K100%）オーバープリント / Check/apply K100% overprint |
| `auto_outline_vertical_glyphs` | 縦書き約物アウトライン化 / Outline vertical glyphs |
| `export_print_pdf` | 入稿用PDF書き出し（⚠️ confirm） / Print-ready PDF export |
| `export_review_pdf` | 校正用PDF書き出し / Review PDF export |

## 📥 テキスト取り込み・流し込み / Text Import & Flow

| ツール名 | 説明 / Description |
| :--- | :--- |
| `import_text` | テキスト取り込み / Import text |
| `parse_manuscript_structure` | 原稿構造解析 / Analyze manuscript structure |
| `flow_text_to_pages` | 自動流し込み（⚠️ confirm） / Auto-flow text with page creation |
| `apply_document_template` | テンプレート適用（⚠️ confirm） / Apply document template |
| `resolve_overset_text` | オーバーセット解決提案 / Suggest overset solutions |
| `list_available_templates` | テンプレート一覧 / List available templates |

## ✏️ 赤字・変更管理 / Corrections & Changes

| ツール名 | 説明 / Description |
| :--- | :--- |
| `apply_redline_changes` | 赤字一括反映（⚠️ confirm） / Batch-apply redline corrections |
| `replace_text_by_instruction` | 自然文テキスト置換 / Replace text via instruction |
| `export_change_log` | 変更履歴出力 / Export change log |
| `compare_versions` | バージョン差分比較 / Compare versions |

## 🔍 校正・校閲 / Proofreading

| ツール名 | 説明 / Description |
| :--- | :--- |
| `check_joyo_kanji` | 常用漢字外の漢字を検出 / Detect non-joyo kanji |
| `check_hyoki_yure` | 表記揺れ検知 / Detect notation inconsistencies |
| `check_sensitive_terms` | 不適切表現検出・代替提案 / Detect inappropriate terms |
| `proofread_all` | 校閲総合チェック / Comprehensive proofreading |

## 🤖 自然言語操作 / Natural Language Operations

| ツール名 | 説明 / Description |
| :--- | :--- |
| `parse_instruction` | 日本語自然文→DTP操作IR変換（解析のみ） / Parse Japanese instruction |
| `confirm_instruction` | 保留操作の承認・却下 / Approve/reject pending operations |

## 📊 セッション・ログ / Session & Logging

| ツール名 | 説明 / Description |
| :--- | :--- |
| `execute_indesign_code` | カスタムExtendScript実行 / Execute custom ExtendScript |
| `view_document` | ドキュメント状態表示 / View document state |
| `get_session_info` | セッション情報取得 / Get session information |
| `clear_session` | セッションクリア / Clear session data |
| `get_operation_log` | 操作ログ取得 / Get operation log |
| `export_operation_log` | 操作ログ書き出し（JSONL） / Export operation log as JSONL |
| `help` | ヘルプ表示 / Show help information |
