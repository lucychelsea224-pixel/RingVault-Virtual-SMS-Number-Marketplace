import axios from 'axios';

let cachedCountries = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

export async function getSmsPoolCountryMap() {
  const now = Date.now();
  if (cachedCountries && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedCountries;
  }

  const response = await axios.post(
    'https://api.smspool.net/country/retrieve_all',
    new URLSearchParams({ key: process.env.SMSPOOL_API_KEY }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const countries = response.data;

  const isoToDial = {
    US: '1', CA: '1', GB: '44', NL: '31', LV: '371', SE: '46', PT: '351',
    RO: '40', DK: '45', FR: '33', DE: '49', RS: '381', ES: '34', BE: '32',
    IT: '39', PL: '48', CZ: '420', HU: '36', GR: '30', AT: '43', CH: '41',
    NO: '47', FI: '358', IN: '91', CN: '86', JP: '81', KR: '82', TH: '66',
    VN: '84', ID: '62', MY: '60', PH: '63', SG: '65', BD: '880', PK: '92',
    NG: '234', GH: '233', ZA: '27', KE: '254', ET: '251', TZ: '255',
    UG: '256', MA: '212', EG: '20', CI: '225', SN: '221', CM: '237',
    BR: '55', CO: '57', AR: '54', CL: '56', PE: '51', VE: '58', EC: '593',
    MX: '52', GP: '590', AI: '1264',
  };

  const dialToSmspoolId = {};
  for (const c of countries) {
    const dial = isoToDial[c.short_name];
    if (dial) dialToSmspoolId[dial] = c.ID;
  }

  cachedCountries = dialToSmspoolId;
  cacheTimestamp = now;
  return dialToSmspoolId;
}
