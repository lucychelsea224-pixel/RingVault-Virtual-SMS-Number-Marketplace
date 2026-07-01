/**
 * BaseAdapter — every gateway adapter extends this.
 * All adapters must implement: fetchNumber(), checkSMS(), cancelOrder()
 * All methods must return the unified response format below.
 *
 * Unified fetchNumber response:
 *   { orderId: string, phone: string }
 *
 * Unified checkSMS response:
 *   { status: 'PENDING' | 'RECEIVED' | 'EXPIRED', code: string | null }
 *
 * Unified cancelOrder response:
 *   { success: boolean }
 */
export class BaseAdapter {
  constructor(name) {
    this.name = name;
  }

  // Service name normalizer — maps internal names to provider-specific names
  // Override in each adapter
  mapService(service) {
    return service;
  }

  async fetchNumber(service, country) {
    throw new Error(`${this.name}: fetchNumber() not implemented`);
  }

  async checkSMS(orderId) {
    throw new Error(`${this.name}: checkSMS() not implemented`);
  }

  async cancelOrder(orderId) {
    throw new Error(`${this.name}: cancelOrder() not implemented`);
  }
}
