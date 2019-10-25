import React, {useState, useEffect} from 'react';
import {BrowserRouter as Router, Route, Redirect} from 'react-router-dom';
import gql from 'graphql-tag';
import {useQuery, useMutation, useApolloClient, useSubscription} from '@apollo/react-hooks';
import Authors from './components/Authors';
import Books from './components/Books';
import Recommendations from './components/Recommendations';
import NewBook from './components/NewBook';
import Login from './components/Login';
import Register from './components/Register';

const AUTHOR_DETAILS = gql`
  fragment AuthorDetails on Author {
    name
    born
    bookCount
    id
  }
`;

const BOOK_DETAILS = gql`
  fragment BookDetails on Book {
    title
    author {
      ...AuthorDetails
    }
    published
    genres
    id
  }
  ${AUTHOR_DETAILS}
`;

const INFO_DETAILS = gql`
  fragment InfoDetails on User {
    username
    favoriteGenre
    id
  }
`;

const ALL_AUTHORS = gql`
  query findAuthor($author: String, $born: Int, $title: String) {
    allAuthors(author: $author, born: $born, title: $title) {
      ...AuthorDetails
    }
  }
  ${AUTHOR_DETAILS}
`;

const ALL_BOOKS = gql`
  query findBooks($author: String, $genre: String) {
    allBooks(author: $author, genre: $genre) {
      ...BookDetails
    }
  }
  ${BOOK_DETAILS}
`;

const ADD_BOOK = gql`
  mutation createBook($title: String!, $published: Int!, $author: String!, $genres: [String!]!) {
    addBook(
      title: $title,
      published: $published,
      author: $author,
      genres: $genres
    ) {
      title
      author {
        name
      }
    }
  }
`;

const EDIT_BORN = gql`
  mutation editBorn($name: String!, $born: Int!) {
    editAuthor(
      name: $name,
      setBornTo: $born
    ) {
      name
      born
    }
  }
`;

const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(
      username: $username,
      password: $password
    ) {
      value
    }
  }
`;

const REGISTER = gql`
  mutation register($username: String!, $password: String!, $verifyPassword: String!, $favoriteGenre: String!) {
    createUser(
      username: $username,
      password: $password,
      verifyPassword: $verifyPassword,
      favoriteGenre: $favoriteGenre
    ) {
      username
    }
  }
`;

const INFO = gql`
  query {
    me {
      ...InfoDetails
    }
  }
  ${INFO_DETAILS}
`;

const GENRES = gql`
  query {
    genres
  }
`;

const BOOK_ADDED = gql`
  subscription {
    bookAdded {
      ...BookDetails
    }
  }
  ${BOOK_DETAILS}
`;

const AUTHOR_ADDED = gql`
  subscription {
    authorAdded {
      ...AuthorDetails
    }
  }
  ${AUTHOR_DETAILS}
`;

const AUTHOR_EDITED = gql`
  subscription {
    authorEdited {
      ...AuthorDetails
    }
  }
  ${AUTHOR_DETAILS}
`;

const App = () => {
  const client = useApolloClient();
  const [token, setToken] = useState(null);
  const [loginSection, setLoginSection] = useState('actions');
  const [notification, setNotification] = useState(null);
  const [page, setPage] = useState('authors');
  const handleError = (error) => {
    setNotification({type: 'error', message: error.message});
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };
  const handleInfo = (message) => {
    setNotification({type: 'info', message: message});
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };
  const authorsResult = useQuery(ALL_AUTHORS);
  const booksResult = useQuery(ALL_BOOKS);
  const info = useQuery(INFO);
  const genres = useQuery(GENRES);
  const [addBook] = useMutation(ADD_BOOK, {
    onError: handleError,
    update: (store, response) => {
      updateCacheWithBook(response.data.addBook);
    }
  });
  const [editBorn] = useMutation(EDIT_BORN, {
    onError: handleError,
    update: (store, response) => {
      updateCacheWithAuthor(response.data.editBorn);
    }
  });
  const [login] = useMutation(LOGIN, {
    onError: handleError,
    refetchQueries: [{query: ALL_BOOKS}, {query: ALL_AUTHORS}]
  });
  const [register] = useMutation(REGISTER, {
    onError: handleError,
    refetchQueries: [{query: ALL_BOOKS}, {query: ALL_AUTHORS}]
  });

  useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({subscriptionData}) => {
      const addedBook = subscriptionData.data.bookAdded;
      handleInfo(`${addedBook.title} added`);
      updateCacheWithBook(addedBook);
    }
  });

  useSubscription(AUTHOR_ADDED, {
    onSubscriptionData: ({subscriptionData}) => {
      const addedAuthor = subscriptionData.data.authorAdded;
      handleInfo(`${addedAuthor.name} added`);
      updateCacheWithAuthor(addedAuthor);
    }
  });

  useSubscription(AUTHOR_EDITED, {
    onSubscriptionData: ({subscriptionData}) => {
      const editedAuthor = subscriptionData.data.authorEdited;
      handleInfo(`${editedAuthor.name} edited`);
      updateCacheWithAuthor(editedAuthor);
    }
  });

  useEffect(() => {
    const localToken = localStorage.getItem('libraryUserToken');
    if (localToken) {
      setToken(localToken);
    }
  }, [setToken]);

  const updateCacheWithBook = (addedBook) => {
    const includedIn = (set, object) => set.map(b => b.id).includes(object.id);
    const dataInStore = client.readQuery({query: ALL_BOOKS});

    console.log(addedBook);

    if (!includedIn(dataInStore.allBooks, addedBook)) {
      client.writeQuery({
        query: ALL_BOOKS,
        data: {allBooks: dataInStore.allBooks.concat(addedBook)}
      });
    }
  };

  const updateCacheWithAuthor = (author) => {
    const includedIn = (set, object) => set.map(a => a.id).includes(object.id);
    const dataInStore = client.readQuery({query: ALL_AUTHORS});

    console.log(author);

    if (!includedIn(dataInStore.allAuthors, author)) {
      client.writeQuery({
        query: ALL_AUTHORS,
        data: {allAuthors: dataInStore.allAuthors.concat(author)}
      });
    } else {
      const allAuthors = dataInStore.allAuthors.map(a => {
        if (a.name === author.name) {
          return author;
        }
        return a;
      });
      client.writeQuery({
        query: ALL_AUTHORS,
        data: {allAuthors: allAuthors}
      });
    }
  };

  const handleLogin = async (event, username, password) => {
    event.preventDefault();
    try {
      await login({
        variables: {
          username: username,
          password: password
        }
      }).then((result) => {
        const newToken = result.data.login.value.toString();
        setToken(newToken);
        localStorage.setItem('libraryUserToken', newToken);
        info.refetch();
      });
      setPage('authors');
      await handleInfo('login successful');
    } catch (e) {
      console.error(e.message);
    }
  };
  const handleLogout = async (event) => {
    event.preventDefault();
    localStorage.removeItem('libraryUserToken');
    setToken(null);
    setLoginSection('actions');
    await client.resetStore();
    handleInfo('logged out');
  };
  const handleRegister = async (event, username, password, verifyPassword, favoriteGenre) => {
    event.preventDefault();
    try {
      await register({
        variables: {
          username: username,
          password: password,
          verifyPassword: verifyPassword,
          favoriteGenre: favoriteGenre
        }
      }).then(() => {
        setLoginSection('actions');
        handleInfo('registration successful');
      });
    } catch (e) {
      console.error(e.message);
      setLoginSection('actions');
    }
  };
  const getInfo = (param) => {
    switch (param) {
    case 'username':
      return info.data && info.data.me && info.data.me.username ? info.data.me.username : null;
    case 'id':
      return info.data && info.data.me && info.data.me.id ? info.data.me.id : null;
    case 'favoriteGenre':
      return info.data && info.data.me && info.data.me.favoriteGenre ? info.data.me.favoriteGenre : null;
    default:
      return info.data && info.data.me && info.data.me.username ? info.data.me.username : null;
    }
  };

  const Username = () => {
    if (!info.error && info.loading) {
      return (
        <label style={{color: 'blue'}}><i>logging</i>. . .</label>
      );
    } else if (!(info.error && info.loading)) {
      return (
        <label style={{color: 'green'}}>logged as <i>{getInfo('username')}</i> </label>
      );
    } else {
      return (
        <label style={{color: 'red'}}>error occurred</label>
      );
    }
  };
  const UserInfo = () => {
    return (
      <div>
        <Username/>
        <button onClick={(event) => handleLogout(event)}>logout</button>
      </div>
    );
  };
  const MenuComponent = () => {
    return (
      <div style={{display: 'block', marginBottom: '1em'}}>
        <form>
          <button onClick={() => setPage('authors')}>authors</button>
          <button onClick={() => setPage('books')}>books</button>
          {token && <button onClick={() => setPage('add')}>add book</button>}
          {token && <button onClick={() => setPage('recommendations')}>recommendations</button>}
        </form>
      </div>
    );
  };
  const LoginComponent = () => {
    function startOver() {
      setLoginSection('actions');
    }
    if (!token && loginSection === 'register') {
      return (
        <div style={{display: 'block', marginBottom: '1em'}}>
          <Register show={!token} register={handleRegister} startOver={startOver}/>
        </div>
      );
    } else if (!token && loginSection === 'login') {
      return (
        <div style={{display: 'block', marginBottom: '1em'}}>
          <Login show={!token} login={handleLogin} startOver={startOver}/>
        </div>
      );
    } else if (!token && loginSection === 'actions') {
      return (
        <div style={{display: 'block', marginBottom: '1em'}}>
          <button onClick={() => setLoginSection('login')}>login</button>
          <button onClick={() => setLoginSection('register')}>register</button>
        </div>
      );
    } else {
      return (
        <div style={{display: 'block', marginBottom: '1em'}}>
          <UserInfo/>
        </div>
      );
    }
  };
  const Notification = () => {
    if (notification && notification.type === 'error') {
      return (
        <div style={{color: 'red', borderTop: '1px solid red', borderBottom: '1px solid red', textAlign: 'center'}}>
          {notification.message}
        </div>
      );
    } else if (notification && notification.type === 'info') {
      return (
        <div style={{color: 'green', borderTop: '1px solid green', borderBottom: '1px solid green', textAlign: 'center'}}>
          {notification.message}
        </div>
      );
    } else {
      return (
        <div style={{color: 'transparent', borderTop: '1px solid transparent', borderBottom: '1px solid transparent'}}>
          <br/>
        </div>
      );
    }
  };

  return (
    <Router>
      <div style={{margin: '1em'}}>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <MenuComponent/>
            <LoginComponent/>
          </div>
          <Notification/>
        </div>

        {page === 'authors' && <Redirect to='/authors'/>}
        {page === 'books' && <Redirect to='/books'/>}
        {page === 'add' && <Redirect to='/add'/>}
        {page === 'recommendations' && <Redirect to='/recommendations'/>}
        <Route path='/authors' render={() =>
          <Authors show={page === 'authors'} logged={!!token}
            result={authorsResult} editBorn={editBorn}/>}/>
        <Route path='/books' render={() =>
          <Books show={page === 'books'} result={booksResult} genres={genres}/>}/>
        <Route path='/add' render={() =>
          <NewBook show={page === 'add' && token} addBook={addBook}/>}/>
        <Route path='/recommendations' render={() =>
          <Recommendations show={page === 'recommendations' && token}
            username={getInfo('username')} genre={getInfo('favoriteGenre')}/>}/>
      </div>
    </Router>
  );
};

export default App;
