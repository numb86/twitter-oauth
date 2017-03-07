require('dotenv').config();
const request = require('request');
const cookie = require('cookie');
const http = require('http');
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
    <a href="https://api.twitter.com/oauth/authenticate?oauth_token=${requestToken}">
      Go to the authentication page.
    </a>
  </p>
  <p>コールバックの設定について案内</p>
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
  }
  return new Error('typeが不正です。wrapGetSign');
}

const {
  NODE_API_KEY: envApiKey,
  NODE_API_KEY_SECRET: envApiSecret,
  NODE_CALLBACK_URL: envUrl,
} = process.env;

function resCallbackPage(req, res) {
  res.writeHead(200);
  res.write('callbakc page');
  res.end();
}

function resStartPage(req, res) {
  console.log(1);
  getSignPromise('request', { envApiKey, envApiSecret, envUrl })
    .then((result) => {
      request.post({ url: result[0], headers: result[1] }, (error, response) => {
        console.log(3);
        if (error) {
          return res.end();
        }
        const tokens = querystring.parse(response.body);
        res.writeHead(200);
        res.write(createRootHtml(tokens.oauth_token));
        return res.end();
      });
    })
    .catch(result => result);
}

const server = http.createServer();
server.on('request', (req, res) => {
  switch (req.url) {
    case '/callback': {
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

// const [requestUrl, headers] = authenticate.getRequestTokenSign(envApiKey, envApiSecret, envUrl);

// wrapRequest({ url: requestUrl, headers })
//   .then(result => querystring.parse(result.body))
//   .then((tokens) => {
//     server.on('request', (req, res) => {
//       const cookieObj = req.headers.cookie ? cookie.parse(req.headers.cookie) : null;
//       console.log(cookieObj);
//       res.writeHead(200, {
//         'Content-Type': 'text/html',
//         'Set-Cookie': [cookie.serialize('oauth_token_secret', tokens.oauth_token_secret, { maxAge: 180 })],
//       });
//       res.write(createRootHtml(tokens.oauth_token));
//       res.end();
//     });
//     server.listen(3000);
//   });

console.log('');
console.log('You can execute manual test in http://127.0.0.1:3000');
console.log('If test finished or test is unnecessary, enter ctrl + c.');
console.log('');
