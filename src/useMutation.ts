import { useState } from "react";

import { DataProvider } from "@j.u.p.iter/data-provider";
import { Config } from "./reduxDataProvider";
import { Actions, createUseActions } from "./useActions";

export type UseMutationHook = (
  mutationName: string
) => {
  mutation: Actions["create"] | Actions["update"] | Actions["delete"];
  isLoading: boolean;
};

export type CreateUseMutationFn = (
  dataProvider: DataProvider,
  resource: string,
  storeScope: string,
  config: Config
) => UseMutationHook;

export const createUseMutation: CreateUseMutationFn = (
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
  const useMutation: UseMutationHook = mutationName => {
    const actions = useActions();
    const [isLoading, setIsLoading] = useState(false);

    const mutation = actions[mutationName];

    const callMutation = async (...args) => {
      setIsLoading(true);

      const data = await mutation(...args);

      setIsLoading(false);

      return data.items[resource];
    };

    return {
      mutation: callMutation,
      isLoading
    };
  };

  return useMutation;
};
