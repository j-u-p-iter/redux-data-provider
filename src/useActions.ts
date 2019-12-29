import { useDispatch } from "react-redux";

import { DataProvider } from "@j.u.p.iter/data-provider";

import {
  CREATE_ITEM_WITH_SUCCESS,
  createActionCreator,
  DELETE_ITEM_WITH_SUCCESS,
  FETCH_DATA_WITH_SUCCESS,
  FETCH_ITEM_WITH_SUCCESS,
  UPDATE_ITEM_WITH_SUCCESS
} from "./createReducer";
import { useResourceProvider } from "./useResourceProvider";

export type UseActionsHook = () => {
  getList: (
    page: number
  ) => Promise<{ data: { items: { [key: string]: any } } }>;

  getOne: (id: string) => Promise<{ data: { [key: string]: any } }>;

  create: (
    data: { [key: string]: any; }
  ) => Promise<{ data: { [key: string]: any } }>;

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
    const dispatch = useDispatch();
    const createAction = createActionCreator(resource);

    return {
      getList: async page => {
        const dataFromStore = getList(page);

        if (dataFromStore.length) {
          return { data: { items: dataFromStore } };
        }

        const data = await dataProvider.getList(resource);

        dispatch(
          createAction(FETCH_DATA_WITH_SUCCESS, {
            items: data.data.items,
            page
          })
        );

        return data;
      },

      getOne: async id => {
        const dataFromStore = getOne(id);

        if (dataFromStore) {
          return { data: { items: [dataFromStore] } };
        }

        const data = await dataProvider.getOne(resource, { id });

        dispatch(
          createAction(FETCH_ITEM_WITH_SUCCESS, {
            item: data.data.items[0]
          })
        );

        return data;
      },

      create: async data => {
        const resultData = await dataProvider.create(resource, { data });

        dispatch(
          createAction(CREATE_ITEM_WITH_SUCCESS, {
            item: resultData.data.items[0]
          })
        );

        return resultData;
      },

      update: async (id, data) => {
        const resultData = await dataProvider.update(resource, { id, data });

        dispatch(
          createAction(UPDATE_ITEM_WITH_SUCCESS, {
            item: resultData.data.items[0]
          })
        );

        return resultData;
      },

      delete: async id => {
        const resultData = await dataProvider.delete(resource, { id });

        dispatch(createAction(DELETE_ITEM_WITH_SUCCESS, { id }));

        return resultData;
      }
    };
  };

  return useActions;
};
