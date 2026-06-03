// src/data/mapLayouts.ts

export interface NodeDef {
  id: string;
  label: string;
  cx: number;
  cy: number;
}

export interface EdgeDef {
  from: string;
  to: string;
}

export interface ChapterLayout {
  viewBoxHeight: number;
  nodes: NodeDef[];
  edges: EdgeDef[];
}

/** 场景化锁定文案（点击锁定节点时显示） */
export const LOCK_MESSAGES: Record<string, string> = {
  kitchen:              '厨娘守着门口，掌柜没发话，闲人免进。',
  cellar:               '铜锁沉沉挂着——掌柜还没有开口信任你。',
  forest:               '城郊的路还没走的理由，先把客栈的事理清。',
  old_mansion:          '大门纹丝不动——铁证未齐，推不开这扇门。',
  back_alley:           '后巷通往何处，得先找到那条踪迹才知道。',
  imperial_teahouse:    '那个方向，你还没有可以追寻的踪迹。',
  yongning_nightmarket: '夜市巷口有人把守——还没有浪鹏帮的踪迹，进不去。',
  censorate_street:     '廷尉府外街还没有去的理由——李邈的背景还不清晰。',
  qujiang_pavilion:     '池畔的亭子，你尚不知晓那里有谁在等。',
  censorate_outer:      '廷尉府外院的门尚未对你开放——手中证据还不足以推开它。',
  tianji_ruins_ch3:     '旧宅的路，还不到归去的时候。',
};

/**
 * 三章节点地图布局。
 * viewBox 统一宽度 220，节点尺寸 68×24，行间距约 56。
 * 三节点横排中心 x 值：36 / 110 / 184，两两间距 74 > NW=68，无重叠。
 */
export const CHAPTER_LAYOUTS: Record<string, ChapterLayout> = {
  chapter1: {
    viewBoxHeight: 208,
    nodes: [
      { id: 'room_203',    label: '二〇三号房', cx: 36,  cy: 22  },
      { id: 'room_202',    label: '凶案现场',   cx: 184, cy: 22  },
      { id: 'lobby',       label: '客栈大堂',   cx: 110, cy: 72  },
      { id: 'kitchen',     label: '后厨',       cx: 36,  cy: 120 },
      { id: 'cellar',      label: '地窖',       cx: 110, cy: 120 },
      { id: 'forest',      label: '城郊树林',   cx: 184, cy: 120 },
      { id: 'old_mansion', label: '废弃宅院',   cx: 110, cy: 170 },
      { id: 'back_alley',  label: '城郊后巷',   cx: 184, cy: 170 },
    ],
    edges: [
      { from: 'room_203',    to: 'lobby'       },
      { from: 'room_203',    to: 'room_202'    },
      { from: 'lobby',       to: 'kitchen'     },
      { from: 'lobby',       to: 'cellar'      },
      { from: 'lobby',       to: 'forest'      },
      { from: 'lobby',       to: 'old_mansion' },
      { from: 'forest',      to: 'back_alley'  },
    ],
  },
  chapter2: {
    viewBoxHeight: 270,
    nodes: [
      { id: 'yongning_nightmarket', label: '永宁坊夜市',  cx: 36,  cy: 26  },
      { id: 'east_market_entrance', label: '东市入口',    cx: 110, cy: 26  },
      { id: 'zhuque_teahouse_st',   label: '朱雀茶肆',   cx: 184, cy: 26  },
      { id: 'huichuntang',          label: '回春堂',      cx: 36,  cy: 90  },
      { id: 'antique_shop',         label: '西市古玩铺',  cx: 110, cy: 90  },
      { id: 'cien_temple',          label: '慈恩寺偏院',  cx: 184, cy: 90  },
      { id: 'pingkang_hideout',     label: '平康坊据点',  cx: 147, cy: 152 },
      { id: 'imperial_teahouse',    label: '皇城茶馆',    cx: 147, cy: 208 },
      { id: 'censorate_street',     label: '廷尉府外街',  cx: 147, cy: 258 },
    ],
    edges: [
      { from: 'east_market_entrance', to: 'yongning_nightmarket' },
      { from: 'east_market_entrance', to: 'zhuque_teahouse_st'   },
      { from: 'east_market_entrance', to: 'huichuntang'          },
      { from: 'east_market_entrance', to: 'antique_shop'         },
      { from: 'east_market_entrance', to: 'cien_temple'          },
      { from: 'huichuntang',          to: 'cien_temple'          },
      { from: 'cien_temple',          to: 'pingkang_hideout'     },
      { from: 'pingkang_hideout',     to: 'imperial_teahouse'    },
      { from: 'imperial_teahouse',    to: 'censorate_street'     },
    ],
  },
  chapter3: {
    viewBoxHeight: 190,
    nodes: [
      { id: 'dayan_pagoda',     label: '大雁塔下', cx: 36,  cy: 48  },
      { id: 'tianji_safehouse', label: '天机安宅', cx: 184, cy: 48  },
      { id: 'leyou_plain',      label: '乐游原',   cx: 36,  cy: 104 },
      { id: 'feiyes_manor',     label: '飞爷故居', cx: 110, cy: 104 },
      { id: 'censorate_outer',  label: '廷尉府外院', cx: 184, cy: 104 },
      { id: 'tianji_ruins_ch3', label: '天机旧宅', cx: 75,  cy: 158 },
      { id: 'qujiang_pavilion', label: '曲江亭',   cx: 148, cy: 158 },
    ],
    edges: [
      { from: 'dayan_pagoda',     to: 'feiyes_manor'     },
      { from: 'tianji_safehouse', to: 'feiyes_manor'     },
      { from: 'tianji_safehouse', to: 'censorate_outer'  },
      { from: 'feiyes_manor',     to: 'leyou_plain'      },
      { from: 'feiyes_manor',     to: 'tianji_ruins_ch3' },
      { from: 'feiyes_manor',     to: 'qujiang_pavilion' },
    ],
  },
};
