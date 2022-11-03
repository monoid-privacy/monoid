import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import OSSApp from './App';
import reportWebVitals from './reportWebVitals';

const cloud = false; // process.env.REACT_APP_CLOUD;
let App = OSSApp;

if (cloud) {
  // eslint-disable-next-line global-require
  App = require('./App').default;
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
