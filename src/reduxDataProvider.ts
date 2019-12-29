import { DataProvider } from "@j.u.p.iter/data-provider";

import { createStoreScope } from "./helpers";
import { createUseActions } from "./useActions";

export type CreateReduxDataProviderFn = (
  resource: string,
  storeScope?: string
) => any;
export type CreateReduxDataProviderFactory = (
  dataProvider: DataProvider
) => CreateReduxDataProviderFn;

export const createReduxDataProviderFactory: CreateReduxDataProviderFactory = dataProvider => {
  const createReduxDataProvider: CreateReduxDataProviderFn = resource => {
    const resultStoreScope = createStoreScope(resource);
    const useActions = createUseActions(
      dataProvider,
      resource,
      resultStoreScope
    );

    return {
      useActions
    };
  };

  return createReduxDataProvider;
};
