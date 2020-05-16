const createActionName = (actionBaseName: string): string => {
  const actionNameScope = "REDUX_DATA_PROVIDER";

  return `${actionNameScope}:${actionBaseName}`;
};

export const FETCH_DATA = createActionName("FETCH_DATA");
export const FETCH_DATA_WITH_SUCCESS = createActionName(
  "FETCH_DATA_WITH_SUCCESS"
);
export const FETCH_DATA_WITH_ERROR = createActionName("CREATE_ITEM_WITH_ERROR");

export const FETCH_ITEM = createActionName("FETCH_ITEM");
export const FETCH_ITEM_WITH_SUCCESS = createActionName(
  "FETCH_ITEM_WITH_SUCCESS"
);
export const FETCH_ITEM_WITH_ERROR = createActionName("FETCH_ITEM_WITH_ERROR");

export const CREATE_ITEM = createActionName("CREATE_ITEM");
export const CREATE_ITEM_WITH_SUCCESS = createActionName(
  "CREATE_ITEM_WITH_SUCCESS"
);
export const CREATE_ITEM_WITH_ERROR = createActionName(
  "CREATE_ITEM_WITH_ERROR"
);

export const UPDATE_ITEM = createActionName("UPDATE_ITEM");
export const UPDATE_ITEM_WITH_SUCCESS = createActionName(
  "UPDATE_ITEM_WITH_SUCCESS"
);
export const UPDATE_ITEM_WITH_ERROR = createActionName(
  "UPDATE_ITEM_WITH_ERROR"
);

export const DELETE_ITEM = createActionName("DELETE_ITEM");
export const DELETE_ITEM_WITH_SUCCESS = createActionName(
  "DELETE_ITEM_WITH_SUCCESS"
);
export const DELETE_ITEM_WITH_ERROR = createActionName(
  "DELETE_ITEM_WITH_ERROR"
);

type CreateActionCreatorFn = <R, T, D>(
  resource: R
) => (
  type: T,
  data: D
) => {
  type: T;
  payload: {
    data: D;
    resource: R;
  };
};

export const createActionCreator: CreateActionCreatorFn = resource => {
  return (type, data) => ({
    type,
    payload: { data, resource }
  });
};

interface InitialState {
  list: {
    data: any[];
    page: number | null;
  };
  item: { [key: string]: any };
}

type CreateInitialStateFn = () => InitialState;
export const createInitialState: CreateInitialStateFn = () => {
  const initialState = {
    list: {
      data: [],
      page: null
    },
    item: {}
  };

  return initialState;
};

export const createReducer = resource => {
  const initialState = createInitialState();

  return (state = initialState, action) => {
    if (action.payload && resource !== action.payload.resource) {
      return state;
    }

    switch (action.type) {
      // add list data and page data to the store
      case FETCH_DATA_WITH_SUCCESS:
        return {
          ...state,
          list: {
            ...state.list,
            data: action.payload.data.items,
            page: action.payload.data.page
          }
        };

      // add item data to the store
      case FETCH_ITEM_WITH_SUCCESS:
        return {
          ...state,
          item: action.payload.data.item
        };

      // reset list data (in another words - remove list data from cache)
      // and update item data with new item data
      case CREATE_ITEM_WITH_SUCCESS:
        return {
          list: {
            data: [],
            page: null
          },
          item: action.payload.data.item
        };

      // update list data with updated item data
      // and update item data with new updated item data
      case UPDATE_ITEM_WITH_SUCCESS:
        return {
          list: {
            ...state.list,
            data: state.list.data.map(item => {
              return item.id === action.payload.data.item.id
                ? action.payload.data.item
                : item;
            })
          },
          item: action.payload.data.item
        };

      case DELETE_ITEM_WITH_SUCCESS:
        return {
          list: {
            ...state.list,
            data: state.list.data.filter(({ id }) => {
              return id !== action.payload.data.id;
            })
          },
          item: action.payload.data.id === state.item.id ? {} : state.item
        };

      default:
        return state;
    }
  };
};
