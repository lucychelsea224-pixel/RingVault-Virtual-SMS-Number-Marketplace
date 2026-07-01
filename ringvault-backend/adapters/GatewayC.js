import axios from 'axios';
import { BaseAdapter } from './BaseAdapter.js';

const BASE = 'https://5sim.net/v1/user';
const KEY  = process.env.FIVESIM_API_KEY;

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
};

export class GatewayC extends BaseAdapter {
  constructor() {
    super('GatewayC');
  }

  mapService(service) {
    return SERVICE_MAP[service.toLowerCase()] ?? service.toLowerCase();
  }

  async fetchNumber(service, country) {
    try {
      const countryName = country || 'russia'; // 5Sim uses country name not code
      const res = await axios.get(
        `${BASE}/buy/activation/${countryName}/any/${this.mapService(service)}`,
        { headers: { Authorization: `Bearer ${KEY}`, Accept: 'application/json' } }
      );
      const { id, phone } = res.data;
      return { orderId: String(id), phone: phone.replace('+', '') };
    } catch (err) {
      throw new Error(`GatewayC fetchNumber failed: ${err.response?.data?.message || err.message}`);
    }
  }

  async checkSMS(orderId) {
    try {
      const res = await axios.get(
        `${BASE}/check/${orderId}`,
        { headers: { Authorization: `Bearer ${KEY}`, Accept: 'application/json' } }
      );
      const { status, sms } = res.data;
      // 5Sim statuses: PENDING, RECEIVED, CANCELED, TIMEOUT, BANNED, EXPIRED
      if (status === 'RECEIVED' && sms?.length > 0) {
        return { status: 'RECEIVED', code: sms[0]?.code ?? null };
      }
      if (status === 'CANCELED' || status === 'TIMEOUT' || status === 'EXPIRED') {
        return { status: 'EXPIRED', code: null };
      }
      return { status: 'PENDING', code: null };
    } catch (err) {
      throw new Error(`GatewayC checkSMS failed: ${err.message}`);
    }
  }

  async cancelOrder(orderId) {
    try {
      await axios.get(
        `${BASE}/cancel/${orderId}`,
        { headers: { Authorization: `Bearer ${KEY}` } }
      );
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  }
}
