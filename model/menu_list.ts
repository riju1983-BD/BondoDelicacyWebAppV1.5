export interface Main {
  message: string;
  data: ItemData[];
}
// model/menu_list.ts

export interface AddonItemDetail {
  id: string;
  name: string;
  price: number;
  rank: string;
  active: string;
  attributes?: string;
}

export interface AddonGroup {
  addon_group_id: string;
  addon_group_name: string;
  addon_group_rank: string;
  selection_min: number;
  selection_max: number;
  active: string;
  items: AddonItemDetail[];
}

export interface SelectedAddon {
  id: string;
  name: string;
  price: number;
  quantity: number;
  group_id: string;
  group_name: string;
}

export interface ItemData {
  itemid: string;
  itemname: string;
  itemallowvariation: string;
  itemrank: string;
  item_categoryid: string;
  item_ordertype: string;
  item_packingcharges: string;
  itemallowaddon: string;
  itemaddonbasedon: string;
  item_favorite: string;
  ignore_taxes: string;
  ignore_discounts: string;
  in_stock: string;
  cuisine: any[];
  variation_groupname: string;
  is_combo: string;
  
  variation: {
    id: string;
    name: string;
    price: string;
    active: string;
    variationid: string;
    variationrank: string;
    variationallowaddon: number;
    item_packingcharges: string;
    groupname: string;
    addon?: {
      addon_group_id: string;
      addon_item_selection_min: string;
      addon_item_selection_max: string;
    }[];
  }[];

  addon: any[];
  is_recommend: string;
  item_attributeid: string;
  itemdescription: string;
  minimumpreparationtime: string;
  price: string;
  active: string;
  markup_price: string;
  item_tags: any[];
  item_info: ItemInfo;
  item_image_url: string;

  // Tax fields
  item_tax: string; // "3174,3175"
  tax_breakup?: Array<{
    id: string;
    name: string;
    tax_percentage: string;
    amount: string;
  }>;
  tax_inclusive: boolean;
  gst_type: string;

  // ✅ NEW: Expanded addons from backend
  addons?: AddonGroup[];

  // ✅ Computed fields (set by AddonModal)
  computed?: ItemComputed;
  selectedVariation?: any;
  selectedAddons?: Record<string, SelectedAddon[]>;
}

export interface ItemComputed {
  base_price: number;
  addon_price: number;
  taxable_amount: number;
  gst_percentage: number;
  gst_amount: number;
  final_price: number;
}

export interface ItemInfo {
  spice_level: string;
}