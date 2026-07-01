import axios from 'axios';
import { BaseAdapter } from './BaseAdapter.js';

const BASE = 'https://onlinesim.io/api';
const KEY  = process.env.ONLINESIM_API_KEY;

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

export class GatewayE extends BaseAdapter {
  constructor() {
    super('GatewayE');
  }

  mapService(service) {
    return SERVICE_MAP[service.toLowerCase()] ?? service.toLowerCase();
  }

  async fetchNumber(service, country) {
    try {
      const res = await axios.get(`${BASE}/getNum.php`, {
        params: {
          apikey:  KEY,
          service: this.mapService(service),
          country: country || 7, // 7 = Russia default on OnlineSim
        },
      });
      // Response: { response: 'TZ_NUM_ANSWER', tzid: 123, number: '79...' }
      if (res.data.response === 'TZ_NUM_ANSWER') {
        return { orderId: String(res.data.tzid), phone: res.data.number };
      }
      throw new Error(`OnlineSim rejected: ${JSON.stringify(res.data)}`);
    } catch (err) {
      throw new Error(`GatewayE fetchNumber failed: ${err.message}`);
    }
  }

  async checkSMS(orderId) {
    try {
      const res = await axios.get(`${BASE}/getState.php`, {
        params: { apikey: KEY, tzid: orderId },
      });
      const item = Array.isArray(res.data) ? res.data[0] : res.data;
      // response states: TZ_NUM_WAIT, TZ_NUM_ANSWER, TZ_OVER_EMPTY, TZ_NUM_EXPIRED
      if (item?.response === 'TZ_NUM_ANSWER' && item?.msg) {
        // Extract only digits from the message as the OTP
        const code = item.msg.match(/\d{4,8}/)?.[0] ?? item.msg;
        return { status: 'RECEIVED', code };
      }
      if (item?.response === 'TZ_NUM_EXPIRED' || item?.response === 'TZ_OVER_EMPTY') {
        return { status: 'EXPIRED', code: null };
      }
      return { status: 'PENDING', code: null };
    } catch (err) {
      throw new Error(`GatewayE checkSMS failed: ${err.message}`);
    }
  }

  async cancelOrder(orderId) {
    try {
      await axios.get(`${BASE}/setOperationRevise.php`, {
        params: { apikey: KEY, tzid: orderId },
      });
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  }
}
