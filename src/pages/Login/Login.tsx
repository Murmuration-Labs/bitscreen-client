import { bitscreenGoogleClientId } from 'config';
import React, { useEffect } from 'react';
import { Col, Form, Row } from 'react-bootstrap';
import { useGoogleLogin } from 'react-google-login';
import { toast } from 'react-toastify';
import { googleIcon, metamaskIcon } from 'resources/icons/index';
import LoggerService from 'services/LoggerService';
import { gapi } from 'gapi-script';
import './Login.css';

export default function Login(props) {
  const { connectMetamask, previousPath, setPreviousPath, loginWithGoogle } =
    props;

  useEffect(() => LoggerService.info('Loading Login page.'), []);

  useEffect(() => {
    if (previousPath) {
      setPreviousPath((currentPath) => {
        if (!currentPath) {
          return previousPath;
        } else {
          return currentPath;
        }
      });
    }
  }, [previousPath]);

  const onGoogleLoginFailure = () => {
    return toast.error(
      'Could not authenticate you at the moment using Google authentication system. Please try again later!'
    );
  };

  const onGoogleLoginSuccess = async (res: any) => {
    await loginWithGoogle(res.tokenId);
  };

  const { signIn: googleLogin } = useGoogleLogin({
    clientId: bitscreenGoogleClientId,
    onFailure: onGoogleLoginFailure,
    onSuccess: onGoogleLoginSuccess,
  });

  const startGoogleLogin = async () => {
    const initClient = () => {
      if (!gapi || !gapi.client) {
        toast.error('Could not reach Google API, please try again later!');
      } else {
        gapi.client.init({
          clientId: bitscreenGoogleClientId,
          scope: '',
        });
        googleLogin();
      }
    };

    gapi.load('client:auth2', initClient);
  };

  return (
    <>
      <Row
        className="mx-0"
        style={{
          paddingTop: 20,
          paddingBottom: 20,
        }}
      >
        <Col className="pl-0">
          <div className="ml-3">
            <Row>
              <Col>
                <Form.Label className="h4">
                  <strong>Welcome to BitScreen</strong>
                </Form.Label>
              </Col>
            </Row>
          </div>
          <div className="ml-3">
            <Row>
              <Col>
                <p className="login-subtitle">
                  Sign in with your Google account or your Metamask wallet
                </p>
              </Col>
            </Row>
          </div>
          <div className="ml-3">
            <div className="option-card mb-4">
              <div
                id="metamask-row"
                onClick={connectMetamask}
                className="d-flex justify-content-between align-items-center c-pointer no-text-select w-100 p-3"
              >
                <div className="d-flex align-items-center">
                  <div className="icon-container mr-3">
                    <img width={35} src={metamaskIcon}></img>
                  </div>
                  <div className="login-card-text">Sign in with Metamask</div>
                </div>
              </div>
            </div>
            <div className="option-card">
              <div
                id="google-row"
                onClick={startGoogleLogin}
                className="d-flex justify-content-between align-items-center c-pointer no-text-select w-100 p-3"
              >
                <div className="d-flex align-items-center">
                  <div className="icon-container mr-3">
                    <img width={30} src={googleIcon}></img>
                  </div>
                  <div className="login-card-text">Sign in with Google</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 ml-3">
            <Row>
              <Col>
                <p className="login-subtitle">
                  By using BitScreen, you agree to our{' '}
                  <a
                    href="https://github.com/Murmuration-Labs/bitscreen/blob/master/terms_of_service.md"
                    target="_blank"
                  >
                    Terms
                  </a>{' '}
                  & {` `}
                  <a
                    href="https://github.com/Murmuration-Labs/bitscreen/blob/master/privacy_policy.md"
                    target="_blank"
                  >
                    Privacy Policy
                  </a>
                  {'.'}
                </p>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>
    </>
  );
}
