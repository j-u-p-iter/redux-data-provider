import { useResourceState } from "./useResourceState";

export type UseResourceProviderHook = (
  storeScope: string
) => {
  getList: (page: number) => Array<{ [key: string]: any }>;
  getOne: (id: string) => { [key: string]: any } | null;
};
export const useResourceProvider: UseResourceProviderHook = storeScope => {
  const { listData, itemData, page: pageFromState } = useResourceState(
    storeScope
  );

  return {
    getList: page => {
      const listDataByPage = pageFromState === page ? listData : [];

      return listDataByPage;
    },

    getOne: id => {
      const itemById =
        [...listData, itemData].find(item => item.id === id) || null;

      return itemById;
    }
  };
};
