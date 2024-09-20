import React from 'react';

const App: React.FC<AppProps> = () => {
  console.log('girl render');
  return <div></div>;
};

interface AppProps {}
export default App;
App.displayName = 'App';
