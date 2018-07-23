**:warning:This package is currently not maintained.:warning:**

# twitter-sign

You can easily get the Twitter API signature.

## Install

```bash
$ npm install --save twitter-sign
```

## Usage

```javascript
const sign = require('twitter-sign');
```

```javascript
// case of requet-token
const { requestUrl, headers }
  = sign.getRequestTokenSign(apiKey, apiSecret, callbackUrl);
```

```javascript
// case of access-token
const { requestUrl, headers }
  = sign.getAccessTokenSign(apiKey, apiSecret, requestTokenSecret, oauthToken, oauthVerifier)
```

You just throw Post method to the URL you obtained.  
Don't forget to attach the acquired header.

Case using Request module

```javascript
request.post({ url: requestUrl, headers }, (error, response) => {
  // You can confirm tokens.
  console.log(response.body);
});
```

