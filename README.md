# Redux data provider
The goal of this repo is to provide access to all necessary tools to create base redux parts for your applications.

## What is it all about?
*Most applications we create/use right now do:*
- sending some common set of requests to create/read/update/delete some resource.
- updating redux store with data, that was recieved from server.

*This tool was created to simplify this regular process. It will allow you as developer:*
- to reduce amount of boilerplate code in your application
- to create things faster

## How to use it?

### Install package

### Import factory to create data provider factory ;)

You can use this tool with different data providers. However there's requirement for interface, that each data provider should have.

So, on this step you should bind dataProvider you want to use to reduxDataProvider. You should do it, using createDataProviderFactory method. This is the only method, exposed by the package.

You should create one common data provider factory for the whole application in the root application level (root component).

```typescript
const graphQLDataProvider = createGraphQLDataProvider();

const createReduxDataProvider = createReduxDataProviderFactory(graphQLDataProvider);

...
```

### Create data provider for concrete resource

You should create reduxDataProvider for each resource you want to use this provider with.

Some examples:

```typescript
const postsReduxDataProvider = createReduxDataProvider('posts');
const usersReduxDataProvider = createReduxDataProvider('users');
```
