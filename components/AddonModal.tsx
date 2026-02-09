// components/AddonModal.tsx

import React, { useState, useMemo } from "react";
import { Icon } from "./Icon";

// ✅ SEPARATE TYPE IMPORTS
import type {
  ItemData,
  AddonGroup,
  SelectedAddon,
  ItemComputed,
  AddonItemDetail,
} from "@/model/menu_list";

export interface EnrichedItemData extends ItemData {
  computed: ItemComputed;
  selectedVariation?: any;
  selectedAddons?: Record<string, SelectedAddon[]>;
}

interface Props {
  item: ItemData;
  onClose: () => void;
  onConfirm: (item: EnrichedItemData) => void;
}

const AddonModal: React.FC<Props> = ({ item, onClose, onConfirm }) => {
  const [selectedVariation, setSelectedVariation] = useState<any>(
    Array.isArray(item.variation) && item.variation.length > 0
      ? item.variation[0]
      : null,
  );

  // ✅ THIS SHOULD NOW WORK
  const [selectedAddons, setSelectedAddons] = useState<
    Record<string, SelectedAddon[]>
  >({});

  const currentAddonGroups = useMemo<AddonGroup[]>(() => {
    if (Array.isArray(item.addons) && item.addons.length > 0) {
      return item.addons;
    }

    if (!selectedVariation?.addon || !Array.isArray(item.addons)) {
      return [];
    }

    const addonGroupIds = selectedVariation.addon.map(
      (ref: any) => ref.addon_group_id,
    );

    return item.addons.filter((group) =>
      addonGroupIds.includes(group.addon_group_id),
    );
  }, [item.addons, selectedVariation]);

  const basePrice = useMemo<number>(() => {
    const itemPrice = Number(item.price || 0);
    const variationPrice = Number(selectedVariation?.price || 0);
    if (itemPrice > 0) return itemPrice;
    return variationPrice;
  }, [item.price, selectedVariation]);

  const addonPrice = useMemo<number>(() => {
    let total = 0;

    const groups = Object.keys(selectedAddons);
    for (const groupId of groups) {
      const addonsInGroup = selectedAddons[groupId];
      if (addonsInGroup) {
        for (const addon of addonsInGroup) {
          const price = Number(addon.price);
          const quantity = Number(addon.quantity);
          total = total + price * quantity;
        }
      }
    }

    return total;
  }, [selectedAddons]);

  const gstPercentage = useMemo<number>(() => {
    if (Array.isArray(item.tax_breakup) && item.tax_breakup.length > 0) {
      let total = 0;
      for (const t of item.tax_breakup) {
        total = total + Number(t.tax_percentage || 0);
      }
      return total;
    }
    return 0;
  }, [item.tax_breakup]);

  const taxableAmount = basePrice + addonPrice;
  const gstAmount = (taxableAmount * gstPercentage) / 100;
  const totalWithGST = taxableAmount + gstAmount;

  const addAddon = (group: AddonGroup, addonItem: AddonItemDetail): void => {
    setSelectedAddons((prev) => {
      const current = prev[group.addon_group_id] || [];

      let totalQty = 0;
      for (const a of current) {
        totalQty = totalQty + Number(a.quantity);
      }

      const maxAllowed = Number(group.selection_max);
      if (totalQty >= maxAllowed) {
        return prev;
      }

      const existingIndex = current.findIndex((a) => a.id === addonItem.id);

      if (existingIndex >= 0) {
        const updated = [...current];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return { ...prev, [group.addon_group_id]: updated };
      } else {
        const newAddonObj = {
          id: addonItem.id,
          name: addonItem.name,
          price: Number(addonItem.price),
          quantity: 1,
          group_id: group.addon_group_id,
          group_name: group.addon_group_name,
        };
        return {
          ...prev,
          [group.addon_group_id]: [...current, newAddonObj],
        };
      }
    });
  };

  const removeAddon = (groupId: string, addonId: string): void => {
    setSelectedAddons((prev) => {
      const current = prev[groupId] || [];
      const existingIndex = current.findIndex((a) => a.id === addonId);

      if (existingIndex < 0) return prev;

      const updated = [...current];
      const currentQty = Number(updated[existingIndex].quantity);

      if (currentQty > 1) {
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: currentQty - 1,
        };
      } else {
        updated.splice(existingIndex, 1);
      }

      return { ...prev, [groupId]: updated };
    });
  };

  const getAddonQuantity = (groupId: string, addonId: string): number => {
    const group = selectedAddons[groupId] || [];
    const addon = group.find((a) => a.id === addonId);
    return Number(addon?.quantity || 0);
  };

  const isValidSelection = useMemo<boolean>(() => {
    for (const group of currentAddonGroups) {
      const groupAddons = selectedAddons[group.addon_group_id] || [];

      let count = 0;
      for (const a of groupAddons) {
        count = count + Number(a.quantity);
      }

      const minRequired = Number(group.selection_min);
      const maxAllowed = Number(group.selection_max);

      if (count < minRequired || count > maxAllowed) {
        return false;
      }
    }
    return true;
  }, [selectedAddons, currentAddonGroups]);

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 w-full max-w-lg rounded-lg p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-900 pb-2 border-b border-gray-700">
          <h3 className="text-xl text-white font-semibold">{item.itemname}</h3>
          <button onClick={onClose}>
            <Icon type="x" className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {Array.isArray(item.variation) && item.variation.length > 1 && (
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-3 font-semibold">
              Choose Size/Option
            </p>
            <div className="space-y-2">
              {item.variation.map((v) => (
                <label
                  key={v.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedVariation?.id === v.id
                      ? "border-[var(--primary-color)] bg-[var(--primary-color)]/10"
                      : "border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="variation"
                    checked={selectedVariation?.id === v.id}
                    onChange={() => {
                      setSelectedVariation(v);
                      setSelectedAddons({});
                    }}
                    className="text-[var(--primary-color)]"
                  />
                  <span className="flex-1 text-white">{v.name}</span>
                  <span className="text-[var(--accent-color)] font-semibold">
                    ₹{v.price}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {currentAddonGroups.map((group) => {
          const groupAddons = selectedAddons[group.addon_group_id] || [];
          let currentCount = 0;
          for (const a of groupAddons) {
            currentCount = currentCount + Number(a.quantity);
          }

          return (
            <div key={group.addon_group_id} className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm text-gray-300 font-semibold">
                  {group.addon_group_name}
                </p>
                <span className="text-xs text-gray-500">
                  {Number(group.selection_min) === Number(group.selection_max)
                    ? `Select ${group.selection_min}`
                    : `Min ${group.selection_min}, Max ${group.selection_max}`}
                  {" • "}
                  <span
                    className={
                      currentCount >= Number(group.selection_min)
                        ? "text-green-400"
                        : "text-yellow-400"
                    }
                  >
                    {currentCount} selected
                  </span>
                </span>
              </div>

              <div className="space-y-2">
                {group.items.map((addonItem) => {
                  const qty = getAddonQuantity(
                    group.addon_group_id,
                    addonItem.id,
                  );

                  return (
                    <div
                      key={addonItem.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        qty > 0
                          ? "border-[var(--primary-color)] bg-[var(--primary-color)]/10"
                          : "border-gray-700"
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-white text-sm">{addonItem.name}</p>
                        <p className="text-xs text-gray-400">
                          ₹{addonItem.price}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {qty > 0 && (
                          <>
                            <button
                              onClick={() =>
                                removeAddon(group.addon_group_id, addonItem.id)
                              }
                              className="text-red-400 hover:text-red-300"
                            >
                              <Icon type="minus-circle" className="w-5 h-5" />
                            </button>
                            <span className="text-white font-semibold w-6 text-center">
                              {qty}
                            </span>
                          </>
                        )}
                        <button
                          onClick={() => addAddon(group, addonItem)}
                          disabled={currentCount >= Number(group.selection_max)}
                          className="text-green-400 hover:text-green-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Icon type="plus-circle" className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="mt-6 border-t border-gray-700 pt-4 space-y-2 bg-gray-800/50 p-4 rounded-lg">
          <div className="flex justify-between text-sm text-gray-300">
            <span>Base price</span>
            <span>₹{basePrice.toFixed(2)}</span>
          </div>
          {addonPrice > 0 && (
            <div className="flex justify-between text-sm text-gray-300">
              <span>Add-ons</span>
              <span>₹{addonPrice.toFixed(2)}</span>
            </div>
          )}
          {gstPercentage > 0 && (
            <div className="flex justify-between text-sm text-gray-300">
              <span>GST ({gstPercentage}%)</span>
              <span>₹{gstAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-white border-t border-gray-700 pt-2">
            <span>Total</span>
            <span className="text-[var(--accent-color)]">
              ₹{totalWithGST.toFixed(2)}
            </span>
          </div>
        </div>

        {!isValidSelection && (
          <p className="text-red-400 text-xs mt-2 text-center">
            Please meet the minimum selection requirements for all add-on groups
          </p>
        )}

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
          className="mt-4 w-full py-3 rounded-md font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: isValidSelection
              ? "var(--primary-color)"
              : "#4b5563",
            color: "white",
          }}
        >
          Add to Cart - ₹{totalWithGST.toFixed(2)}
        </button>
      </div>
    </div>
  );
};

export default AddonModal;
