import axios from 'axios';
import { BaseAdapter } from './BaseAdapter.js';

const BASE = 'https://api.grizzlysms.com/stubs/handler_api.php';
const KEY  = process.env.GRIZZLYSMS_API_KEY;

const SERVICE_MAP = {
  telegram:  'tg',
  whatsapp:  'wa',
  google:    'go',
  facebook:  'fb',
  instagram: 'ig',
  twitter:   'tw',
  tiktok:    'tik',
  discord:   'ds',
  uber:      'ub',
  amazon:    'amzn',
  netflix:   'nf',
  snapchat:  'sc',
  tinder:    'tinder',
  linkedin:  'li',
  steam:     'st',
  paypal:    'pp',
};

export class GatewayF extends BaseAdapter {
  constructor() {
    super('GatewayF');
  }

  mapService(service) {
    return SERVICE_MAP[service.toLowerCase()] ?? service.toLowerCase();
  }

  async fetchNumber(service, country) {
    try {
      const params = new URLSearchParams({
        api_key:  KEY,
        action:   'getNumber',
        service:  this.mapService(service),
        country:  country || '0',
      });
      const res  = await axios.get(`${BASE}?${params}`);
      const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
      // Same format as SMS-Activate: "ACCESS_NUMBER:orderId:phoneNumber"
      if (text.startsWith('ACCESS_NUMBER')) {
        const [, orderId, phone] = text.split(':');
        return { orderId: orderId.trim(), phone: phone.trim() };
      }
      throw new Error(`GrizzlySMS rejected: ${text}`);
    } catch (err) {
      throw new Error(`GatewayF fetchNumber failed: ${err.message}`);
    }
  }

  async checkSMS(orderId) {
    try {
      const params = new URLSearchParams({ api_key: KEY, action: 'getStatus', id: orderId });
      const res  = await axios.get(`${BASE}?${params}`);
      const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
      if (text.startsWith('STATUS_OK')) {
        const code = text.split(':')[1]?.trim() ?? null;
        return { status: 'RECEIVED', code };
      }
      if (text === 'STATUS_CANCEL') return { status: 'EXPIRED', code: null };
      return { status: 'PENDING', code: null };
    } catch (err) {
      throw new Error(`GatewayF checkSMS failed: ${err.message}`);
    }
  }

  async cancelOrder(orderId) {
    try {
      const params = new URLSearchParams({ api_key: KEY, action: 'setStatus', id: orderId, status: '8' });
      await axios.get(`${BASE}?${params}`);
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  }
}
