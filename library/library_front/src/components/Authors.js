import React, {useState} from 'react';

const Authors = ({show, logged, result, editBorn}) => {
  const [authorName, setAuthorName] = useState(undefined);
  const [born, setBorn] = useState('');
  if (!show) {
    return null;
  }

  const edit = async (e) => {
    e.preventDefault();
    await editBorn({
      variables: {
        name: authorName,
        born: parseInt(born)
      }
    });

    setAuthorName(undefined);
    setBorn('');
  };

  const renderContent = () => {
    if (result.loading) {
      return <div>Loading data . . .</div>;
    } else if (result.data && result.data.allAuthors) {
      return (
        <div>
          <table>
            <tbody>
              <tr>
                <th> </th>
                <th>born</th>
                <th>books</th>
              </tr>
              {result.data.allAuthors.map((a) =>
                <tr key={a.name} >
                  <td>{a.name}</td>
                  <td>{a.born}</td>
                  <td>{a.bookCount}</td>
                </tr>
              )}
            </tbody>
          </table>
          {logged &&
          <div>
            <h3>edit birthyear</h3>
            <form onSubmit={(event) => edit(event)}>
              <select style={{marginTop: '0.5em'}} defaultValue='default' value={authorName}
                onChange={({target}) => setAuthorName(target.value)}>
                <option key='default' value='default' disabled>select author</option>
                {result.data.allAuthors.map((a) =>
                  <option key={a.name} value={a.name}>{a.name}</option>
                )}
              </select><br/>
              <input style={{marginTop: '0.5em'}} value={born} placeholder={'author\'s birthyear'}
                onChange={({target}) => setBorn(target.value)} type='number'/><br/>
              <button type='submit' style={{marginTop: '0.5em'}}>set birthyear</button>
            </form>
          </div>
          }
        </div>
      );
    } else {
      return <div>Error occurred while loading data</div>;
    }
  };

  return (
    <div>
      <h2>authors</h2>
      {renderContent()}
    </div>
  );
};

export default Authors;