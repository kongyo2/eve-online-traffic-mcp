// トレードハブの情報を定義
export interface TradeHub {
  id: number;
  name: string;
  systemId: number;
  regionId: number;
  isPrimary: boolean;
}

// メジャートレードハブ
export const PRIMARY_TRADE_HUBS: TradeHub[] = [
  { id: 60003760, name: "Jita IV - Moon 4 - Caldari Navy Assembly Plant", systemId: 30000142, regionId: 10000002, isPrimary: true },
  { id: 60008494, name: "Amarr VIII (Oris) - Emperor Family Academy", systemId: 30002187, regionId: 10000043, isPrimary: true },
  { id: 60004588, name: "Rens VI - Moon 8 - Brutor Tribe Treasury", systemId: 30002510, regionId: 10000030, isPrimary: true },
  { id: 60011866, name: "Dodixie IX - Moon 20 - Federation Navy Assembly Plant", systemId: 30002659, regionId: 10000032, isPrimary: true },
  { id: 60005686, name: "Hek VIII - Moon 12 - Boundless Creation Factory", systemId: 30002053, regionId: 10000042, isPrimary: true },
];

// セカンダリートレードハブ
export const SECONDARY_TRADE_HUBS: TradeHub[] = [
  // { id: 60008699, name: "Oursulaert V - Moon 11 - Federal Defense Union Logistic Support", systemId: 30002791, regionId: 10000054, isPrimary: false },
  // { id: 60015019, name: "Tash-Murkon Prime VII - Moon 1 - Imperial Shipment Storage", systemId: 30004971, regionId: 10000017, isPrimary: false },
  // { id: 60013762, name: "Agil VI - Moon 6 - CONCORD Logistic Support", systemId: 30004939, regionId: 10000069, isPrimary: false },
  // { id: 60015068, name: "Perimeter VI - Moon 11 - Overseer Revolutionary Logistics", systemId: 30003504, regionId: 10000058, isPrimary: false },
];

// すべてのトレードハブ
export const ALL_TRADE_HUBS: TradeHub[] = [...PRIMARY_TRADE_HUBS, ...SECONDARY_TRADE_HUBS];