const crypto = require('crypto');

function getRequestTokenSign(key, secret, callback) {
  const requestUrl = 'https://api.twitter.com/oauth/request_token';
  const callbackUrl = callback;
  const consumer_key = key;
  const consumer_secret = secret;
  const keyOfSign = encodeURIComponent(consumer_secret) + '&';

  let params = {
    oauth_callback: callbackUrl,
    oauth_consumer_key: consumer_key,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: (()=>{
      const date = new Date();
      return Math.floor( date.getTime() / 1000 ) ;
    })(),
    oauth_nonce: (()=>{
      const date = new Date();
      return date.getTime();
    })(),
    oauth_version: '1.0'
  };

  const dataOfSign = buildDataOfSign(params, requestUrl);
	params['oauth_signature'] = buildSignature(keyOfSign, dataOfSign);
	const headers = {
		'Authorization': 'OAuth ' + buildHeaderParams(params)
	};

	return [requestUrl, headers];
};

function getAccessTokenSign(key, secret, requestTokenSecret, oauthToken, oauthVerifier){
	const requestUrl = 'https://api.twitter.com/oauth/access_token';
	const request_token_secret = requestTokenSecret;
	const consumer_key = key;
	const consumer_secret = secret;
	const keyOfSign = encodeURIComponent(consumer_secret) + "&" + encodeURIComponent(request_token_secret);

	let params = {
		oauth_consumer_key: consumer_key,
		oauth_token: oauthToken,
		oauth_signature_method: 'HMAC-SHA1',
		oauth_timestamp: (()=>{
			const date = new Date();
			return Math.floor( date.getTime() / 1000 ) ;
		})(),
		oauth_verifier: oauthVerifier,
		oauth_nonce: (()=>{
			const date = new Date();
			return date.getTime();
		})(),
		oauth_version: '1.0'
	};

  const dataOfSign = buildDataOfSign(params, requestUrl);
  params['oauth_signature'] = buildSignature(keyOfSign, dataOfSign);
	const headers = {
		'Authorization': 'OAuth ' + buildHeaderParams(params)
	};

	return [requestUrl, headers];
}

function buildDataOfSign(params, requestUrl) {
  Object.keys(params).forEach(item => {
    params[item] = encodeURIComponent(params[item]);
  });
  let requestParams = Object.keys(params).map(item => {
    return item + '=' + params[item];
  });
  requestParams.sort((a,b) => {
    if( a < b ) return -1;
    if( a > b ) return 1;
    return 0;
  });
  requestParams = encodeURIComponent(requestParams.join('&'));
  return encodeURIComponent('POST') + '&' + encodeURIComponent(requestUrl) + '&' + requestParams;
}

function buildSignature(keyOfSign, dataOfSign) {
  const signature = crypto.createHmac('sha1', keyOfSign).update(dataOfSign).digest('base64');
  return encodeURIComponent(signature);
}

function buildHeaderParams(params) {
  const headerParams = Object.keys(params).map(item => {
    return item + '=' + params[item];
  });
  return headerParams.join(',');
}

module.exports.getRequestTokenSign = getRequestTokenSign;
module.exports.getAccessTokenSign = getAccessTokenSign;
