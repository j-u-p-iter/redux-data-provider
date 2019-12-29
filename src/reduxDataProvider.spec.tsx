import { createBaseRestDataProvider } from "@j.u.p.iter/data-provider";
import { renderReduxComponent } from "@j.u.p.iter/react-test-utils";
import { cleanup, wait } from "@testing-library/react";
import nock from "nock";
import * as React from "react";
import { useSelector } from "react-redux";
import { createReducer } from "./createReducer";

import { createReduxDataProviderFactory } from ".";

const { useEffect, useState } = React;

describe("reduxDataProvider", () => {
  let TestComponent;
  let renderComponent;
  let useActions;

  const resource = "posts";

  afterEach(cleanup);

  beforeAll(() => {
    const dataProvider = createBaseRestDataProvider({
      host: "some-host.com"
    });

    const postsReducer = createReducer("posts");

    const rootReducer = (state, action) => ({
      resources: {
        posts: postsReducer(state.resources.posts, action)
      }
    });

    ({ useActions } = createReduxDataProviderFactory(dataProvider)(resource));

    renderComponent = (newState = {}) => {
      return renderReduxComponent({
        ui: <TestComponent />,
        rootReducer,
        initialState: {
          resources: {
            posts: {
              list: {
                data: [],
                page: null
              },
              item: {},
              ...newState
            }
          }
        }
      });
    };
  });

  describe("getList", () => {
    let request;
    let post;

    beforeAll(() => {
      TestComponent = () => {
        const { getList } = useActions();
        const [postsFromFetch, setPostsFromFetch] = useState([]);

        const {
          list: { data: postsFromStore, page: pageFromStore }
        } = useSelector(state => state.resources.posts);

        useEffect(() => {
          const fetchData = async () => {
            const {
              data: { items: posts }
            } = await getList(1);

            setPostsFromFetch(posts);
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
          </>
        );
      };
    });

    beforeEach(() => {
      post = { title: "hello" };

      request = nock("https://some-host.com/api/v1")
        .persist()
        .get("/posts")
        .query({ limit: 10, offset: 0 })
        .reply(200, { data: { items: [post] } });
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
        const { getOne } = useActions();
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
        const { create } = useActions();
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
        const { update } = useActions();
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
        .reply(200, { data: { items: [{ id: postId, title: "super post" }] } });
    });

    it("sends correct request and returns correct response", async () => {
      const { getByTestId } = renderComponent({
        list: {
          data: [
            {
              id: postId,
              title: "simple post"
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
        const { delete: deleteOne } = useActions();
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

      expect(getByTestId("title-from-fetch").textContent).toBe("deleted post");
      expect(queryByTestId("title-from-list")).toBe(null);
      expect(queryByTestId("title-from-item")).toBe(null);
      expect(queryByTestId("page-from-store")).toBe(null);
      expect(request.isDone()).toBe(true);
    });
  });
});
