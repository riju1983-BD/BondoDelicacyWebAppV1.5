// src/utils/orderStatus.ts

export const backendToFrontendStatus = new Map<string, string>([
  ['RECEIVED', 'Order Placed'],
  // ['PENDING', 'Order Placed'],
  ['ACCEPTED', 'Accepted'],
  ['FOOD_READY', 'Food Ready'],
  ['DISPATCHED', 'Out For Delivery'],
  ['DELIVERED', 'Delivered'],
  ['CANCELLED', 'Cancelled'],
  ['REFUNDED', 'Refunded'],
]);

export const normalizeOrderStatus = (backendStatus?: string): string => {
  const normalizedKey = (backendStatus || '').trim().toUpperCase();
  return backendToFrontendStatus.get(normalizedKey) || backendStatus || '';
};