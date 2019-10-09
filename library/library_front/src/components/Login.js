import React, {useState} from 'react';

const Login = ({show, login, startOver}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const handleLogin = (event) => {
    event.preventDefault();
    login(event, username, password);
  };

  if (!show) return null;

  return (
    <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: '1em'}}>
      <form onSubmit={(event) => handleLogin(event)}>
        <input type='text' placeholder='username' autoComplete='false' value={username} onChange={({target}) => setUsername(target.value)}/>
        <input type='password' placeholder='password' autoComplete='false' value={password} onChange={({target}) => setPassword(target.value)}/>
        <button type='submit'>login</button>
        <button onClick={() => startOver()}>cancel</button>
      </form>
    </div>
  );
};

export default Login;