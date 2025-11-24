export interface Main {
  message: string
  data: ItemData[]
}

export interface ItemData {
  itemid: string
  itemallowvariation: string
  itemrank: string
  item_categoryid: string
  item_ordertype: string
  item_packingcharges: string
  itemallowaddon: string
  itemaddonbasedon: string
  item_favorite: string
  ignore_taxes: string
  ignore_discounts: string
  in_stock: string
  cuisine: any[]
  variation_groupname: string
  is_combo: string
  variation: any[]
  addon: any[]
  is_recommend: string
  itemname: string
  item_attributeid: string
  itemdescription: string
  minimumpreparationtime: string
  price: string
  active: string
  markup_price: string
  item_tags: any[]
  item_info: ItemInfo
  item_image_url: string
  item_tax: string
  tax_inclusive: boolean
  gst_type: string
}

export interface ItemInfo {
  spice_level: string
}