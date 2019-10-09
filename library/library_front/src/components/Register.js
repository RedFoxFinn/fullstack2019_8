import React, {useState} from 'react';

const Register = ({show, register, startOver}) => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [verifyNewPassword, setVerifyNewPassword] = useState('');
  const [favoriteGenre, setFavoriteGenre] = useState('');
  const handleRegister = (event) => {
    event.preventDefault();
    register(event, newUsername, newPassword, verifyNewPassword, favoriteGenre);
  };

  if (!show) return null;

  return (
    <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: '1em'}}>
      <form onSubmit={(event) => handleRegister(event)}>
        <input type='text' placeholder='username' autoComplete='false' value={newUsername} onChange={({target}) => setNewUsername(target.value)}/>
        <input type='password' placeholder='password' autoComplete='false' value={newPassword} onChange={({target}) => setNewPassword(target.value)}/>
        <input type='password' placeholder='verify password' autoComplete='false' value={verifyNewPassword} onChange={({target}) => setVerifyNewPassword(target.value)}/>
        <input type='text' placeholder='favorite genre' autoComplete='false' value={favoriteGenre} onChange={({target}) => setFavoriteGenre(target.value)}/>
        <button type='submit'>register</button>
        <button onClick={() => startOver()}>cancel</button>
      </form>
    </div>
  );
};

export default Register;