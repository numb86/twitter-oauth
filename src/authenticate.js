const request = require('request'),
	crypto = require('crypto'),
  querystring = require('querystring');

const setting = require('./setting.js'),
  apiKey = require('./apiKey.js');

function getRequestToken(req, res){
	const requestUrl = 'https://api.twitter.com/oauth/request_token';
	const callbackUrl = setting.callbackUrl;
	const consumer_key = apiKey.consumer_key;
	const consumer_secret = apiKey.consumer_secret;
	const keyOfSign = encodeURIComponent(consumer_secret) + "&";

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

	const dataOfSign = (()=>{
		return encodeURIComponent('POST') + '&' + encodeURIComponent(requestUrl) + '&' + requestParams;
	})();

	const signature = (()=>{
		return crypto.createHmac('sha1', keyOfSign).update(dataOfSign).digest('base64');
	})();

	params['oauth_signature'] = encodeURIComponent(signature);

	let headerParams = Object.keys(params).map(item => {
		return item + '=' + params[item];
	});
	headerParams = headerParams.join(',');
	const headers = {
		'Authorization': 'OAuth ' + headerParams
	};

	const options = {
		url: requestUrl,
		headers: headers
	};
	request.post(options, function (error, response, body) {
		redirectToTwitter(req, res, body);
	});
};
function redirectToTwitter(req, res, requestToken){
  const tokens = querystring.parse(requestToken);
  req.session.oauth_token_secret = tokens.oauth_token_secret;
  const link = 'https://api.twitter.com/oauth/authenticate?oauth_token='+tokens.oauth_token;
  res.redirect(302, link);
};

function getAccessToken(req, res, requestTokenSecret, oauthToken, oauthVerifier){
	const requestUrl = 'https://api.twitter.com/oauth/access_token';
	const request_token_secret = requestTokenSecret;
	const consumer_key = apiKey.consumer_key;
	const consumer_secret = apiKey.consumer_secret;
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

	const dataOfSign = (()=>{
		return encodeURIComponent('POST') + '&' + encodeURIComponent(requestUrl) + '&' + requestParams;
	})();

	const signature = (()=>{
		return crypto.createHmac('sha1', keyOfSign).update(dataOfSign).digest('base64');
	})();

	params['oauth_signature'] = encodeURIComponent(signature);

	let headerParams = Object.keys(params).map(item => {
		return item + '=' + params[item];
	});
	headerParams = headerParams.join(',');
	const headers = {
		'Authorization': 'OAuth ' + headerParams
	};

	const options = {
		url: requestUrl,
		headers: headers
	};

	request.post(options, function (error, response, body) {
		checkAccessToken(req, res, body);
	});
};
function checkAccessToken(req, res, accessToken){
	const tokens = querystring.parse(accessToken);

	// アクセストークンを取得出来なかった場合の処理
	if(tokens.oauth_token === undefined){
		return res.redirect(302, 'failed-login');
	};

	req.session.oauth_token = tokens.oauth_token;
	req.session.oauth_token_secret = tokens.oauth_token_secret;
	req.session.user_id = tokens.user_id;
	req.session.screen_name = tokens.screen_name;

	renderLoginProcessing(req, res, tokens);
};
function renderLoginProcessing(req, res, tokens){

  const referer = (()=>{
    const regexp = new RegExp('^' + setting.host + '\/');
    if(req.session.referer && regexp.test(req.session.referer)){return req.session.referer };
    return setting.host;
  })();

  req.session = null;
  res.status(200);
  res.set(setting.commonResponseHeader());
  res.cookie('oauth_token', tokens.oauth_token, {maxAge: 10000});
  res.cookie('oauth_token_secret', tokens.oauth_token_secret, {maxAge: 10000});
  res.cookie('user_id', tokens.user_id, {maxAge: 10000});
  res.cookie('screen_name', tokens.screen_name, {maxAge: 10000});
  res.write(`
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="/css/component-modules.css">
  <title>ログイン処理中 - ${setting.APP_NAME}</title>
  ${setting.commonMetaTag('ログイン処理中 - ')}
</head>
<body>
  <script type="text/javascript" src="/js/loginProcessing-b.js"></script>
  <script>
    setTimeout(()=>{
      location.href='${referer}';
    }, 1000);
  </script>
  <div id="app"><p>ログイン処理中です…</p></div>
</body>
</html>
  `);
  res.end();
};


module.exports.getRequestToken = getRequestToken;
module.exports.getAccessToken = getAccessToken;
