import { createBaseRestDataProvider } from "@j.u.p.iter/data-provider";
import { renderReduxComponent } from "@j.u.p.iter/react-test-utils";
import { cleanup, fireEvent, wait } from "@testing-library/react";
import nock from "nock";
import * as React from "react";
import { useSelector } from "react-redux";
import { createInitialState, createReducer } from "./reducer";

import { createReduxDataProviderFactory } from ".";

const { useEffect, useState } = React;

describe("reduxDataProvider", () => {
  let TestComponent;
  let renderComponent;
  let reduxDataProvider;

  const resource = "posts";

  afterEach(() => {
    cleanup();
    nock.cleanAll();
  });

  beforeAll(() => {
    const dataProvider = createBaseRestDataProvider({
      host: "some-host.com"
    });

    const patternsReducer = createReducer("patterns");
    const postsReducer = createReducer("posts");

    reduxDataProvider = createReduxDataProviderFactory(dataProvider)(resource, {
      getList: {
        pagination: {
          limit: 10
        },
        sorting: {
          sortBy: "title",
          sortDir: "desc"
        }
      }
    });

    const rootReducer = (state, action) => ({
      resources: {
        posts: postsReducer(state.resources.posts, action),
        patterns: patternsReducer(state.resources.patterns, action)
      }
    });

    renderComponent = (newState = {}) => {
      return renderReduxComponent({
        ui: <TestComponent />,
        rootReducer,
        initialState: {
          resources: {
            patterns: createInitialState(),
            posts: {
              ...createInitialState(),
              ...newState
            }
          }
        }
      });
    };
  });

  describe("useActions", () => {
    describe("getList", () => {
      let request;
      let post;
      let totalCount;

      beforeAll(() => {
        TestComponent = () => {
          const { getList } = reduxDataProvider.useActions();
          const [postsFromFetch, setPostsFromFetch] = useState([]);
          const [totalCountFromFetch, setTotalCountFromFetch] = useState([]);

          const {
            list: {
              data: postsFromStore,
              page: pageFromStore,
              totalCount: totalCountFromStore
            }
          } = useSelector(state => state.resources.posts);

          useEffect(() => {
            const fetchData = async () => {
              const {
                data: { items: posts, totalCount: totalCountFromResponse }
              } = await getList(1);

              setPostsFromFetch(posts);
              setTotalCountFromFetch(totalCountFromResponse);
            };

            fetchData();
          });

          return (
            <>
              <ul>
                {postsFromFetch.map(({ title }) => {
                  return (
                    <li key={title} data-testid="title-from-fetch">
                      {title}
                    </li>
                  );
                })}
              </ul>

              {totalCountFromFetch ? (
                <div data-testid="total-count-from-fetch">
                  {totalCountFromFetch}
                </div>
              ) : null}

              {pageFromStore ? (
                <div data-testid="page-from-store">{pageFromStore}</div>
              ) : null}

              {totalCountFromStore ? (
                <div data-testid="total-count-from-store">
                  {totalCountFromStore}
                </div>
              ) : null}

              <ul>
                {postsFromStore.map(({ title }) => {
                  return (
                    <li key={title} data-testid="title-from-store">
                      {title}
                    </li>
                  );
                })}
              </ul>
            </>
          );
        };
      });

      beforeEach(() => {
        post = { title: "hello" };
        totalCount = 10;

        request = nock("https://some-host.com/api/v1")
          .persist()
          .get("/posts")
          .query({ limit: 10, offset: 0, sortBy: "title", sortDir: "desc" })
          .reply(200, { data: { items: [post], totalCount } });
      });

      describe("without appropriate state in store", () => {
        it("sends request and process it properly", async () => {
          const { getByTestId } = renderComponent();

          await wait(() => {
            getByTestId("title-from-fetch");
            getByTestId("title-from-store");

            getByTestId("page-from-store");
          });

          expect(getByTestId("title-from-fetch").textContent).toBe(post.title);
          expect(getByTestId("title-from-store").textContent).toBe(post.title);

          expect(getByTestId("page-from-store").textContent).toBe("1");
          expect(request.isDone()).toBe(true);
        });
      });

      describe("with appropriate state in store", () => {
        beforeEach(() => {
          post = {
            title: "hello one more time!"
          };
        });

        it("doesn't send request when state for current page is already in store", async () => {
          const { getByTestId } = renderComponent({
            list: {
              data: [post],
              page: 1
            }
          });

          await wait(() => {
            getByTestId("title-from-fetch");
            getByTestId("title-from-store");
            getByTestId("page-from-store");
          });

          expect(getByTestId("title-from-fetch").textContent).toBe(post.title);
          expect(getByTestId("title-from-store").textContent).toBe(post.title);

          expect(getByTestId("page-from-store").textContent).toBe("1");
          expect(request.isDone()).toBe(false);
        });
      });
    });

    describe("getOne", () => {
      let request;
      let postId;

      beforeAll(() => {
        postId = 12345;

        TestComponent = () => {
          const { getOne } = reduxDataProvider.useActions();
          const [postFromFetch, setPostFromFetch] = useState({ title: null });

          const { item: postFromStore } = useSelector(
            state => state.resources.posts
          );

          useEffect(() => {
            const fetchData = async () => {
              const {
                data: {
                  items: [post]
                }
              } = await getOne(postId);

              setPostFromFetch(post);
            };

            fetchData();
          });

          return (
            <>
              {postFromFetch.title ? (
                <div data-testid="title-from-fetch">{postFromFetch.title}</div>
              ) : null}
              {postFromStore.title ? (
                <div data-testid="title-from-store">{postFromStore.title}</div>
              ) : null}
            </>
          );
        };
      });

      beforeEach(() => {
        request = nock("https://some-host.com/api/v1")
          .persist()
          .get(`/posts/${postId}`)
          .reply(200, { data: { items: [{ title: "hello" }] } });
      });

      describe("without appropriate state in store", () => {
        it("sends request and process it properly", async () => {
          const { getByTestId } = renderComponent();

          await wait(() => {
            getByTestId("title-from-fetch");
            getByTestId("title-from-store");
          });

          expect(getByTestId("title-from-fetch").textContent).toBe("hello");
          expect(getByTestId("title-from-store").textContent).toBe("hello");
          expect(request.isDone()).toBe(true);
        });
      });

      describe("with appropriate state for single post", () => {
        it("doesn't send request when state for current page is already in store", async () => {
          const { getByTestId } = renderComponent({
            item: { id: postId, title: "hello one more time!" }
          });

          await wait(() => getByTestId("title-from-fetch"));

          expect(getByTestId("title-from-fetch").textContent).toBe(
            "hello one more time!"
          );
          expect(request.isDone()).toBe(false);
        });
      });

      describe("with appropriate state in posts list", () => {
        it("doesn't send request when state for current page is already in store", async () => {
          const { getByTestId } = renderComponent({
            list: {
              data: [
                {
                  id: postId,
                  title: "and one more time hello!"
                }
              ]
            }
          });

          await wait(() => getByTestId("title-from-fetch"));

          expect(getByTestId("title-from-fetch").textContent).toBe(
            "and one more time hello!"
          );
          expect(request.isDone()).toBe(false);
        });
      });
    });

    describe("create", () => {
      let request;

      beforeAll(() => {
        TestComponent = () => {
          const { create } = reduxDataProvider.useActions();
          const [postFromFetch, setPostFromFetch] = useState({ title: null });

          const {
            list: {
              data: [postFromList],
              page: pageFromStore
            },
            item: postFromItem
          } = useSelector(state => state.resources.posts);

          useEffect(() => {
            const fetchData = async () => {
              const {
                data: {
                  items: [post]
                }
              } = await create({ title: "super post" });

              setPostFromFetch(post);
            };

            fetchData();
          });

          return (
            <>
              {postFromFetch.title ? (
                <div data-testid="title-from-fetch">{postFromFetch.title}</div>
              ) : null}
              {postFromItem.title ? (
                <div data-testid="title-from-item">{postFromItem.title}</div>
              ) : null}
              {postFromList ? <div data-testid="title-from-list" /> : null}
              {pageFromStore ? <div data-testid="page-from-store" /> : null}
            </>
          );
        };
      });

      beforeEach(() => {
        request = nock("https://some-host.com/api/v1")
          .persist()
          .post(`/posts`)
          .reply(200, { data: { items: [{ id: 2, title: "hello" }] } });
      });

      it("sends correct request and returns correct response", async () => {
        const { getByTestId, queryByTestId } = renderComponent({
          list: {
            data: [
              {
                id: 1,
                title: "title from list"
              }
            ]
          },
          item: {}
        });

        await wait(() => {
          getByTestId("title-from-fetch");
          getByTestId("title-from-item");
        });

        expect(getByTestId("title-from-fetch").textContent).toBe("hello");
        expect(getByTestId("title-from-item").textContent).toBe("hello");
        expect(queryByTestId("title-from-list")).toBe(null);
        expect(queryByTestId("page-from-store")).toBe(null);
        expect(request.isDone()).toBe(true);
      });
    });

    describe("update", () => {
      let request;
      let postId;

      beforeAll(() => {
        postId = 12345;

        TestComponent = () => {
          const { update } = reduxDataProvider.useActions();
          const [postFromFetch, setPostFromFetch] = useState({ title: null });

          const {
            list: {
              data: [postFromList],
              page: pageFromStore
            },
            item: postFromItem
          } = useSelector(state => state.resources.posts);

          useEffect(() => {
            const fetchData = async () => {
              const {
                data: {
                  items: [post]
                }
              } = await update(postId, { title: "super post" });

              setPostFromFetch(post);
            };

            fetchData();
          });

          return (
            <>
              {postFromFetch.title ? (
                <div data-testid="title-from-fetch">{postFromFetch.title}</div>
              ) : null}
              {postFromItem.title ? (
                <div data-testid="title-from-item">{postFromItem.title}</div>
              ) : null}
              {postFromList && postFromList.title ? (
                <div data-testid="title-from-list">{postFromList.title}</div>
              ) : null}
              {pageFromStore ? (
                <div data-testid="page-from-store">{pageFromStore}</div>
              ) : null}
            </>
          );
        };
      });

      beforeEach(() => {
        request = nock("https://some-host.com/api/v1")
          .persist()
          .put(`/posts/${postId}`)
          .reply(200, {
            data: { items: [{ id: postId, title: "super post" }] }
          });
      });

      it("sends correct request and returns correct response", async () => {
        const { getByTestId } = renderComponent({
          list: {
            data: [
              {
                id: postId,
                title: "simple post"
              },
              {
                id: 2,
                title: "one more post"
              }
            ],
            page: 1
          },
          item: {}
        });

        await wait(() => {
          getByTestId("title-from-fetch");
          getByTestId("title-from-list");
          getByTestId("title-from-item");
          getByTestId("page-from-store");
        });

        expect(getByTestId("title-from-fetch").textContent).toBe("super post");
        expect(getByTestId("title-from-item").textContent).toBe("super post");
        expect(getByTestId("title-from-list").textContent).toBe("super post");
        expect(getByTestId("page-from-store").textContent).toBe("1");
        expect(request.isDone()).toBe(true);
      });
    });

    describe("delete", () => {
      let request;
      let postId;

      beforeAll(() => {
        postId = 12345;

        TestComponent = () => {
          const { delete: deleteOne } = reduxDataProvider.useActions();
          const [postFromFetch, setPostFromFetch] = useState({ title: null });

          const {
            list: {
              data: [postFromList],
              page: pageFromStore
            },
            item: postFromItem
          } = useSelector(state => state.resources.posts);

          useEffect(() => {
            const fetchData = async () => {
              const {
                data: {
                  items: [post]
                }
              } = await deleteOne(postId);

              setPostFromFetch(post);
            };

            fetchData();
          });

          return (
            <>
              {postFromFetch.title ? (
                <div data-testid="title-from-fetch">{postFromFetch.title}</div>
              ) : null}
              {postFromItem.title ? (
                <div data-testid="title-from-item">{postFromItem.title}</div>
              ) : null}
              {postFromList && postFromList.title ? (
                <div data-testid="title-from-list">{postFromList.title}</div>
              ) : null}
              {pageFromStore ? (
                <div data-testid="page-from-store">{pageFromStore}</div>
              ) : null}
            </>
          );
        };
      });

      beforeEach(() => {
        request = nock("https://some-host.com/api/v1")
          .persist()
          .delete(`/posts/${postId}`)
          .reply(200, { data: { items: [{ title: "deleted post" }] } });
      });

      it("sends correct request and returns correct response", async () => {
        const { getByTestId, queryByTestId } = renderComponent({
          list: {
            data: [
              {
                id: postId,
                title: "simple post"
              },
              {
                id: 2,
                title: "one more post"
              }
            ],
            page: 1
          },
          item: {
            id: postId,
            title: "simple post"
          }
        });

        await wait(() => {
          getByTestId("title-from-fetch");
        });

        expect(getByTestId("title-from-fetch").textContent).toBe(
          "deleted post"
        );
        expect(queryByTestId("title-from-list").textContent).toBe(
          "one more post"
        );
        expect(queryByTestId("title-from-item")).toBe(null);
        expect(queryByTestId("page-from-store").textContent).toBe("1");
        expect(request.isDone()).toBe(true);
      });
    });
  });

  describe("useQuery", () => {
    describe("getList query", () => {
      beforeAll(() => {
        nock("https://some-host.com/api/v1")
          .persist()
          .get("/posts")
          .query({ limit: 10, offset: 10, sortBy: "title", sortDir: "desc" })
          .reply(200, {
            data: {
              items: [{ title: "hello" }, { title: "hello1" }],
              totalCount: 10
            }
          });

        nock("https://some-host.com/api/v1")
          .persist()
          .get("/posts")
          .query({ limit: 10, offset: 20, sortBy: "title", sortDir: "desc" })
          .reply(200, {
            data: {
              items: [
                { title: "hello again" },
                { title: "hello one more time" }
              ],
              totalCount: 10
            }
          });

        TestComponent = () => {
          const {
            data: { items: postsFromFetch, totalCount },
            isLoading,
            query
          } = reduxDataProvider.useQuery("getList", { page: 2 });

          const {
            list: { data: postsFromStore, page: pageFromStore }
          } = useSelector(state => state.resources.posts);

          return !isLoading ? (
            <div>
              <div data-testid="total-count">{totalCount}</div>
              <ul>
                {postsFromFetch.map(({ title }) => {
                  return (
                    <li key={title} data-testid="title-from-fetch">
                      {title}
                    </li>
                  );
                })}
              </ul>

              {pageFromStore ? (
                <div data-testid="page-from-store">{pageFromStore}</div>
              ) : null}
              <ul>
                {postsFromStore.map(({ title }) => {
                  return (
                    <li key={title} data-testid="title-from-store">
                      {title}
                    </li>
                  );
                })}
              </ul>

              <button
                data-testid="fetch-new-page"
                onClick={() => query({ page: 3 })}
              >
                Button
              </button>
            </div>
          ) : (
            <div data-testid="spinner">Spinner</div>
          );
        };
      });

      it("works properly", async () => {
        const {
          getAllByTestId,
          getByTestId,
          queryByTestId
        } = renderComponent();

        expect(getByTestId("spinner")).not.toBe(null);

        await wait(() => {
          getAllByTestId("title-from-fetch");
          getAllByTestId("title-from-store");
          getByTestId("page-from-store");
          getByTestId("total-count");
          getByTestId("fetch-new-page");
        });

        expect(queryByTestId("spinner")).toBe(null);
        expect(getByTestId("page-from-store").textContent).toBe("2");
        expect(getAllByTestId("title-from-fetch").length).toBe(2);
        expect(getAllByTestId("title-from-store").length).toBe(2);
        expect(getByTestId("total-count").textContent).toBe("10");

        fireEvent.click(getByTestId("fetch-new-page"));

        expect(queryByTestId("spinner")).not.toBe(null);

        await wait(() => {
          getAllByTestId("title-from-fetch");
          getAllByTestId("title-from-store");
          getByTestId("page-from-store");
          getByTestId("total-count");
          getByTestId("fetch-new-page");
        });

        expect(queryByTestId("spinner")).toBe(null);
        expect(getByTestId("page-from-store").textContent).toBe("3");
        expect(getAllByTestId("title-from-fetch").length).toBe(2);
        expect(getAllByTestId("title-from-store").length).toBe(2);
        expect(getByTestId("total-count").textContent).toBe("10");
      });
    });

    describe("getOne query", () => {
      beforeAll(() => {
        nock("https://some-host.com/api/v1")
          .persist()
          .get("/posts/2")
          .reply(200, {
            data: {
              items: [{ id: 2, title: "hello" }]
            }
          });

        nock("https://some-host.com/api/v1")
          .persist()
          .get("/posts/3")
          .reply(200, {
            data: {
              items: [{ id: 3, title: "hello one more time" }]
            }
          });

        TestComponent = () => {
          const {
            data: postFromFetch,
            isLoading,
            query
          } = reduxDataProvider.useQuery("getOne", { id: 2 });

          const { item: postFromStore } = useSelector(
            state => state.resources.posts
          );

          return !isLoading ? (
            <div>
              <div data-testid="title-from-fetch">{postFromFetch.title}</div>

              <div data-testid="title-from-store">{postFromStore.title}</div>

              <button
                data-testid="fetch-new-item"
                onClick={() => query({ id: 3 })}
              >
                Button
              </button>
            </div>
          ) : (
            <div data-testid="spinner">Spinner</div>
          );
        };
      });

      it("works properly", async () => {
        const { getByTestId, queryByTestId } = renderComponent();

        expect(getByTestId("spinner")).not.toBe(null);

        await wait(() => {
          getByTestId("title-from-fetch");
          getByTestId("title-from-store");
          getByTestId("fetch-new-item");
        });

        expect(queryByTestId("spinner")).toBe(null);
        expect(getByTestId("title-from-fetch").textContent).toBe("hello");
        expect(getByTestId("title-from-store").textContent).toBe("hello");

        fireEvent.click(getByTestId("fetch-new-item"));

        expect(queryByTestId("spinner")).not.toBe(null);

        await wait(() => {
          getByTestId("title-from-fetch");
          getByTestId("title-from-store");
          getByTestId("fetch-new-item");
        });

        expect(queryByTestId("spinner")).toBe(null);
        expect(getByTestId("title-from-fetch").textContent).toBe(
          "hello one more time"
        );
        expect(getByTestId("title-from-store").textContent).toBe(
          "hello one more time"
        );
      });
    });
  });

  describe("useMutation", () => {
    describe("create mutation", () => {
      beforeAll(() => {
        nock("https://some-host.com/api/v1")
          .persist()
          .post("/posts")
          .reply(200, { data: { items: [{ id: 5, title: "hello again" }] } });

        TestComponent = () => {
          const { mutation: create, isLoading } = reduxDataProvider.useMutation(
            "create"
          );

          const { item: postFromStore } = useSelector(
            state => state.resources.posts
          );

          return (
            <>
              <button
                data-testid="button"
                onClick={() => create({ title: "hello again" })}
              />
              {!isLoading ? (
                <div>
                  <div data-testid="title-from-store">
                    {postFromStore.title}
                  </div>
                </div>
              ) : (
                <div data-testid="spinner">Spinner</div>
              )}
            </>
          );
        };
      });

      it("works properly", async () => {
        const { queryByTestId, getByTestId } = renderComponent();

        fireEvent.click(getByTestId("button"));

        expect(queryByTestId("spinner")).not.toBe(null);
        expect(queryByTestId("title-from-store")).toBe(null);

        await wait(() => {
          expect(getByTestId("title-from-store").textContent).toBe(
            "hello again"
          );
          expect(queryByTestId("spinner")).toBe(null);
        });
      });
    });

    describe("update mutation", () => {
      beforeAll(() => {
        nock("https://some-host.com/api/v1")
          .persist()
          .put("/posts/5")
          .reply(200, { data: { items: [{ id: 5, title: "hello again" }] } });

        TestComponent = () => {
          const { mutation: update, isLoading } = reduxDataProvider.useMutation(
            "update"
          );

          const { item: postFromStore } = useSelector(
            state => state.resources.posts
          );

          return (
            <>
              <button
                data-testid="button"
                onClick={() => update(5, { title: "hello again" })}
              />
              {!isLoading ? (
                <div>
                  <div data-testid="title-from-store">
                    {postFromStore.title}
                  </div>
                </div>
              ) : (
                <div data-testid="spinner">Spinner</div>
              )}
            </>
          );
        };
      });

      it("works properly", async () => {
        const { queryByTestId, getByTestId } = renderComponent();

        fireEvent.click(getByTestId("button"));

        expect(queryByTestId("spinner")).not.toBe(null);
        expect(queryByTestId("title-from-store")).toBe(null);

        await wait(() => {
          expect(getByTestId("title-from-store").textContent).toBe(
            "hello again"
          );
          expect(queryByTestId("spinner")).toBe(null);
        });
      });
    });

    describe("delete mutation", () => {
      beforeAll(() => {
        nock("https://some-host.com/api/v1")
          .persist()
          .delete("/posts/5")
          .reply(200, { data: { items: [{ id: 5, title: "hello again" }] } });

        TestComponent = () => {
          const {
            mutation: deleteOne,
            isLoading
          } = reduxDataProvider.useMutation("delete");

          return (
            <>
              <button data-testid="button" onClick={() => deleteOne(5)} />
              {isLoading ? <div data-testid="spinner">Spinner</div> : null}
            </>
          );
        };
      });

      it("works properly", async () => {
        const { queryByTestId, getByTestId } = renderComponent();

        fireEvent.click(getByTestId("button"));

        expect(queryByTestId("spinner")).not.toBe(null);

        await wait(() => {
          expect(queryByTestId("spinner")).toBe(null);
        });
      });
    });
  });
});
