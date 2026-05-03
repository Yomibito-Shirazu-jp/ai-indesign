/**
 * PageItem and Group tool definitions
 */
export const pageItemGroupToolDefinitions = [
    // PageItem Management Tools
    {
        name: 'get_page_item_info',
        description: 'ページアイテムの情報を取得',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: {
                    type: 'integer',
                    description: 'Index of the page containing the item'
                },
                itemIndex: {
                    type: 'integer',
                    description: 'Index of the page item to get info for'
                }
            },
            required: ['pageIndex', 'itemIndex']
        }
    },
    {
        name: 'select_page_item',
        description: 'ページアイテムを選択',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: {
                    type: 'integer',
                    description: 'Index of the page containing the item'
                },
                itemIndex: {
                    type: 'integer',
                    description: 'Index of the page item to select'
                },
                existingSelection: {
                    type: 'string',
                    enum: ['REPLACE_WITH', 'ADD_TO', 'REMOVE_FROM'],
                    description: 'How to handle existing selection',
                    default: 'REPLACE_WITH'
                }
            },
            required: ['pageIndex', 'itemIndex']
        }
    },
    {
        name: 'move_page_item',
        description: 'ページアイテムを移動',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: {
                    type: 'integer',
                    description: 'Index of the page containing the item'
                },
                itemIndex: {
                    type: 'integer',
                    description: 'Index of the page item to move'
                },
                x: {
                    type: 'number',
                    description: 'New X coordinate'
                },
                y: {
                    type: 'number',
                    description: 'New Y coordinate'
                }
            },
            required: ['pageIndex', 'itemIndex', 'x', 'y']
        }
    },
    {
        name: 'resize_page_item',
        description: 'ページアイテムのサイズを変更',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: {
                    type: 'integer',
                    description: 'Index of the page containing the item'
                },
                itemIndex: {
                    type: 'integer',
                    description: 'Index of the page item to resize'
                },
                width: {
                    type: 'number',
                    description: 'New width'
                },
                height: {
                    type: 'number',
                    description: 'New height'
                },
                anchorPoint: {
                    type: 'string',
                    enum: ['CENTER_ANCHOR', 'TOP_LEFT_ANCHOR', 'TOP_CENTER_ANCHOR', 'TOP_RIGHT_ANCHOR', 'LEFT_CENTER_ANCHOR', 'RIGHT_CENTER_ANCHOR', 'BOTTOM_LEFT_ANCHOR', 'BOTTOM_CENTER_ANCHOR', 'BOTTOM_RIGHT_ANCHOR'],
                    description: 'Anchor point for resizing',
                    default: 'CENTER_ANCHOR'
                }
            },
            required: ['pageIndex', 'itemIndex', 'width', 'height']
        }
    },
    {
        name: 'set_page_item_properties',
        description: 'ページアイテムのプロパティを設定',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: {
                    type: 'integer',
                    description: 'Index of the page containing the item'
                },
                itemIndex: {
                    type: 'integer',
                    description: 'Index of the page item to modify'
                },
                fillColor: {
                    type: 'string',
                    description: 'Fill color name'
                },
                strokeColor: {
                    type: 'string',
                    description: 'Stroke color name'
                },
                strokeWeight: {
                    type: 'number',
                    description: 'Stroke weight'
                },
                visible: {
                    type: 'boolean',
                    description: 'Whether the item is visible'
                },
                locked: {
                    type: 'boolean',
                    description: 'Whether the item is locked'
                }
            },
            required: ['pageIndex', 'itemIndex']
        }
    },
    {
        name: 'duplicate_page_item',
        description: 'ページアイテムを複製',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: {
                    type: 'integer',
                    description: 'Index of the page containing the item'
                },
                itemIndex: {
                    type: 'integer',
                    description: 'Index of the page item to duplicate'
                },
                x: {
                    type: 'number',
                    description: 'X coordinate for the duplicate'
                },
                y: {
                    type: 'number',
                    description: 'Y coordinate for the duplicate'
                }
            },
            required: ['pageIndex', 'itemIndex', 'x', 'y']
        }
    },
    {
        name: 'delete_page_item',
        description: 'ページアイテムを削除',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: {
                    type: 'integer',
                    description: 'Index of the page containing the item'
                },
                itemIndex: {
                    type: 'integer',
                    description: 'Index of the page item to delete'
                }
            },
            required: ['pageIndex', 'itemIndex']
        }
    },
    {
        name: 'list_page_items',
        description: 'ページアイテム一覧を取得',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: {
                    type: 'integer',
                    description: 'Index of the page to list items from'
                }
            },
            required: ['pageIndex']
        }
    },

    // Group Management Tools
    {
        name: 'create_group',
        description: 'グループを作成',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: {
                    type: 'integer',
                    description: 'Index of the page where the group will be created'
                }
            },
            required: ['pageIndex']
        }
    },
    {
        name: 'create_group_from_items',
        description: '選択アイテムからグループを作成',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: {
                    type: 'integer',
                    description: 'Index of the page containing the items'
                },
                itemIndices: {
                    type: 'array',
                    items: {
                        type: 'integer'
                    },
                    description: 'Array of item indices to group together',
                    minItems: 2
                }
            },
            required: ['pageIndex', 'itemIndices']
        }
    },
    {
        name: 'ungroup',
        description: 'グループを解除',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: {
                    type: 'integer',
                    description: 'Index of the page containing the group'
                },
                groupIndex: {
                    type: 'integer',
                    description: 'Index of the group to ungroup'
                }
            },
            required: ['pageIndex', 'groupIndex']
        }
    },
    {
        name: 'get_group_info',
        description: 'グループの情報を取得',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: {
                    type: 'integer',
                    description: 'Index of the page containing the group'
                },
                groupIndex: {
                    type: 'integer',
                    description: 'Index of the group to get info for'
                }
            },
            required: ['pageIndex', 'groupIndex']
        }
    },
    {
        name: 'add_item_to_group',
        description: 'アイテムをグループに追加',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: {
                    type: 'integer',
                    description: 'Index of the page containing the group and item'
                },
                groupIndex: {
                    type: 'integer',
                    description: 'Index of the group to add the item to'
                },
                itemIndex: {
                    type: 'integer',
                    description: 'Index of the page item to add to the group'
                }
            },
            required: ['pageIndex', 'groupIndex', 'itemIndex']
        }
    },
    {
        name: 'remove_item_from_group',
        description: 'アイテムをグループから除外',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: {
                    type: 'integer',
                    description: 'Index of the page containing the group'
                },
                groupIndex: {
                    type: 'integer',
                    description: 'Index of the group to remove the item from'
                },
                itemIndex: {
                    type: 'integer',
                    description: 'Index of the item within the group to remove'
                }
            },
            required: ['pageIndex', 'groupIndex', 'itemIndex']
        }
    },
    {
        name: 'list_groups',
        description: 'グループ一覧を取得',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: {
                    type: 'integer',
                    description: 'Index of the page to list groups from'
                }
            },
            required: ['pageIndex']
        }
    },
    {
        name: 'set_group_properties',
        description: 'グループのプロパティを設定',
        inputSchema: {
            type: 'object',
            properties: {
                pageIndex: {
                    type: 'integer',
                    description: 'Index of the page containing the group'
                },
                groupIndex: {
                    type: 'integer',
                    description: 'Index of the group to modify'
                },
                visible: {
                    type: 'boolean',
                    description: 'Whether the group is visible'
                },
                locked: {
                    type: 'boolean',
                    description: 'Whether the group is locked'
                },
                name: {
                    type: 'string',
                    description: 'Name for the group'
                }
            },
            required: ['pageIndex', 'groupIndex']
        }
    }
]; 