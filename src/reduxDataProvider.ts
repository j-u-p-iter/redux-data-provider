import { DataProvider } from "@j.u.p.iter/data-provider";

import { createStoreScope } from "./helpers";
import { createUseActions } from "./useActions";

type CreateReduxDataProviderFn = (resource: string, storeScope?: string) => any;
type CreateReduxDataProviderFactory = (
  dataProvider: DataProvider
) => CreateReduxDataProviderFn;

export const createReduxDataProviderFactory: CreateReduxDataProviderFactory = dataProvider => {
  const createReduxDataProvider: CreateReduxDataProviderFn = resource => {
    const resultScopeScope = createStoreScope(resource);
    const useActions = createUseActions(
      dataProvider,
      resource,
      resultScopeScope
    );

    return {
      useActions
    };
  };

  return createReduxDataProvider;
};
