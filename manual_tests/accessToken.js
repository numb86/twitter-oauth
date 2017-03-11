require('dotenv').config();
const request = require('request');
const cookie = require('cookie');
const http = require('http');
const url = require('url');
const querystring = require('querystring');
const authenticate = require('../src/authenticate');

function createRootHtml(requestToken) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>manual test</title>
</head>
<body>
  <p>access token signature</p>
  <p>
    <a href="https://api.twitter.com/oauth/authorize?oauth_token=${requestToken}">
      Go to the authentication page.
    </a>
  </p>
  <p>You need to set the CallbackUrl to http://127.0.0.1:3000.</p>
  <p>You can set environment variable in <code>./.env</code></p>
  <pre>
  <code>
NODE_API_KEY = hogehoge
NODE_API_KEY_SECRET = fugafuga
NODE_CALLBACK_URL = http://127.0.0.1:3000/callback
  </code>
  </pre>
</body>
</html>
`;
}
function createCallbackHtml(isGreen, result) {
  let heading = '';
  let message = '';
  if (isGreen) {
    heading = '<span style="color: #000000; background-color: #33ff66;">PATH</span>';
    message = `Authorized. Your account is ${result}.`;
  } else {
    heading = '<span style="color: #000000; background-color: red;">ERROR</span>';
    message = `Error Message:<br>${result}`;
  }
  return `
<!DOCTYPE html>
<html>
<head>
  <title>manual test</title>
</head>
<body>
  ${heading}
  <p>${message}</p>
  <p>Cookies have already been deleted.</p>
  <p><a href="http://127.0.0.1:3000">Try again.</a></p>
  <script>
    document.cookie = 'oauth_token_secret=; max-age=0';
  </script>
</body>
</html>
`;
}

// requestの結果をPromiseオブジェクトにするための関数
function wrapRequest(options) {
  return new Promise((resolve, reject) => {
    request.post(options, (error, response) => {
      if (error) { reject(error); } else { resolve(response); }
    });
  });
}

function getSignPromise(type, data) {
  if (type === 'request') {
    return new Promise((resolve) => {
      resolve(authenticate.getRequestTokenSign(data.envApiKey, data.envApiSecret, data.envUrl));
    });
  } else if (type === 'access') {
    return new Promise((resolve) => {
      resolve(authenticate.getAccessTokenSign(
        data.envApiKey, data.envApiSecret,
        data.requestTokenSecret, data.oauthToken, data.oauthVerifier
      ));
    });
  }
  return new Error('type is uncorrect. wrapGetSign');
}

function getQueryPromise(currentUrl) {
  return new Promise((resolve) => {
    const query = url.parse(currentUrl).query;
    const queries = querystring.parse(query);
    resolve(queries);
  });
}

const {
  NODE_API_KEY: envApiKey,
  NODE_API_KEY_SECRET: envApiSecret,
  NODE_CALLBACK_URL: envUrl,
} = process.env;

function resCallbackPage(req, res) {
  getQueryPromise(req.url)
    .then((queries) => {
      const cookieObj = req.headers.cookie ? cookie.parse(req.headers.cookie) : null;
      const requestTokenSecret = cookieObj.oauth_token_secret;
      const oauthToken = queries.oauth_token;
      const oauthVerifier = queries.oauth_verifier;
      if (requestTokenSecret && oauthToken && oauthVerifier) {
        return { requestTokenSecret, oauthToken, oauthVerifier };
      }
      return new Error('not found tokens');
    })
    .then((tokens) => {
      const { requestTokenSecret, oauthToken, oauthVerifier } = tokens;
      return getSignPromise('access', { envApiKey, envApiSecret, requestTokenSecret, oauthToken, oauthVerifier });
    })
    .then(result => wrapRequest({ url: result[0], headers: result[1] }))
    .then((result) => {
      if (result.statusCode !== 200) {
        res.writeHead(400);
        res.write(createCallbackHtml(false, result.body));
        return res.end();
      }
      const tokens = querystring.parse(result.body);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(createCallbackHtml(true, tokens.screen_name));
      return res.end();
    })
    .catch((result) => {
      res.writeHead(400);
      res.write(createCallbackHtml(false, result.body));
      return res.end();
    });
}

function resStartPage(req, res) {
  getSignPromise('request', { envApiKey, envApiSecret, envUrl })
    .then(result => wrapRequest({ url: result[0], headers: result[1] }))
    .then((result) => {
      if (result.statusCode !== 200) {
        res.writeHead(400);
        res.write('error');
        return res.end();
      }
      const tokens = querystring.parse(result.body);
      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Set-Cookie': [cookie.serialize('oauth_token_secret', tokens.oauth_token_secret, { maxAge: 180 })],
      });
      res.write(createRootHtml(tokens.oauth_token));
      return res.end();
    })
    .catch((result) => { res.end(); return result; });
}

const server = http.createServer();
server.on('request', (req, res) => {
  switch (true) {
    case /^\/callback?/.test(req.url): {
      resCallbackPage(req, res);
      break;
    }
    default: {
      resStartPage(req, res);
      break;
    }
  }
});
server.listen(3000);

console.log('');
console.log('You can execute manual test in http://127.0.0.1:3000');
console.log('If test finished or test is unnecessary, enter ctrl + c.');
console.log('');
