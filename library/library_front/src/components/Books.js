import React, {useState, useEffect} from 'react';
import RenderBooklist from './RenderBooklist';
import {useLazyQuery} from '@apollo/react-hooks';
import gql from 'graphql-tag';

const ALL_BOOKS = gql`
  query findBooks($author: String, $genre: String) {
    allBooks(author: $author, genre: $genre) {
      title
      author {
        name
      }
      published
      genres
    }
  }
`;

const Books = ({show, result, genres}) => {
  const [view, setView] = useState('all');
  const [getFiltered, filtered] = useLazyQuery(ALL_BOOKS);
  useEffect(() => {
    view !== 'all' && getFiltered({
      variables: {
        genre: view
      },
      pollInterval: 2000
    });
  }, [view, getFiltered]);

  if (!show) return null;

  const handleFilter = async (event) => {
    event.preventDefault();
    setView(event.target.value);
  };

  const Filter = () => {
    return (
      <form>
        <button value={'all'} onClick={event => handleFilter(event)}>all</button>
        {genres.data.genres.map((genre) => {
          return (
            <button key={genre} value={genre} onClick={event => handleFilter(event)}>{genre}</button>
          );
        })}
      </form>
    );
  };
  const RenderContent = ({results}) => {
    if (results.loading) {
      return <div>Loading data . . .</div>;
    } else if (results.data && results.data.allBooks) {
      return (
        <RenderBooklist books={results.data.allBooks}/>
      );
    } else {
      return <div>Error occurred while loading data</div>;
    }
  };

  return (
    <div>
      <h2>books</h2>
      <Filter/>
      {view !== 'all' && <p>books based on filtered genre: <b>{view}</b></p>}
      <br/>
      <RenderContent results={view === 'all' ? result : filtered}/>
    </div>
  );
};

export default Books;
