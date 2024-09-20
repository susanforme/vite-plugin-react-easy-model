/*
 * @Author: 冉志诚
 * @Date: 2024-09-19 14:34:30
 * @LastEditTime: 2024-09-19 14:38:35
 * @FilePath: \vite-plugin-react-easy-model\packages\test\src\components\AppBoy.tsx
 * @Description:
 */
import React from 'react';
import { useModel } from '~react-model';

const App: React.FC<AppProps> = () => {
  const { setState, state } = useModel('a');

  console.log('boy render');
  return (
    <div>
      <button
        onClick={() =>
          setState((state) => {
            return { ...state, count: state.count + 1 };
          })
        }>
        in child store count is {state.count}
      </button>
    </div>
  );
};

interface AppProps {}
export default App;
App.displayName = 'App';
