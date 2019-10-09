import React, {useState} from 'react';

const NewBook = ({show, addBook}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [published, setPublished] = useState('');
  const [genre, setGenre] = useState('');
  const [genres, setGenres] = useState([]);

  if (!show) return null;

  const submit = async (e) => {
    e.preventDefault();
    try {
      await addBook({
        variables: {
          title: title,
          published: parseInt(published),
          author: author,
          genres: genres
        }
      });

      setTitle('');
      setPublished('');
      setAuthor('');
      setGenres([]);
      setGenre('');
    } catch (e) {
      console.error(e);
    }
  };

  const addGenre = () => {
    setGenres([...genres,genre]);
    setGenre('');
  };

  return (
    <div>
      <h2>add new book</h2>
      <form onSubmit={submit}>
        <input style={{marginTop: '0.5em'}}
          value={title} placeholder='title'
          onChange={({target}) => setTitle(target.value)}/><br/>
        <input style={{marginTop: '0.5em'}}
          value={author} placeholder='author'
          onChange={({target}) => setAuthor(target.value)}/><br/>
        <input style={{marginTop: '0.5em'}}
          type='number' placeholder='published'
          value={published}
          onChange={({target}) => setPublished(target.value)}/><br/>
        <div style={{marginTop: '0.5em'}}>
          <input
            value={genre} placeholder='genre'
            onChange={({target}) => setGenre(target.value)}
          />
          <button onClick={addGenre} type="button">add genre</button>
        </div>
        <div style={{marginTop: '0.5em'}}>
          genres: {genres.join(' | ')}
        </div>
        <button style={{marginTop: '0.5em'}} type='submit'>create book</button>
      </form>
    </div>
  );
};

export default NewBook;
