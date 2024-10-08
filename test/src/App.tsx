import { useState } from 'react';
import './App.css';
import reactLogo from './assets/react.svg';
import AppBoy from './components/AppBoy';
import AppGirl from './components/AppGirl';
import MemoChild from './components/MemoChild';
import viteLogo from '/vite.svg';

function App() {
  // const { setState, state } = useModel('a');
  const [count, setCount] = useState(0);
  // https://stackoverflow.com/a/74513093
  console.log('🚀 refresh app');

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img
            src={viteLogo}
            className="logo"
            alt="Vite logo"
          />
        </a>
        <a href="https://react.dev" target="_blank">
          <img
            src={reactLogo}
            className="logo react"
            alt="React logo"
          />
        </a>
      </div>
      <h1>Vite + React</h1>
      <AppBoy />
      <AppGirl />
      <MemoChild />
      <div className="card">
        {/* <button
          onClick={() =>
            setState((state) => {
              return { ...state, count: state.count + 1 };
            })
          }>
          store count is {state.count}
        </button> */}
        <button onClick={() => setCount(count + 1)}>
          local count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
