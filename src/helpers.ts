export type CreateStoreScopeFn = (resource: string) => string;
export const createStoreScope: CreateStoreScopeFn = resource =>
  `resources.${resource}`;
