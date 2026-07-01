import { GatewayA } from './GatewayA.js';
import { GatewayB } from './GatewayB.js';
import { GatewayC } from './GatewayC.js';
import { GatewayD } from './GatewayD.js';
import { GatewayE } from './GatewayE.js';
import { GatewayF } from './GatewayF.js';

// Anonymous mapping — frontend only sees gatewayA-F, never real provider names
const REGISTRY = {
  gatewayA: new GatewayA(),
  gatewayB: new GatewayB(),
  gatewayC: new GatewayC(),
  gatewayD: new GatewayD(),
  gatewayE: new GatewayE(),
  gatewayF: new GatewayF(),
};

export function getAdapter(gateway) {
  const adapter = REGISTRY[gateway?.toLowerCase()];
  if (!adapter) throw new Error(`Unknown gateway: "${gateway}". Valid options: gatewayA–gatewayF`);
  return adapter;
}

export const AVAILABLE_GATEWAYS = Object.keys(REGISTRY);
