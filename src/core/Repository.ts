type Id = string;

export interface Repository<T> {
  getById(id: Id): Promise<T | null>
  get(where: Record<string, unknown>): Promise<T[]>
  create(requiredValues: unknown): Promise<Id>
  update(t: T): Promise<T>
  deleteById(id: Id): Promise<void>
  delete(where: Record<string, unknown>): Promise<void>
}
