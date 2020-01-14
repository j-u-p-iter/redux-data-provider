import { useEffect, useState } from "react";

import { DataProvider } from "@j.u.p.iter/data-provider";
import { Config } from "./reduxDataProvider";
import { createUseActions } from "./useActions";

export type UseQueryHook = (
  fetchName: string,
  params: { id?: string; page?: number }
) => {
  data: { [key: string]: any };
  isLoading: boolean;
};

export type CreateUseQueryFn = (
  dataProvider: DataProvider,
  resource: string,
  storeScope: string,
  config: Config
) => UseQueryHook;
export const createUseQuery: CreateUseQueryFn = (
  dataProvider,
  resource,
  storeScope,
  config
) => {
  const useActions = createUseActions(
    dataProvider,
    resource,
    storeScope,
    config
  );

  const useQuery: UseQueryHook = (
    fetchName,
    { id: defaultResourceId, page: defaultPage }
  ) => {
    const isGetListName = fetchName === "getList";
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState(
      isGetListName ? { items: [], totalCount: null } : {}
    );
    const actions = useActions();
    type QueryFn = (params?: { id?: string; page?: number }) => void;
    const query: QueryFn = async ({
      id = defaultResourceId,
      page = defaultPage
    } = {}) => {
      const fetchParam = isGetListName ? page : id;
      const fetchAction = actions[fetchName];

      setIsLoading(true);

      const response = await fetchAction(fetchParam);

      setIsLoading(false);

      const result = isGetListName ? response.data : response.data.items[0];
      setData(result);
    };

    useEffect(() => {
      query();
    }, []);

    return { data, isLoading, query };
  };

  return useQuery;
};
