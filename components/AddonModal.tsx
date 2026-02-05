import React, { useState, useMemo } from "react";
import { Icon } from "./Icon";
import { ItemData } from "@/model/menu_list";

/* =========================
   Types
========================= */

interface AddonGroup {
  addon_group_id: string;
  addon_item_selection_min: string;
  addon_item_selection_max: string;
}

type SelectedAddon = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  group_id: string;
};

interface ComputedPricing {
  base_price: number;
  addon_price: number;
  taxable_amount: number;
  gst_percentage: number;
  gst_amount: number;
  final_price: number;
}

export interface EnrichedItemData extends ItemData {
  computed: ComputedPricing;
  selectedVariation?: any;
  selectedAddons?: Record<string, SelectedAddon[]>;
}

interface Props {
  item: ItemData;
  onClose: () => void;
  onConfirm: (item: EnrichedItemData) => void;
}

/* =========================
   Component
========================= */

const AddonModal: React.FC<Props> = ({ item, onClose, onConfirm }) => {
  const [selectedVariation, setSelectedVariation] = useState<any>(
    item.variation?.[0],
  );

  const [selectedAddons, setSelectedAddons] = useState<
    Record<string, SelectedAddon[]>
  >({});

  /* =========================
     Price calculations
  ========================= */

  const basePrice = useMemo(() => {
    const itemPrice = Number(item.price);
    if (itemPrice > 0) return itemPrice;
    return Number(selectedVariation?.price || 0);
  }, [item.price, selectedVariation]);

  const addonPrice = useMemo(() => {
    return (Object.values(selectedAddons) as SelectedAddon[][])
      .flat()
      .reduce((sum, a) => sum + a.price * a.quantity, 0);
  }, [selectedAddons]);

  /**
   * ✅ GST % MUST come from item_tax / tax_breakup
   */
  const gstPercentage = useMemo(() => {
    if (Array.isArray(item.tax_breakup) && item.tax_breakup.length > 0) {
      return item.tax_breakup.reduce(
        (sum, t: any) => sum + Number(t.tax_percentage || t.tax || 0),
        0,
      );
    }

    if (Array.isArray(item.item_tax) && item.item_tax.length > 0) {
      return item.item_tax.reduce(
        (sum, t: any) => sum + Number(t.tax_percentage || t.tax || 0),
        0,
      );
    }

    return 0;
  }, [item.item_tax, item.tax_breakup]);

  const taxableAmount = basePrice + addonPrice;
  const gstAmount = (taxableAmount * gstPercentage) / 100;
  const totalWithGST = taxableAmount + gstAmount;

  /* =========================
     Addon handlers
  ========================= */

  const addAddon = (
    group: AddonGroup,
    addon: { id: string; name: string; price: number },
  ) => {
    setSelectedAddons((prev) => {
      const current = prev[group.addon_group_id] ?? [];
      const count = current.reduce((s, a) => s + a.quantity, 0);

      if (count >= Number(group.addon_item_selection_max)) return prev;

      return {
        ...prev,
        [group.addon_group_id]: [
          ...current,
          {
            id: addon.id,
            name: addon.name,
            price: addon.price,
            quantity: 1,
            group_id: group.addon_group_id,
          },
        ],
      };
    });
  };

  const isValidSelection = useMemo(() => {
    if (!selectedVariation?.addon) return true;

    return selectedVariation.addon.every((g: AddonGroup) => {
      const min = Number(g.addon_item_selection_min);
      const count =
        selectedAddons[g.addon_group_id]?.reduce((s, a) => s + a.quantity, 0) ??
        0;

      return count >= min;
    });
  }, [selectedAddons, selectedVariation]);

  /* =========================
     Render
  ========================= */

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 w-full max-w-lg rounded-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl text-white font-semibold">{item.itemname}</h3>
          <button onClick={onClose}>
            <Icon type="x" className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Variations */}
        {Array.isArray(item.variation) && item.variation.length > 1 && (
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">Choose option</p>

            {item.variation.map((v: any) => (
              <label
                key={v.id}
                className="flex items-center gap-2 text-white mb-1 cursor-pointer"
              >
                <input
                  type="radio"
                  checked={selectedVariation?.id === v.id}
                  onChange={() => {
                    setSelectedVariation(v);
                    setSelectedAddons({});
                  }}
                />
                {v.name} — ₹{v.price}
              </label>
            ))}
          </div>
        )}

        {/* Addons */}
        {Array.isArray(selectedVariation?.addon) &&
          selectedVariation.addon.map((group: AddonGroup) => (
            <div key={group.addon_group_id} className="mb-4">
              <p className="text-sm text-gray-300 mb-1">
                Add-ons (min {group.addon_item_selection_min}, max{" "}
                {group.addon_item_selection_max})
              </p>

              {/* TEMP addon button */}
              <button
                onClick={() =>
                  addAddon(group, {
                    id: "TEMP",
                    name: "Addon",
                    price: 50,
                  })
                }
                className="px-3 py-1 bg-gray-700 text-sm rounded hover:bg-gray-600"
              >
                + Add addon (₹50)
              </button>
            </div>
          ))}

        {/* Price Summary */}
        <div className="mt-4 border-t border-gray-700 pt-4 text-white text-sm space-y-1">
          <p>Base price: ₹{basePrice.toFixed(2)}</p>
          <p>Add-ons: ₹{addonPrice.toFixed(2)}</p>
          <p>
            GST ({gstPercentage}%): ₹{gstAmount.toFixed(2)}
          </p>
          <p className="font-bold text-base">
            Total: ₹{totalWithGST.toFixed(2)}
          </p>
        </div>

        {/* Confirm */}
        <button
          disabled={!isValidSelection}
          onClick={() =>
            onConfirm({
              ...item,

              // ✅ CRITICAL: preserve tax data
              item_tax: item.item_tax,
              tax_breakup: item.tax_breakup,
              gst_liability: item.gst_liability ?? "vendor",
              tax_inclusive: item.tax_inclusive,
              is_tax_inclusive: item.is_tax_inclusive,

              selectedVariation,
              selectedAddons,

              computed: {
                base_price: basePrice,
                addon_price: addonPrice,
                taxable_amount: taxableAmount,
                gst_percentage: gstPercentage,
                gst_amount: gstAmount,
                final_price: totalWithGST,
              },
            })
          }
          className="mt-4 w-full py-2 rounded-md font-semibold bg-[var(--primary-color)] text-white disabled:opacity-50"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default AddonModal;
