export type DeviceId = string;
export interface Device {
  id: string
  mac: string,
  name: string,
  createdAt: Date,
  updatedAt: Date
}
