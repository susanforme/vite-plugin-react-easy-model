/*
 * @Author: 冉志诚
 * @Date: 2024-09-19 14:34:30
 * @LastEditTime: 2024-09-19 14:34:44
 * @FilePath: \vite-plugin-react-easy-model\packages\test\src\components\AppBoy.tsx
 * @Description:
 */
import React from 'react';

const App: React.FC<AppProps> = React.memo(() => {
  console.log('memoChild render');
  return <div></div>;
});

interface AppProps {}
export default App;
App.displayName = 'App';
