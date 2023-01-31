type Id = string;

export interface Repository<T> {
  getById(id: Id): Promise<T | null>;
  get(filter: Record<string, unknown>, skip: number, limit: number): Promise<T[]>;
  create(requiredValues: unknown): Promise<T>;
  update(id: Id, merge: Omit<Partial<T>, 'id'>): Promise<void>;
  deleteById(id: Id): Promise<void>;
  delete(where: Record<string, unknown>): Promise<void>;
}
