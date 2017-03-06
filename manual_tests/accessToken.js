require('dotenv').config();
const http = require('http');
const request = require('request');
const querystring = require('querystring');
const authenticate = require('../src/authenticate');

const server = http.createServer();

function createRootHtml(requestToken) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>manual test</title>
</head>
<body>
  <p>access token signature</p>
  <a href="https://api.twitter.com/oauth/authenticate?oauth_token=${requestToken}">
    Go to the authentication page.
  </a>
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

const {
  NODE_API_KEY: envApiKey,
  NODE_API_KEY_SECRET: envApiSecret,
  NODE_CALLBACK_URL: envUrl,
} = process.env;

const [requestUrl, headers] = authenticate.getRequestTokenSign(envApiKey, envApiSecret, envUrl);

wrapRequest({ url: requestUrl, headers })
  .then(result => querystring.parse(result.body))
  .then((tokens) => {
    server.on('request', (req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(createRootHtml(tokens.oauth_token));
      res.end();
    });
    server.listen(3000);
  });

console.log('');
console.log('You can execute manual test in http://127.0.0.1:3000');
console.log('If test finished or test is unnecessary, enter ctrl + c.');
console.log('');
