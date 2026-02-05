export interface Main {
  message: string;
  data: ItemData[];
}
export interface ItemComputed {
  base_price: number;
  addon_price: number;
  taxable_amount: number;
  gst_percentage: number;
  gst_amount: number;
  final_price: number;
}
export interface ItemData {
  itemid: string;
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
  itemname: string;
  item_attributeid: string;
  itemdescription: string;
  minimumpreparationtime: string;
  price: string;
  active: string;
  markup_price: string;
  item_tags: any[];
  item_info: ItemInfo;
  item_image_url: string;

  // existing
  item_tax: Array<{
    id: string;
    name: string;
    tax_percentage: string;
    amount: string;
  }>;
  // "3174,3175"
  tax_inclusive: boolean;
  gst_type: string;

  // ✅ new (expanded from API)
  item_tax_breakup?: ItemTaxBreakup[];
  computed?: ItemComputed;
}

export interface ItemTaxBreakup {
  id: string; // "3174"
  name: string; // "CGST"
  tax_percentage: string; // "2.5"
  amount: string; // "11.25" (for 1 qty price)
}

export interface ItemInfo {
  spice_level: string;
}
