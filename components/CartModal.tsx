import React, { useState, useEffect, useMemo, useRef } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Icon } from "./Icon";
import {  DeliveryAddress } from "../types";
import { BASE_URL } from "../src/config";
import {

  applyFlatDiscount,
  apiGetUserValidPoints,
  apiPunchOrder,
  apiBookDelivery,
  apiSaveUserAddress,
  apiCancelOrderOnPaymentFailed,
  apiCheckServiceAvailability,
  apiBookRider,
} from "../services/apiService";

const Spinner: React.FC<{ className?: string }> = ({
  className = "h-5 w-5",
}) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);
type TaxLine = { id: string; name: string; tax_percentage: string; amount?: string | number };

const round2 = (n: number) => Math.round(n * 100) / 100;
const getItemKey = (i: any) => String(i.itemid ?? i.id ?? "");

const computeDiscountAwareTaxes = (
  items: any[],
  calculatedTaxByItemId: Record<string, TaxLine[]>,
  orderDiscount: number
) => {
  const lines = items.map((i) => {
    const key = getItemKey(i);
    const qty = Number(i.quantity || 1);

    const taxArr = (calculatedTaxByItemId[key] || []).map((t) => ({
      id: String(t.id),
      name: String(t.name),
      pct: Number(t.tax_percentage || 0),
    }));

    const totalRate = taxArr.reduce((s, t) => s + t.pct, 0);
    const unitPrice = Number(i.price || 0);

    const isInclusive =
      i.tax_inclusive === true ||
      i.tax_inclusive === "true" ||
      i.is_tax_inclusive === "1" ||
      i.is_tax_inclusive === 1;

    const unitBase =
      isInclusive && totalRate > 0
        ? unitPrice / (1 + totalRate / 100)
        : unitPrice;

    const lineBase = unitBase * qty;

    return { key, lineBase, taxArr };
  });

  const totalBase = lines.reduce((s, l) => s + l.lineBase, 0);
  const discountToApply = Math.min(Number(orderDiscount || 0), totalBase);

  const perItemTax: Record<string, any[]> = {};
  let gstTotal = 0;

  if (totalBase <= 0) return { perItemTax: {}, gstTotal: 0 };

  let distributed = 0;

  lines.forEach((l, idx) => {
    const lineDiscount =
      idx === lines.length - 1
        ? round2(discountToApply - distributed)
        : round2((l.lineBase / totalBase) * discountToApply);

    distributed += lineDiscount;

    const discountedBase = Math.max(0, l.lineBase - lineDiscount);

    const taxes = l.taxArr.map((t) => {
      const amt = (discountedBase * t.pct) / 100;
      gstTotal += amt;
      return {
        id: t.id,
        name: t.name,
        tax_percentage: String(t.pct),
        amount: round2(amt),
      };
    });

    perItemTax[l.key] = taxes;
  });

  return { perItemTax, gstTotal: round2(gstTotal) };
};


const buildTaxSummary = (items: any[], perItemTax: Record<string, any[]>) => {
  const map = new Map<string, any>();

  for (const item of items) {
    const key = getItemKey(item);
    const taxes = perItemTax[key] || [];

    const liability = String(item.gst_liability || "vendor").toLowerCase();

    for (const t of taxes) {
      const id = String(t.id);
      const title = String(t.name);
      const pct = String(t.tax_percentage);

      const groupKey = `${id}|${title}|${pct}|${liability}`;

      const amt = Number(t.amount || 0);

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          id,
          title,
          type: "P",
          price: pct,
          tax: 0,
          restaurant_liable_amt: 0,
        });
      }

      const row = map.get(groupKey);
      row.tax += amt;

      if (liability === "restaurant") {
        row.restaurant_liable_amt += amt;
      }
    }
  }

  return Array.from(map.values()).map((r) => ({
    ...r,
    tax: Number(r.tax).toFixed(2),
    restaurant_liable_amt: Number(r.restaurant_liable_amt).toFixed(2),
  }));
};


interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandId: string;
}
type View = "cart" | "auth" | "address" | "checkout" | "confirmation";
const RESTAURANT_LAT = 12.9716; // example
const RESTAURANT_LNG = 77.5946;

const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose, brandId }) => {
  const [calculatedTaxByItemId, setCalculatedTaxByItemId] = useState<
    Record<string, any[]>
  >({});
  const [calculatedGstTotal, setCalculatedGstTotal] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [gstAfterDiscount, setGstAfterDiscount] = useState(0);
  const {
    items,
    removeItem,
    updateItemQuantity,
    totalPrice,
    clearCart,
    itemCount,
  } = useCart();
  const { isAuthenticated, currentUser, login, register, refreshCurrentUser } =
    useAuth();
  const [view, setView] = useState<View>("cart");
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(0);
  const [availablePoints, setAvailablePoints] = useState(0);

  const [isLoginView, setIsLoginView] = useState(true);
  const [authError, setAuthError] = useState("");
  const [authFormData, setAuthFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  // Address State
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddressData, setNewAddressData] = useState<DeliveryAddress>({
    fullAddress: "",
    flatNo: "",
    landmark: "",
  });
  const [isAddressServiceable, setIsAddressServiceable] = useState(true);
  const [addressError, setAddressError] = useState("");
  const addressInputRef = useRef<HTMLInputElement>(null);

  const [saveNewAddressAsDefault, setSaveNewAddressAsDefault] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);

  const checkIsBangalore = (address: string) => {
    return (
      address.toLowerCase().includes("bangalore") ||
      address.toLowerCase().includes("bengaluru")
    );
  };
  const formatOrderDate = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )}`;
  };
  const normalizeItemTax = (item: any): TaxLine[] => {
    if (Array.isArray(item?.tax_breakup) && item.tax_breakup.length > 0) {
      return item.tax_breakup.map((t: any) => ({
        id: String(t.id),
        name: String(t.name),
        tax_percentage: String(t.tax_percentage ?? t.tax ?? 0),
        amount: t.amount,
      }));
    }

    if (Array.isArray(item?.item_tax) && item.item_tax.length > 0) {
      return item.item_tax.map((t: any) => ({
        id: String(t.id),
        name: String(t.name),
        tax_percentage: String(t.tax_percentage ?? t.tax ?? 0),
        amount: t.amount,
      }));
    }

    if (typeof item?.item_tax === "string") {
      try {
        const parsed = JSON.parse(item.item_tax);
        if (Array.isArray(parsed)) {
          return parsed.map((t: any) => ({
            id: String(t.id),
            name: String(t.name),
            tax_percentage: String(t.tax_percentage ?? t.tax ?? 0),
            amount: t.amount,
          }));
        }
      } catch { }
    }

    return [];
  };


  const formatOrderTime = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
      now.getSeconds()
    )}`;
  };
  const getCurrentDateTime = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");

    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      " " +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes()) +
      ":" +
      pad(d.getSeconds())
    );
  };
  useEffect(() => {
    const taxMap: Record<string, TaxLine[]> = {};
    let total = 0;

    items.forEach((it: any) => {
      const key = getItemKey(it);
      const taxArr = normalizeItemTax(it);

      taxMap[key] = taxArr;

      const qty = Number(it.quantity || 1);
      const perQtyTax = taxArr.reduce((s, t) => s + Number(t?.amount || 0), 0);

      total += perQtyTax * qty;
    });

    setCalculatedTaxByItemId(taxMap);
    setCalculatedGstTotal(Number(total.toFixed(2)));
  }, [items]);


  const hasInclusiveItems = useMemo(() => {
    return items.some((i: any) => {
      return (
        i.tax_inclusive === true ||
        i.tax_inclusive === "true" ||
        i.is_tax_inclusive === "1" ||
        i.is_tax_inclusive === 1
      );
    });
  }, [items]);
  // Google Maps Autocomplete Init
  useEffect(() => {
    if (
      view === "address" &&
      showAddressForm &&
      addressInputRef.current &&
      (window as any).google &&
      (window as any).google.maps &&
      (window as any).google.maps.places
    ) {
      const autocomplete = new (window as any).google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          componentRestrictions: { country: "in" },
          fields: ["formatted_address", "geometry", "address_components"],
        }
      );

      autocomplete.addListener("place_changed", async () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return;

        const dropLat = place.geometry.location.lat();
        const dropLng = place.geometry.location.lng();

        // Save address + coordinates
        setNewAddressData((prev) => ({
          ...prev,
          fullAddress: place.formatted_address,
          coordinates: { lat: dropLat, lng: dropLng },
        }));

        try {
          const serviceResp = await apiCheckServiceAvailability(
            RESTAURANT_LAT,
            RESTAURANT_LNG,
            dropLat,
            dropLng
          );

          // if (!serviceResp.serviceable.locationServiceable) {
          //   setIsAddressServiceable(false);
          //   setAddressError("Delivery not available for this location.");
          //   return;
          // }

          // if (!serviceResp.serviceable.riderServiceable) {
          //   setIsAddressServiceable(false);
          //   setAddressError("No delivery partners available right now.");
          //   return;
          // }

          // ✅ SERVICEABLE
          setIsAddressServiceable(true);
          setAddressError("");

          // ✅ SAVE DELIVERY CHARGE
          setDeliveryCharge(serviceResp.payouts.total);
        } catch {
          setIsAddressServiceable(false);
          setAddressError("Delivery service unavailable.");
        }
      });
    }
  }, [view, showAddressForm]);

  useEffect(() => {
    if (currentUser && isOpen) {
      apiGetUserValidPoints(currentUser.id).then(setAvailablePoints);
    } else if (!currentUser) {
      setAvailablePoints(0);
    }
  }, [currentUser, isOpen]);

  // Initialize address state when entering address view
  useEffect(() => {
    if (view === "address" && currentUser) {
      if (currentUser.addresses && currentUser.addresses.length > 0) {
        setShowAddressForm(false);
        const defaultAddr =
          currentUser.addresses.find((a) => a.isDefault) ||
          currentUser.addresses[0];
        setSelectedAddressId(defaultAddr.id || null);
      } else {
        setShowAddressForm(true);
        setNewAddressData({ fullAddress: "", flatNo: "", landmark: "" });
        setSaveNewAddressAsDefault(true); // Default to true for first address
      }
      setIsAddressServiceable(true);
      setAddressError("");
    }
  }, [view, currentUser]);

  const {
    subtotal,
    discountAmount,
    loyaltyDiscount,
    preTaxTotal,
    gstAmount,
    grandTotal,
  } = useMemo(() => {
    const subtotalCalc = totalPrice;
    const { discountedTotal, discountAmount: flatDiscount } =
      applyFlatDiscount(subtotalCalc);
    const loyaltyDiscountCalc = Math.min(
      loyaltyPointsToRedeem,
      availablePoints,
      Math.floor(discountedTotal)
    );

    const preTaxTotalCalc =
      discountedTotal - loyaltyDiscountCalc > 0
        ? discountedTotal - loyaltyDiscountCalc
        : 0;
    const gstAmountCalc = gstAfterDiscount;
    const grandTotalCalc = hasInclusiveItems
      ? preTaxTotalCalc + deliveryCharge
      : preTaxTotalCalc + gstAmountCalc + deliveryCharge;



    return {
      subtotal: subtotalCalc,
      discountAmount: flatDiscount,
      loyaltyDiscount: loyaltyDiscountCalc,
      preTaxTotal: preTaxTotalCalc,
      gstAmount: gstAmountCalc,
      grandTotal: grandTotalCalc,
    };
  }, [
    items,
    totalPrice,
    loyaltyPointsToRedeem,
    availablePoints,
    deliveryCharge,
    gstAfterDiscount,
    hasInclusiveItems
  ]);
  useEffect(() => {
    const discountForTax =
      Number(discountAmount || 0) + Number(loyaltyDiscount || 0);

    const { gstTotal } = computeDiscountAwareTaxes(
      items,
      calculatedTaxByItemId,
      discountForTax
    );

    setGstAfterDiscount(gstTotal);
  }, [items, calculatedTaxByItemId, discountAmount, loyaltyDiscount]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView("cart");
        setAuthError("");
        setLoyaltyPointsToRedeem(0);
        setNewAddressData({ fullAddress: "", flatNo: "", landmark: "" });
        setIsAddressServiceable(true);
        setAddressError("");
      }, 300);
    }
  }, [isOpen]);

  const handleAuthFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuthFormData({ ...authFormData, [e.target.name]: e.target.value });
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsProcessing(true);
    try {
      if (isLoginView) {
        await login(authFormData.email, authFormData.password);
      } else {
        await register(
          authFormData.name,
          authFormData.email,
          authFormData.phone,
          authFormData.password
        );
      }
      setView("address"); // Move to address after auth
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "An unknown error occurred."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNavigate = (route: string) => {
    onClose();
    window.location.hash = route;
  };

  // Helper to get final address object
  const getFinalDeliveryAddress = (): DeliveryAddress | undefined => {
    if (showAddressForm) return newAddressData;
    return currentUser?.addresses?.find((a) => a.id === selectedAddressId);
  };
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setAuthError("You must be logged in to place an order.");
      setView("auth");
      return;
    }

    const deliveryAddress = getFinalDeliveryAddress();
    if (!deliveryAddress) {
      alert("Please select a delivery address.");
      setView("address");
      return;
    }

    setIsProcessing(true);

    try {
      // ✅ Discount that should reduce taxable value (before tax)
      const discountForTax = Number(discountAmount || 0) + Number(loyaltyDiscount || 0);

      // ✅ Recalculate item taxes AFTER discount
      const { perItemTax, gstTotal } = computeDiscountAwareTaxes(
        items,
        calculatedTaxByItemId,
        discountForTax
      );
      const preTax = Math.max(
        0,
        Number(totalPrice || 0) -
        Number(discountAmount || 0) -
        Number(loyaltyDiscount || 0)
      );

      const finalTotalForPayload = hasInclusiveItems
        ? preTax + Number(deliveryCharge || 0)
        : preTax + Number(gstTotal || 0) + Number(deliveryCharge || 0);


      // ✅ Build PetPooja Tax.details summary (grouped)
      const taxSummary = buildTaxSummary(items, perItemTax);
      // 1) Build PetPooja + backend payload
      const payload = {
        userId: currentUser.id,
        orderinfo: {
          OrderInfo: {
            Restaurant: {
              details: {
                restID: brandId,
              },
            },

            Customer: {
              details: {
                email: currentUser.email,
                name: currentUser.name,
                address: `${deliveryAddress.flatNo}, ${deliveryAddress.fullAddress}`,
                phone: currentUser.phone,
                latitude: deliveryAddress.coordinates?.lat?.toString() ?? "",
                longitude: deliveryAddress.coordinates?.lng?.toString() ?? "",
              },
            },

            Order: {
              details: {
                preorder_date: formatOrderDate(),
                preorder_time: formatOrderTime(),

                service_charge: "0",
                sc_tax_amount: "0",

                delivery_charges: String(deliveryCharge ?? 0),
                dc_tax_percentage: "0",
                dc_tax_amount: "0",
                dc_gst_details: [],

                packing_charges: "0",
                pc_tax_amount: "0",
                pc_tax_percentage: "0",
                pc_gst_details: [],

                order_type: "H",
                advanced_order: "N",
                urgent_order: false,
                urgent_time: 0,

                payment_type: "ONLINE",
                table_no: "",
                no_of_persons: "0",

                discount_total: (
                  Number(discountAmount || 0) + Number(loyaltyDiscount || 0)
                ).toFixed(2),
                discount_type:
                  Number(discountAmount || 0) + Number(loyaltyDiscount || 0) > 0
                    ? "F"
                    : "",

                tax_total: Number(gstTotal || 0).toFixed(2),
                total: Number(finalTotalForPayload || 0).toFixed(2),

                created_on: getCurrentDateTime(),
                enable_delivery: 1,
                callback_url:
                  "https://cherish-rollable-anahi.ngrok-free.dev/api/petpuja/callback",
                collect_cash: "0",
              },
            },

            OrderItem: {
              details: items.map((i: any) => {
                const itemKey = getItemKey(i); // IMPORTANT: same key used in perItemTax

                return {
                  id: String(i.itemid ?? i.id ?? ""),
                  name: String(i.itemname ?? i.name ?? ""),

                  tax_inclusive: i.tax_inclusive,
                  gst_liability: String(i.gst_liability ?? "vendor"),

                  item_tax: (perItemTax[itemKey] || []).map((t: any) => ({
                    id: String(t.id),
                    name: String(t.name),
                    tax_percentage: String(t.tax_percentage),
                    amount: Number(t.amount || 0).toFixed(2),
                  })),

                  item_discount: "0",
                  price: String(i.price ?? "0"),
                  final_price: (
                    Number(i.price || 0) * Number(i.quantity || 1)
                  ).toFixed(2),
                  quantity: String(i.quantity ?? "1"),

                  variation_name: "",
                  variation_id: "",
                  AddonItem: { details: [] },
                };
              }),
            },
          },

          Tax: {
            details: taxSummary,
          },

          udid: "",
          device_type: "Web",
        },
      };


      // 2) Hit backend → create PetPooja order + Razorpay order
      const res = await fetch(
        `${BASE_URL}/payment/create-order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!data.success)
        throw new Error(data.message || "Order creation failed");

      const razorpayOrder = data.razorpayOrder;
      const clientorderID = data.clientorderID;

      // 3) Open Razorpay Checkout
      const rzp = new (window as any).Razorpay({
        key: "rzp_test_RhYbMtl8DSmn8I",
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,

        handler: async (paymentResponse: any) => {
          try {
            const verifyRes = await fetch(
              `${BASE_URL}/payment/verify-payment`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                  razorpay_order_id: paymentResponse.razorpay_order_id,
                  razorpay_signature: paymentResponse.razorpay_signature,
                  clientorderID,

                  // ✅ PASS EVERYTHING NEEDED TO CREATE ORDER
                  orderData: {
                    brandId,
                    userId: currentUser.id,
                    items,
                    customer: {
                      name: currentUser.name,
                      email: currentUser.email,
                      phone: currentUser.phone,
                    },
                    deliveryAddress,
                    subtotal,
                    loyaltyPointsToRedeem: loyaltyDiscount,
                  },
                }),
              }
            );

            const verifyData = await verifyRes.json();

            if (!verifyData.success) {
              alert("Payment verification failed.");
              setIsProcessing(false);
              return;
            }

            setLastOrderId(clientorderID);
            await refreshCurrentUser();
            clearCart();
            setView("confirmation");
            apiBookRider({
              order_id: clientorderID,
              resturent_lat: RESTAURANT_LAT,
              resturent_lang: RESTAURANT_LNG,
              resturent_name: "Bangalir Jhale Jhole",
              resturent_number: "9876543210",
              resturent_address: "Bangalore Anty Address",
              resturent_city: "Bangalore",
            }).catch((err) => {
              console.error("Rider booking failed", err);
            });
            apiBookDelivery(clientorderID);
          } catch (err) {
            alert("Payment succeeded but order creation failed.");
          } finally {
            setIsProcessing(false);
          }
        },

        // 5) Now create order in your DB (your existing logic)
        // const newOrder = await apiCreateOrder(
        //     brandId,
        //     currentUser.id,
        //     items,
        //     {
        //         name: currentUser.name,
        //         email: currentUser.email,
        //         phone: currentUser.phone
        //     },
        //     deliveryAddress,
        //     subtotal,
        //     loyaltyDiscount,
        //     clientorderID
        // );

        // await apiPunchOrder(newOrder);
        // apiBookDelivery(newOrder.id);
        modal: {
          ondismiss: async () => {
            setIsProcessing(false);

            try {
              await apiCancelOrderOnPaymentFailed(
                brandId,
                clientorderID,
                "Payment cancelled by user"
              );
            } catch (err) {
              console.error("Payment-failed cancel error", err);
            }

            alert("Payment cancelled. You can try again.");
          },
        },

        prefill: {
          name: currentUser.name,
          email: currentUser.email,
          contact: currentUser.phone,
        },
        theme: { color: "#05051eff" },
      });

      rzp.open();
      rzp.on("payment.failed", async () => {
        try {
          await apiCancelOrderOnPaymentFailed(
            brandId,
            clientorderID,
            "Payment failed"
          );
        } catch (err) {
          console.error("Payment-failed cancel error", err);
        }

        alert("Payment failed. Please try again.");
        setIsProcessing(false);
      });
    } catch (err: any) {
      alert(err.message || "Payment initiation failed");
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleProceed = () => {
    if (isAuthenticated) {
      setView("address");
    } else {
      setView("auth");
    }
  };
  const checkServiceabilityForAddress = async (address: DeliveryAddress) => {
    if (!address.coordinates) return;

    const { lat, lng } = address.coordinates;

    const serviceResp = await apiCheckServiceAvailability(
      RESTAURANT_LAT,
      RESTAURANT_LNG,
      lat,
      lng
    );

    // ONLY responsibility: set delivery charge
    if (serviceResp?.payouts?.total != null) {
      setDeliveryCharge(Number(serviceResp.payouts.total));
    }
  };

  const handleAddNewAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Final validation check before saving
    const isBangalore = checkIsBangalore(newAddressData.fullAddress);
    if (!isBangalore) {
      setIsAddressServiceable(false);
      setAddressError(
        "Currently, our culinary delights travel exclusively within Bangalore."
      );
      return;
    }

    if (newAddressData.fullAddress) {
      setIsSavingAddress(true);
      try {
        const savedAddress = await apiSaveUserAddress(currentUser.id, {
          ...newAddressData,
          isDefault: saveNewAddressAsDefault,
        });
        await refreshCurrentUser(); // Refresh to get the new address list
        setSelectedAddressId(savedAddress.id || null);
        setShowAddressForm(false);
        setView("checkout");
      } catch (error) {
        console.error("Failed to save address:", error);
        setAddressError("Failed to save address. Please try again.");
      } finally {
        setIsSavingAddress(false);
      }
    }
  };

  if (!isOpen) return null;

  const renderContent = () => {
    switch (view) {
      case "cart":
        return (
          <>
            {items.length === 0 ? (
              <p className="text-gray-400 text-center">Your cart is empty.</p>
            ) : (
              <div className="space-y-4">
                {items.map((item: any) => {
                  const itemKey = getItemKey(item);

                  return (
                    <div key={itemKey} className="flex items-center gap-4">
                      <img
                        src={item.item_image_url}
                        alt={item.itemname}
                        className="w-16 h-16 rounded-md object-cover"
                      />

                      <div className="flex-grow">
                        <p className="font-semibold text-white">{item.itemname}</p>
                        <p className="text-sm text-gray-400">₹{Number(item.price).toFixed(2)}</p>

                        {Array.isArray(calculatedTaxByItemId[itemKey]) &&
                          calculatedTaxByItemId[itemKey].length > 0 && (
                            <p className="text-xs text-gray-500">
                              GST: ₹
                              {(
                                calculatedTaxByItemId[itemKey].reduce(
                                  (s: number, t: any) => s + Number(t?.amount || 0),
                                  0
                                ) * Number(item.quantity || 1)
                              ).toFixed(2)}
                            </p>
                          )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                  onClick={() => updateItemQuantity(item.itemid, item.quantity - 1)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Icon type="minus-circle" className="w-6 h-6" />
                        </button>

                        <span className="font-bold text-white w-5 text-center">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => updateItemQuantity(item.itemid, item.quantity + 1)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Icon type="plus-circle" className="w-6 h-6" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.itemid)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Icon type="trash" className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}

              </div>
            )}
          </>
        );
      case "auth":
        return (
          <form onSubmit={handleAuthSubmit} className="space-y-3">
            <div className="flex rounded-md shadow-sm border border-gray-600">
              <button
                type="button"
                onClick={() => {
                  setIsLoginView(true);
                  setAuthError("");
                }}
                className={`flex-1 p-2 rounded-l-md text-sm ${isLoginView ? "bg-cyan-600 text-white" : "bg-gray-700"
                  }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLoginView(false);
                  setAuthError("");
                }}
                className={`flex-1 p-2 rounded-r-md text-sm ${!isLoginView ? "bg-cyan-600 text-white" : "bg-gray-700"
                  }`}
              >
                Register
              </button>
            </div>

            {authError && (
              <p className="text-red-400 text-xs text-center">{authError}</p>
            )}

            {!isLoginView && (
              <>
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  required
                  value={authFormData.name}
                  onChange={handleAuthFormChange}
                  className="w-full bg-gray-700 p-2 rounded-md border border-gray-600 text-sm"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  required
                  value={authFormData.phone}
                  onChange={handleAuthFormChange}
                  className="w-full bg-gray-700 p-2 rounded-md border border-gray-600 text-sm"
                />
              </>
            )}
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              required
              value={authFormData.email}
              onChange={handleAuthFormChange}
              className="w-full bg-gray-700 p-2 rounded-md border border-gray-600 text-sm"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              value={authFormData.password}
              onChange={handleAuthFormChange}
              className="w-full bg-gray-700 p-2 rounded-md border border-gray-600 text-sm"
            />

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full flex justify-center font-bold py-2 px-4 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-500 transition-colors"
            >
              {isProcessing ? (
                <Spinner />
              ) : isLoginView ? (
                "Login & Continue"
              ) : (
                "Register & Continue"
              )}
            </button>
          </form>
        );
      case "address":
        if (
          !showAddressForm &&
          currentUser?.addresses &&
          currentUser.addresses.length > 0
        ) {
          // LIST VIEW
          return (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-3">
                {currentUser.addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`block p-4 rounded-lg border cursor-pointer transition-all ${selectedAddressId === addr.id
                      ? "border-cyan-500 bg-cyan-900/20"
                      : "border-gray-600 bg-gray-700/50 hover:border-gray-500"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="selectedAddress"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id || null)}
                        className="mt-1 text-cyan-600 focus:ring-cyan-500 border-gray-600 bg-gray-700"
                      />
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <p className="font-semibold text-white">
                            {addr.flatNo}
                          </p>
                          {addr.isDefault && (
                            <span className="bg-cyan-900/50 text-cyan-300 text-xs px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-300 mt-1">
                          {addr.fullAddress}
                        </p>
                        {addr.landmark && (
                          <p className="text-xs text-gray-400 mt-1">
                            Landmark: {addr.landmark}
                          </p>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowAddressForm(true);
                  setNewAddressData({
                    fullAddress: "",
                    flatNo: "",
                    landmark: "",
                  });
                }}
                className="w-full py-3 border-2 border-dashed border-gray-600 text-gray-400 rounded-lg font-semibold hover:border-cyan-500 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2"
              >
                <Icon type="plus-circle" className="w-5 h-5" /> Add New Address
              </button>
              <button
                disabled={!selectedAddressId || isProcessing}
                onClick={async () => {
                  if (!selectedAddressId || !currentUser) return;

                  const selectedAddress = currentUser.addresses?.find(
                    (a) => a.id === selectedAddressId
                  );

                  setIsProcessing(true);

                  try {
                    if (selectedAddress) {
                      await checkServiceabilityForAddress(selectedAddress);
                    }
                    setView("checkout");
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                className="w-full font-bold py-3 px-4 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors mt-4 flex justify-center items-center"
              >
                {isProcessing ? <Spinner /> : "Proceed with Selected Address"}
              </button>
            </div>
          );
        } else {
          // FORM VIEW
          return (
            <form
              onSubmit={handleAddNewAddressSubmit}
              className="space-y-4 animate-fade-in"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Delivery Location
                </label>
                <div className="relative">
                  <Icon
                    type="map-pin"
                    className="absolute left-3 top-3 w-5 h-5 text-gray-400"
                  />
                  <input
                    ref={addressInputRef}
                    type="text"
                    placeholder="Search for your area or landmark..."
                    required
                    value={newAddressData.fullAddress}
                    onChange={(e) => {
                      const newVal = e.target.value;
                      setNewAddressData({
                        ...newAddressData,
                        fullAddress: newVal,
                      });
                      // Re-validate Serviceability on manual typing
                      const isBangalore = checkIsBangalore(newVal);
                      setIsAddressServiceable(isBangalore);
                      if (!isBangalore && newVal.length > 5) {
                        setAddressError(
                          "Currently, our culinary delights travel exclusively within Bangalore."
                        );
                      } else {
                        setAddressError("");
                      }
                    }}
                    className={`w-full bg-gray-700 p-3 pl-10 rounded-md border ${!isAddressServiceable
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-600 focus:ring-cyan-500"
                      } focus:ring-2 focus:outline-none text-white`}
                  />
                </div>
                {!isAddressServiceable && (
                  <div className="mt-3 p-3 bg-red-900/30 border border-red-800 rounded-md flex items-start gap-3 animate-fade-in">
                    <Icon
                      type="map-pin"
                      className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5"
                    />
                    <p className="text-sm text-red-200">{addressError}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Flat / House / Block No.
                </label>
                <input
                  type="text"
                  placeholder="e.g., Flat 402, Sunshine Apartments"
                  required
                  value={newAddressData.flatNo}
                  onChange={(e) =>
                    setNewAddressData({
                      ...newAddressData,
                      flatNo: e.target.value,
                    })
                  }
                  className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Near City Hospital"
                  value={newAddressData.landmark}
                  onChange={(e) =>
                    setNewAddressData({
                      ...newAddressData,
                      landmark: e.target.value,
                    })
                  }
                  className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white"
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="saveAsDefault"
                  checked={saveNewAddressAsDefault}
                  onChange={(e) => setSaveNewAddressAsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-cyan-600 focus:ring-cyan-600"
                />
                <label
                  htmlFor="saveAsDefault"
                  className="text-sm text-gray-300 cursor-pointer"
                >
                  Save as default address
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                {currentUser?.addresses && currentUser.addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="flex-1 py-3 font-semibold text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={
                    !isAddressServiceable ||
                    !newAddressData.fullAddress ||
                    !newAddressData.flatNo ||
                    isSavingAddress
                  }
                  className="flex-1 font-bold py-3 px-4 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex justify-center items-center"
                >
                  {isSavingAddress ? <Spinner /> : "Save & Proceed"}
                </button>
              </div>
            </form>
          );
        }

      case "checkout":
        const finalAddress = getFinalDeliveryAddress();
        return (
          <form onSubmit={handlePlaceOrder}>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <h3 className="text-lg font-semibold text-white">
                  Delivery To
                </h3>
                <button
                  type="button"
                  onClick={() => setView("address")}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  Change
                </button>
              </div>
              <div className="bg-gray-700/50 p-3 rounded-md text-sm text-gray-300">
                <p className="font-semibold text-white">{currentUser?.name}</p>
                <p>
                  {finalAddress?.flatNo}, {finalAddress?.fullAddress}
                </p>
                {finalAddress?.landmark && (
                  <p className="text-gray-400">
                    Landmark: {finalAddress.landmark}
                  </p>
                )}
                <p className="mt-1">Ph: {currentUser?.phone}</p>
              </div>

              {isAuthenticated && availablePoints > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-lg font-semibold text-white">
                    Redeem Loyalty Points
                  </h3>
                  <div className="bg-gray-700/50 p-3 rounded-md text-sm">
                    <p>
                      Available Points:{" "}
                      <span className="font-bold">{availablePoints}</span>
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <input
                        type="range"
                        min="0"
                        max={Math.floor(
                          Math.min(
                            availablePoints,
                            preTaxTotal + loyaltyDiscount
                          )
                        )}
                        value={loyaltyPointsToRedeem}
                        onChange={(e) =>
                          setLoyaltyPointsToRedeem(Number(e.target.value))
                        }
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="font-bold text-cyan-400 w-12 text-center">
                        {loyaltyPointsToRedeem}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      1 point = ₹1 discount.
                    </p>
                  </div>
                </div>
              )}

              {/* <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2 pt-4">Payment Method</h3> */}
              {/* <div className="flex rounded-md shadow-sm">
                                <button type="button" onClick={() => setPaymentMethod('card')} className={`flex-1 p-3 rounded-l-md ${paymentMethod === 'card' ? 'bg-[var(--primary-color)] text-white' : 'bg-gray-700'}`}>Card</button>
                                <button type="button" onClick={() => setPaymentMethod('upi')} className={`flex-1 p-3 rounded-r-md ${paymentMethod === 'upi' ? 'bg-[var(--primary-color)] text-white' : 'bg-gray-700'}`}>UPI</button>
                            </div>
                             */}
              {/* {paymentMethod === 'card' && <div className="space-y-3 p-4 bg-gray-700/50 rounded-md">
                                <input type="text" placeholder="Card Number (e.g., 1234 5678 9012 3456)" required className="w-full bg-gray-700 p-2 rounded-md border border-gray-600"/>
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" placeholder="MM / YY" required className="w-full bg-gray-700 p-2 rounded-md border border-gray-600"/>
                                    <input type="text" placeholder="CVV" required className="w-full bg-gray-700 p-2 rounded-md border border-gray-600"/>
                                </div>
                            </div>} */}
              {paymentMethod === "upi" && (
                <div className="p-4 bg-gray-700/50 rounded-md">
                  <input
                    type="text"
                    placeholder="UPI ID (e.g., yourname@bank)"
                    required
                    className="w-full bg-gray-700 p-2 rounded-md border border-gray-600"
                  />
                </div>
              )}
            </div>
          </form>
        );
      case "confirmation":
        return (
          <div className="text-center">
            <Icon
              type="check-circle"
              className="w-16 h-16 text-green-400 mx-auto mb-4"
            />
            <h3 className="text-2xl font-bold text-white">
              Thank you for your order!
            </h3>
            <p className="text-gray-300 mt-2">
              Your order has been received and is now being prepared.
            </p>
            <div className="bg-gray-900/50 p-3 rounded-md text-center mt-6 border border-gray-700">
              <p className="text-sm text-gray-300">Your Order ID:</p>
              <p className="text-lg font-mono font-bold text-white tracking-wider my-1">
                {lastOrderId}
              </p>
              <p className="text-xs text-gray-400">
                You can{" "}
                <button
                  onClick={() =>
                    handleNavigate(`order-status?id=${lastOrderId}`)
                  }
                  className="font-semibold text-cyan-400 hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  track your order status here
                </button>
                .
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[100] animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-serif text-white">
            {view === "cart" && `Your Cart (${itemCount})`}
            {view === "auth" && "Login or Register"}
            {view === "address" &&
              (showAddressForm ? "Add New Address" : "Select Address")}
            {view === "checkout" && "Checkout"}
            {view === "confirmation" && "Order Confirmed!"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
          >
            &times;
          </button>
        </header>

        <main className="p-6 overflow-y-auto">{renderContent()}</main>

        {itemCount > 0 && view !== "confirmation" && view !== "address" && (
          <footer className="p-4 border-t border-gray-700 bg-gray-900/50">
            <div className="space-y-1 text-sm mb-4">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Flat Discount</span>
                  <span className="font-semibold">
                    - ₹{discountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-yellow-400">
                  <span>Loyalty Points Redeemed</span>
                  <span className="font-semibold">
                    - ₹{loyaltyDiscount.toFixed(2)}
                  </span>
                </div>
              )}

              {(discountAmount > 0 || loyaltyDiscount > 0) && (
                <div className="flex justify-between text-gray-300 font-semibold pt-1 border-t border-gray-700/50">
                  <span>Total Before Tax</span>
                  <span>₹{preTaxTotal.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-300">
                <span>GST </span>
                <span>+ ₹{gstAfterDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Delivery Charges</span>
                <span>₹{deliveryCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-lg border-t border-gray-700 pt-2 mt-2">
                <span>Grand Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
            {view === "cart" && (
              <button
                onClick={handleProceed}
                className="w-full bg-[var(--primary-color)] text-[var(--text-on-primary-color)] font-bold py-3 rounded-md"
              >
                Proceed
              </button>
            )}
            {
              view === "auth" &&
              null /* Auth view has its own submit button in form */
            }
            {view === "checkout" && (
              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-[var(--primary-color)] text-[var(--text-on-primary-color)] font-bold py-3 rounded-md disabled:bg-gray-500"
              >
                {isProcessing ? (
                  <Spinner />
                ) : (
                  `Proceed to Pay ₹${grandTotal.toFixed(2)}`
                )}
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  );
};

export default CartModal;
