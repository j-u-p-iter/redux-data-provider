import { DataProvider } from "@j.u.p.iter/data-provider";

import { useResourceProvider } from "./useResourceProvider";

export type UseActionsHook = () => {
  getList: (
    page: number
  ) => Promise<{ data: { items: { [key: string]: any } } }>;

  getOne: (id: string) => Promise<{ data: { [key: string]: any } }>;

  create: (data: {
    [key: string]: any;
  }) => Promise<{ data: { [key: string]: any } }>;

  update: (
    id: string,
    data: { [key: string]: any }
  ) => Promise<{ data: { [key: string]: any } }>;

  delete: (id: string) => Promise<{ data: { [key: string]: any } }>;
};

export type CreateUseActionsFn = (
  dataProvider: DataProvider,
  resource: string,
  storeScope: string
) => UseActionsHook;

export const createUseActions: CreateUseActionsFn = (
  dataProvider,
  resource,
  storeScope
) => {
  const useActions: UseActionsHook = () => {
    const { getList, getOne } = useResourceProvider(storeScope);

    return {
      getList: page => {
        const data = getList(page);

        if (data.length) {
          return Promise.resolve({ data: { items: data } });
        }

        return dataProvider.getList(resource);
      },

      getOne: id => {
        const data = getOne(id);

        if (data) {
          return Promise.resolve({ data: { items: [data] } });
        }

        return dataProvider.getOne(resource, { id });
      },

      create: data => {
        return dataProvider.create(resource, { data });
      },

      update: (id, data) => {
        return dataProvider.update(resource, { id, data });
      },

      delete: id => {
        return dataProvider.delete(resource, { id });
      }
    };
  };

  return useActions;
};
