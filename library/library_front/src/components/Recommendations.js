import React, {useEffect} from 'react';
import RenderBooklist from './RenderBooklist';
import {useApolloClient, useLazyQuery} from '@apollo/react-hooks';
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

const Recommendations = ({show, username, genre}) => {
  const [getRecommendations, recommendations] = useLazyQuery(ALL_BOOKS);
  useEffect(() => {
    getRecommendations({
      variables: {
        genre: genre
      },
      pollInterval: 2000
    });
  }, [getRecommendations, genre]);

  if (!show) return null;

  const RenderContent = ({results}) => {
    if (results.loading) {
      return <div>Loading data . . .</div>;
    } else if (results.data && results.data.allBooks) {
      return <RenderBooklist books={results.data.allBooks}/>;
    } else {
      return <div>Error occurred while loading data</div>;
    }
  };

  return (
    <div>
      <h2>recommendations for <i>{username}</i></h2>
      <p>books based on your favorite genre: <b>{genre}</b></p>
      <br/>
      <RenderContent results={recommendations}/>
    </div>
  );
};

export default Recommendations;
