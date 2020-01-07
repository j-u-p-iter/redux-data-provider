import { DataProvider } from "@j.u.p.iter/data-provider";

import { createStoreScope } from "./helpers";
import { createUseActions } from "./useActions";
import { createUseMutation } from "./useMutation";
import { createUseQuery } from "./useQuery";

export interface Config {
  getList: {
    pagination: {
      limit: number;
    };
  };
}
export type CreateReduxDataProviderFn = (
  resource: string,
  config: Config
) => any;
export type CreateReduxDataProviderFactory = (
  dataProvider: DataProvider
) => CreateReduxDataProviderFn;

export const createReduxDataProviderFactory: CreateReduxDataProviderFactory = dataProvider => {
  const createReduxDataProvider: CreateReduxDataProviderFn = (
    resource,
    config
  ) => {
    const resultStoreScope = createStoreScope(resource);
    const useActions = createUseActions(
      dataProvider,
      resource,
      resultStoreScope,
      config
    );
    const useQuery = createUseQuery(
      dataProvider,
      resource,
      resultStoreScope,
      config
    );
    const useMutation = createUseMutation(
      dataProvider,
      resource,
      resultStoreScope,
      config
    );

    return {
      useActions,
      useQuery,
      useMutation
    };
  };

  return createReduxDataProvider;
};
