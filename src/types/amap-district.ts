export interface AmapDistrict {
  citycode?: string;
  adcode?: string;
  name?: string;
  center?: string;
  level?: string;
  districts?: AmapDistrict[];
}

export interface AmapDistrictResponse {
  status: string;
  info: string;
  infocode: string;
  count?: string;
  districts?: AmapDistrict[];
}
