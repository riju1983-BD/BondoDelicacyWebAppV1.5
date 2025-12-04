export const backendToFrontendStatus = new Map<string, string>([
  ['ACCEPTED', 'Accepted'],
  ['FOOD_READY', 'Food Ready'],
  ['DISPATCHED', 'Out For Delivery'],
  ['DELIVERED', 'Delivered'],
  ['CANCELLED', 'Cancelled'],
]);

export const normalizeOrderStatus = (backendStatus: string): string =>
  backendToFrontendStatus.get(backendStatus) || backendStatus;
