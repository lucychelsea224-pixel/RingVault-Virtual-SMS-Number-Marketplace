import axios from 'axios';
import { BaseAdapter } from './BaseAdapter.js';

const BASE = 'https://juicysms.com/api';
const KEY  = process.env.JUICYSMS_API_KEY;

const SERVICE_MAP = {
  telegram:  'TG',
  whatsapp:  'WA',
  google:    'GO',
  facebook:  'FB',
  instagram: 'IN',
  twitter:   'TW',
  tiktok:    'TT',
  discord:   'DC',
  uber:      'UB',
  amazon:    'AM',
  netflix:   'NF',
  snapchat:  'SC',
  tinder:    'TI',
  linkedin:  'LI',
  steam:     'ST',
  paypal:    'PP',
};

export class GatewayA extends BaseAdapter {
  constructor() {
    super('GatewayA');
  }

  mapService(service) {
    return SERVICE_MAP[service.toLowerCase()] ?? service.toUpperCase();
  }

  async fetchNumber(service, country) {
    try {
      const params = new URLSearchParams({
        apikey: KEY,
        action: 'getNumber',
        service: this.mapService(service),
        country: country || 'US',
      });
      const res = await axios.get(`${BASE}/makeOrder?${params}`);
      // Response format: "ACCESS_NUMBER:orderId:phoneNumber"
      const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
      if (text.startsWith('ACCESS_NUMBER')) {
        const [, orderId, phone] = text.split(':');
        return { orderId: orderId.trim(), phone: phone.trim() };
      }
      throw new Error(`JuicySMS rejected: ${text}`);
    } catch (err) {
      throw new Error(`GatewayA fetchNumber failed: ${err.message}`);
    }
  }

  async checkSMS(orderId) {
    try {
      const params = new URLSearchParams({ apikey: KEY, action: 'getStatus', id: orderId });
      const res = await axios.get(`${BASE}/getOrder?${params}`);
      const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
      if (text.startsWith('STATUS_OK')) {
        const code = text.split(':')[1]?.trim() ?? null;
        return { status: 'RECEIVED', code };
      }
      if (text === 'STATUS_WAIT_CODE') return { status: 'PENDING', code: null };
      if (text === 'STATUS_CANCEL')    return { status: 'EXPIRED', code: null };
      return { status: 'PENDING', code: null };
    } catch (err) {
      throw new Error(`GatewayA checkSMS failed: ${err.message}`);
    }
  }

  async cancelOrder(orderId) {
    try {
      const params = new URLSearchParams({ apikey: KEY, action: 'cancelOrder', id: orderId });
      await axios.get(`${BASE}/cancelOrder?${params}`);
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  }
}
