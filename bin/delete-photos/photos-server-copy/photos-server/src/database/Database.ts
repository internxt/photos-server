export interface Database {
  connect(): Promise<Database>;
  disconnect(): Promise<void>;
}
