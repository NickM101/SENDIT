export enum PickupPointType {
  SENDIT_CENTER = 'SENDIT_CENTER',
  PARTNER_LOCATION = 'PARTNER_LOCATION',
  MALL_LOCKER = 'MALL_LOCKER',
  POST_OFFICE = 'POST_OFFICE',
  RETAIL_STORE = 'RETAIL_STORE',
}

export enum KenyanCounty {
  BARINGO = 'BARINGO',
  BOMET = 'BOMET',
  BUNGOMA = 'BUNGOMA',
  BUSIA = 'BUSIA',
  ELGEYO_MARAKWET = 'ELGEYO_MARAKWET',
  EMBU = 'EMBU',
  GARISSA = 'GARISSA',
  HOMA_BAY = 'HOMA_BAY',
  ISIOLO = 'ISIOLO',
  KAJIADO = 'KAJIADO',
  KAKAMEGA = 'KAKAMEGA',
  KERICHO = 'KERICHO',
  KIAMBU = 'KIAMBU',
  KILIFI = 'KILIFI',
  KIRINYAGA = 'KIRINYAGA',
  KISII = 'KISII',
  KISUMU = 'KISUMU',
  KITUI = 'KITUI',
  KWALE = 'KWALE',
  LAIKIPIA = 'LAIKIPIA',
  LAMU = 'LAMU',
  MACHAKOS = 'MACHAKOS',
  MAKUENI = 'MAKUENI',
  MANDERA = 'MANDERA',
  MARSABIT = 'MARSABIT',
  MERU = 'MERU',
  MIGORI = 'MIGORI',
  MOMBASA = 'MOMBASA',
  MURANGA = 'MURANGA',
  NAIROBI = 'NAIROBI',
  NAKURU = 'NAKURU',
  NANDI = 'NANDI',
  NAROK = 'NAROK',
  NYAMIRA = 'NYAMIRA',
  NYANDARUA = 'NYANDARUA',
  NYERI = 'NYERI',
  SAMBURU = 'SAMBURU',
  SIAYA = 'SIAYA',
  TAITA_TAVETA = 'TAITA_TAVETA',
  TANA_RIVER = 'TANA_RIVER',
  THARAKA_NITHI = 'THARAKA_NITHI',
  TRANS_NZOIA = 'TRANS_NZOIA',
  TURKANA = 'TURKANA',
  UASIN_GISHU = 'UASIN_GISHU',
  VIHIGA = 'VIHIGA',
  WAJIR = 'WAJIR',
  WEST_POKOT = 'WEST_POKOT',
}

export enum PickupPointStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
}

export interface PickupPoint {
  id: string;
  name: string;
  type: PickupPointType;
  address: string;
  city: string;
  county: KenyanCounty;
  latitude: number;
  longitude: number;
  hours: string;
  phone?: string;
  email?: string;
  services: string[];
  rating?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
