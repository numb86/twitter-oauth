require('dotenv').config();
const request = require('request');
const querystring = require('querystring');
const authenticate = require('../src/authenticate');

// requestの結果をPromiseオブジェクトにするための関数
function wrapRequest(options) {
  return new Promise((resolve, reject) => {
    request.post(options, (error, response) => {
      if (error) { reject(error); } else { resolve(response); }
    });
  });
}

const {
  NODE_API_KEY: envApiKey,
  NODE_API_KEY_SECRET: envApiSecret,
  NODE_CALLBACK_URL: envUrl,
} = process.env;

describe('connect api', () => {
  test('request token', () => {
    const { requestUrl, headers }
      = authenticate.getRequestTokenSign(envApiKey, envApiSecret, envUrl);
    return wrapRequest({ url: requestUrl, headers })
      .then((result) => {
        expect(result.statusCode).toBe(200);
        const obj = querystring.parse(result.body);
        expect('oauth_token' in obj).toBeTruthy();
        expect('oauth_token_secret' in obj).toBeTruthy();
      });
  });
});
