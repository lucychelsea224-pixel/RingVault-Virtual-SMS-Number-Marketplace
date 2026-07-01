import axios from 'axios';
import { BaseAdapter } from './BaseAdapter.js';

const BASE = 'https://api.sms-activate.org/stubs/handler_api.php';
const KEY  = process.env.SMSACTIVATE_API_KEY;

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

export class GatewayB extends BaseAdapter {
  constructor() {
    super('GatewayB');
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
        country:  country || '0', // 0 = any country on SMS-Activate
      });
      const res  = await axios.get(`${BASE}?${params}`);
      const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
      // Response format: "ACCESS_NUMBER:orderId:phoneNumber"
      if (text.startsWith('ACCESS_NUMBER')) {
        const [, orderId, phone] = text.split(':');
        return { orderId: orderId.trim(), phone: phone.trim() };
      }
      throw new Error(`SMS-Activate rejected: ${text}`);
    } catch (err) {
      throw new Error(`GatewayB fetchNumber failed: ${err.message}`);
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
      if (text === 'STATUS_WAIT_CODE') return { status: 'PENDING', code: null };
      if (text === 'STATUS_CANCEL' || text === 'STATUS_WAIT_RETRY') return { status: 'EXPIRED', code: null };
      return { status: 'PENDING', code: null };
    } catch (err) {
      throw new Error(`GatewayB checkSMS failed: ${err.message}`);
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
