import axios from 'axios';
import { BaseAdapter } from './BaseAdapter.js';

const BASE = 'https://api.smspool.net';
const KEY  = process.env.SMSPOOL_API_KEY;

const SERVICE_MAP = {
  telegram:  'telegram',
  whatsapp:  'whatsapp',
  google:    'google',
  facebook:  'facebook',
  instagram: 'instagram',
  twitter:   'twitter',
  tiktok:    'tiktok',
  discord:   'discord',
  uber:      'uber',
  amazon:    'amazon',
  netflix:   'netflix',
  snapchat:  'snapchat',
  tinder:    'tinder',
  linkedin:  'linkedin',
  steam:     'steam',
  paypal:    'paypal',
  openai:    'openai',
};

export class GatewayD extends BaseAdapter {
  constructor() {
    super('GatewayD');
  }

  mapService(service) {
    return SERVICE_MAP[service.toLowerCase()] ?? service.toLowerCase();
  }

  async fetchNumber(service, country) {
    try {
      const form = new URLSearchParams({
        key:            KEY,
        country:        country || '1',
        service:        this.mapService(service),
        pricing_option: '1',
      });
      const res = await axios.post(`${BASE}/purchase/sms`, form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (res.data.success === 1 || res.data.success === true) {
        return { orderId: String(res.data.order_id), phone: res.data.number };
      }
      throw new Error(res.data.message || 'SMSPool rejected request');
    } catch (err) {
      throw new Error(`GatewayD fetchNumber failed: ${err.message}`);
    }
  }

  async checkSMS(orderId) {
    try {
      const form = new URLSearchParams({ key: KEY, orderid: orderId });
      const res  = await axios.post(`${BASE}/sms/check`, form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      // SMSPool status codes: 1=active, 2=waiting, 3=completed, 4=refunded
      if (res.data.status === 3 && res.data.sms) {
        return { status: 'RECEIVED', code: res.data.sms };
      }
      if (res.data.status === 4) return { status: 'EXPIRED', code: null };
      return { status: 'PENDING', code: null };
    } catch (err) {
      throw new Error(`GatewayD checkSMS failed: ${err.message}`);
    }
  }

  async cancelOrder(orderId) {
    try {
      const form = new URLSearchParams({ key: KEY, orderid: orderId });
      await axios.post(`${BASE}/sms/cancel`, form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  }
}
