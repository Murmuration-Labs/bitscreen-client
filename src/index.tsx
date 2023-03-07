import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import reportWebVitals from './reportWebVitals';
import App from './pages/App';
import { SnackbarProvider } from 'notistack';
import { Router } from 'react-router-dom';
import history from './appHistory';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { bitscreenGoogleClientId } from 'config';

ReactDOM.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={bitscreenGoogleClientId}>
      <SnackbarProvider maxSnack={3}>
        <Router history={history}>
          <App />
        </Router>
      </SnackbarProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
