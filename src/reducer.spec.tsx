import { createInitialState, createReducer } from "./reducer";

describe("reducer", () => {
  let reducer;
  let initialState;

  beforeAll(() => {
    reducer = createReducer("posts");
    initialState = createInitialState();
  });

  it("returns initial state by default", () => {
    expect(reducer(undefined, {})).toEqual(initialState);
  });
});
