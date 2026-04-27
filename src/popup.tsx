import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import { PopupApp } from './components/PopupApp'
import './styles/theme.css'
import './styles/popup.css'

const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <ConfigProvider
      locale={ptBR}
      theme={{
        token: {
          colorPrimary: 'var(--guard-color-primary)',
          colorBgBase: 'var(--guard-color-page-bg)',
          colorBgContainer: 'var(--guard-color-surface)',
          colorBorder: 'var(--guard-color-border)',
          colorTextBase: 'var(--guard-color-text-primary)',
          colorTextSecondary: 'var(--guard-color-text-secondary)',
          borderRadius: 8,
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        },
      }}
    >
      <PopupApp />
    </ConfigProvider>
  </React.StrictMode>,
)
