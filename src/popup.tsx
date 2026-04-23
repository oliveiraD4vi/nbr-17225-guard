import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import ptBR from 'antd/locale/pt_BR';
import { PopupApp } from './components/PopupApp';
import './styles/popup.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <ConfigProvider locale={ptBR}>
      <PopupApp />
    </ConfigProvider>
  </React.StrictMode>
);
