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
  kitchen:           '厨娘守着门口，掌柜没发话，闲人免进。',
  cellar:            '铜锁沉沉挂着——掌柜还没有开口信任你。',
  forest:            '城郊的路还没走的理由，先把客栈的事理清。',
  old_mansion:       '大门纹丝不动——铁证未齐，推不开这扇门。',
  back_alley:        '后巷通往何处，得先找到那条踪迹才知道。',
  imperial_teahouse: '那个方向，你还没有可以追寻的踪迹。',
  qujiang_pavilion:  '池畔的亭子，你尚不知晓那里有谁在等。',
};

/** 三章节点地图布局，viewBox 宽度固定 156 */
export const CHAPTER_LAYOUTS: Record<string, ChapterLayout> = {
  chapter1: {
    viewBoxHeight: 220,
    nodes: [
      { id: 'room_202',    label: '凶案现场',   cx: 117, cy: 18  },
      { id: 'room_203',    label: '二〇三号房', cx: 39,  cy: 18  },
      { id: 'lobby',       label: '客栈大堂',   cx: 78,  cy: 60  },
      { id: 'kitchen',     label: '后厨',       cx: 18,  cy: 105 },
      { id: 'cellar',      label: '地窖',       cx: 78,  cy: 105 },
      { id: 'forest',      label: '城郊树林',   cx: 138, cy: 105 },
      { id: 'old_mansion', label: '废弃宅院',   cx: 78,  cy: 160 },
      { id: 'back_alley',  label: '城郊后巷',   cx: 138, cy: 160 },
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
    viewBoxHeight: 185,
    nodes: [
      { id: 'east_market_entrance', label: '东市入口',   cx: 78,  cy: 18  },
      { id: 'huichuntang',          label: '回春堂',     cx: 18,  cy: 70  },
      { id: 'antique_shop',         label: '西市古玩铺', cx: 78,  cy: 70  },
      { id: 'cien_temple',          label: '慈恩寺偏院', cx: 138, cy: 70  },
      { id: 'pingkang_hideout',     label: '平康坊据点', cx: 108, cy: 128 },
      { id: 'imperial_teahouse',    label: '皇城茶馆',   cx: 108, cy: 168 },
    ],
    edges: [
      { from: 'east_market_entrance', to: 'huichuntang'       },
      { from: 'east_market_entrance', to: 'antique_shop'      },
      { from: 'east_market_entrance', to: 'cien_temple'       },
      { from: 'huichuntang',          to: 'cien_temple'       },
      { from: 'cien_temple',          to: 'pingkang_hideout'  },
      { from: 'pingkang_hideout',     to: 'imperial_teahouse' },
    ],
  },
  chapter3: {
    viewBoxHeight: 155,
    nodes: [
      { id: 'dayan_pagoda',    label: '大雁塔下', cx: 30,  cy: 55  },
      { id: 'tianji_safehouse',label: '天机安宅', cx: 126, cy: 55  },
      { id: 'feiyes_manor',    label: '飞爷故居', cx: 78,  cy: 105 },
      { id: 'qujiang_pavilion',label: '曲江亭',   cx: 78,  cy: 145 },
    ],
    edges: [
      { from: 'dayan_pagoda',     to: 'feiyes_manor'    },
      { from: 'tianji_safehouse', to: 'feiyes_manor'    },
      { from: 'feiyes_manor',     to: 'qujiang_pavilion'},
    ],
  },
};
