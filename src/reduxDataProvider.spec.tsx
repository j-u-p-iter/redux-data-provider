import { createBaseRestDataProvider } from "@j.u.p.iter/data-provider";
import { renderReduxComponent } from "@j.u.p.iter/react-test-utils";
import { cleanup, wait } from "@testing-library/react";
import nock from "nock";
import * as React from "react";

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

    ({ useActions } = createReduxDataProviderFactory(dataProvider)(resource));

    renderComponent = (newState = {}) => {
      return renderReduxComponent({
        ui: <TestComponent />,
        rootReducer: state => state,
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
        const [items, setItems] = useState([]);

        useEffect(() => {
          const fetchData = async () => {
            const {
              data: { items: posts }
            } = await getList(1);

            setItems(posts);
          };

          fetchData();
        });

        return (
          <ul>
            {items.map(({ title }) => {
              return (
                <li key={title} data-testid="title">
                  {title}
                </li>
              );
            })}
          </ul>
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

        await wait(() => getByTestId("title"));

        expect(getByTestId("title").textContent).toBe(post.title);
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

        await wait(() => getByTestId("title"));

        expect(getByTestId("title").textContent).toBe(post.title);
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
        const [item, setItem] = useState({ title: null });

        useEffect(() => {
          const fetchData = async () => {
            const {
              data: {
                items: [post]
              }
            } = await getOne(postId);

            setItem(post);
          };

          fetchData();
        });

        return item.title ? <div data-testid="title">{item.title}</div> : null;
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

        await wait(() => getByTestId("title"));

        expect(getByTestId("title").textContent).toBe("hello");
        expect(request.isDone()).toBe(true);
      });
    });

    describe("with appropriate state for single post", () => {
      it("doesn't send request when state for current page is already in store", async () => {
        const { getByTestId } = renderComponent({
          item: { id: postId, title: "hello one more time!" }
        });

        await wait(() => getByTestId("title"));

        expect(getByTestId("title").textContent).toBe("hello one more time!");
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

        await wait(() => getByTestId("title"));

        expect(getByTestId("title").textContent).toBe(
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
        const [item, setItem] = useState({ title: null });

        useEffect(() => {
          const fetchData = async () => {
            const {
              data: {
                items: [post]
              }
            } = await create({ title: "super post" });

            setItem(post);
          };

          fetchData();
        });

        return item.title ? <div data-testid="title">{item.title}</div> : null;
      };
    });

    beforeEach(() => {
      request = nock("https://some-host.com/api/v1")
        .persist()
        .post(`/posts`)
        .reply(200, { data: { items: [{ title: "hello" }] } });
    });

    it("sends correct request and returns correct response", async () => {
      const { getByTestId } = renderComponent();

      await wait(() => getByTestId("title"));

      expect(getByTestId("title").textContent).toBe("hello");
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
        const [item, setItem] = useState({ title: null });

        useEffect(() => {
          const fetchData = async () => {
            const {
              data: {
                items: [post]
              }
            } = await update(postId, { title: "super post" });

            setItem(post);
          };

          fetchData();
        });

        return item.title ? <div data-testid="title">{item.title}</div> : null;
      };
    });

    beforeEach(() => {
      request = nock("https://some-host.com/api/v1")
        .persist()
        .put(`/posts/${postId}`)
        .reply(200, { data: { items: [{ title: "super post" }] } });
    });

    it("sends correct request and returns correct response", async () => {
      const { getByTestId } = renderComponent();

      await wait(() => getByTestId("title"));

      expect(getByTestId("title").textContent).toBe("super post");
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
        const [item, setItem] = useState({ title: null });

        useEffect(() => {
          const fetchData = async () => {
            const {
              data: {
                items: [post]
              }
            } = await deleteOne(postId);

            setItem(post);
          };

          fetchData();
        });

        return item.title ? <div data-testid="title">{item.title}</div> : null;
      };
    });

    beforeEach(() => {
      request = nock("https://some-host.com/api/v1")
        .persist()
        .delete(`/posts/${postId}`)
        .reply(200, { data: { items: [{ title: "deleted post" }] } });
    });

    it("sends correct request and returns correct response", async () => {
      const { getByTestId } = renderComponent();

      await wait(() => getByTestId("title"));

      expect(getByTestId("title").textContent).toBe("deleted post");
      expect(request.isDone()).toBe(true);
    });
  });
});
