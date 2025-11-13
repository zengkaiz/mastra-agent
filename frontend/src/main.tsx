import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'urql'
import { client } from './graphql/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider value={client}>
      <App />
    </Provider>
  </React.StrictMode>,
)

