import React, { useState, useMemo } from "react";
import { Icon } from "./Icon";
import { ItemData } from "@/model/menu_list";

interface AddonGroup {
  addon_group_id: string;
  addon_item_selection_min: string;
  addon_item_selection_max: string;
}

interface Props {
  item: ItemData;
  onClose: () => void;
  onConfirm: (item: ItemData) => void;
}

const AddonModal: React.FC<Props> = ({ item, onClose, onConfirm }) => {
  // default to first variation
  const [selectedVariation, setSelectedVariation] = useState<any>(
    item.variation?.[0],
  );

  /**
   * selectedAddons:
   * key   -> addon_group_id
   * value -> total addon price selected for that group
   */
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>(
    {},
  );

  /* -----------------------------
   * Price calculations (SAFE)
   * ----------------------------- */

  const basePrice =
    Number(item.price) > 0
      ? Number(item.price)
      : Number(selectedVariation?.price || 0);

  const addonPrice = useMemo(() => {
    return Object.values(selectedAddons).reduce<number>(
      (sum, value) => sum + Number(value),
      0,
    );
  }, [selectedAddons]);

  const subtotal = basePrice + addonPrice;

  const gstPercentage = Number(item.gst_total_percentage ?? 0);

  const taxableAmount = basePrice + addonPrice;

  const gstAmount = (taxableAmount * gstPercentage) / 100;

  const totalWithGST = taxableAmount + gstAmount;

  /* -----------------------------
   * Addon selection handler
   * ----------------------------- */

  const addAddon = (group: AddonGroup, addonUnitPrice: number) => {
    const groupId = group.addon_group_id;
    const min = Number(group.addon_item_selection_min);
    const max = Number(group.addon_item_selection_max);

    setSelectedAddons((prev) => {
      const current = prev[groupId] ?? 0;

      if (current / addonUnitPrice >= max) {
        return prev; // max reached
      }

      return {
        ...prev,
        [groupId]: current + addonUnitPrice,
      };
    });
  };

  const isValidSelection = useMemo(() => {
    if (!selectedVariation?.addon) return true;

    return selectedVariation.addon.every((g: AddonGroup) => {
      const min = Number(g.addon_item_selection_min);
      const selectedValue = selectedAddons[g.addon_group_id] ?? 0;

      return selectedValue > 0 || min === 0;
    });
  }, [selectedAddons, selectedVariation]);

  /* -----------------------------
   * Render
   * ----------------------------- */

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
                  onChange={() => setSelectedVariation(v)}
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

              {/* NOTE:
                 Replace 50 with REAL addon price once
                 you wire addon menu items.
              */}
              <button
                onClick={() => addAddon(group, 50)}
                className="px-3 py-1 bg-gray-700 text-sm rounded hover:bg-gray-600"
              >
                + Add addon (₹50)
              </button>
            </div>
          ))}

        {/* Price Summary */}
        <div className="mt-4 border-t border-gray-700 pt-4 text-white text-sm space-y-1">
          <p>Base price: ₹{basePrice}</p>
          <p>Add-ons: ₹{addonPrice}</p>
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
