import get from "get-value";
import { useSelector } from "react-redux";

// An example of redux store state for posts resource
// {
//   ...
//   resources: {
//     posts: {
//       list: {
//         data,
//         page,
//       },
//       item,
//     }
//   }
//   ...
// }
//
// For this case storeScope will look like this: "resources.posts"

export type UseResourceState = (
  storeScope: string
) => {
  listData: any[];
  itemData: { [key: string]: any };
  page: number;
};

export const useResourceState: UseResourceState = storeScope => {
  const selector = state => get(state, storeScope);
  const {
    list: { data: listData, page },
    item: itemData
  } = useSelector(selector);

  return {
    listData,
    itemData,
    page
  };
};
