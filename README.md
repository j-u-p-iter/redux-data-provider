# Redux data provider
The goal of this repo is to provide access to all necessary tools to create base redux parts for your applications.

## What is it all about?
*Most applications we create/use right now do:*
- sending some common set of requests to create/read/update/delete some resource.
- updating redux store with data, that was recieved from server.

*This tool was created to simplify this regular process. It will allow you as developer:*
- to reduce amount of boilerplate code in your application
- to create things faster

*Also we implemented simple caching mechanism to reduce amount of HTTP calls.* 
- we don't send HTTP calls, when we already have updated data we need to show on client side

## How to use it?

### Install package

### Import factory to create data provider factory ;)

```typescript
import { createReduxDataProviderFactory } from '@j.u.p.iter/redux-data-provider';
```

You can use this tool with different data providers. You can use one of our data providers: https://github.com/j-u-p-iter/data-provider. Or you create your own data provider. There's requirement to interface, that each data provider should have.

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

### Use data provider

After you create data provider for concrete resource, you get access to:
- set of actions you can call to manage resource data;
- reducer you should include into your rootReducer to get access resource data in your application.

Let's look at one simple example:

```typescript
const postsReduxDataProvider = createReduxDataProvider('posts');

// postsReducer should be included into root reducer of your application
const { useActions, reducer: postsReducer } = postsReduxDataProvider;

// actions you can use to manage posts data
const { getList, getOne, create, update, delete } = useActions();
```

### Examples of usage of an actions
Here we'll look at several examples of how to use previous actions. These are common actions we use daily, so we'll take a look at these actions very breifly.

#### getList

```typescript
const PostsList = () => {
  const [posts, setPosts] = useState([]);

  const { getList } = useActions();
  
  useEffect(() => {
    const fetchData = async () => {
      const posts = await getList();
      
      setPosts(posts);
    }
  }, []);
  
  return posts.map(({ title, description }) => {
    return (
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    );
  });
}
```

#### create

```typescript
const CreatePostForm = () => {
  const { create: createPost } = useActions();
  
  const onClick = async () => {
    const { id: postId } = await createPost({
      title: 'some title',
      description: 'some description',
    });
    
    redirectTo(`/post/${postId}`);
  };
  
  return (
    <button> onClick={onClick}>Create post</button>
  );
}
```

