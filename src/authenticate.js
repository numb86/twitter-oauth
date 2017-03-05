const crypto = require('crypto'),
  querystring = require('querystring');

function getRequestTokenSign(key, secret, callback){
	const requestUrl = 'https://api.twitter.com/oauth/request_token';
	const callbackUrl = callback;
	const consumer_key = key;
	const consumer_secret = secret;
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

	return [requestUrl, headers];
};

// function redirectToTwitter(req, res, requestToken){
//   const tokens = querystring.parse(requestToken);
//   req.session.oauth_token_secret = tokens.oauth_token_secret;
//   const link = 'https://api.twitter.com/oauth/authenticate?oauth_token='+tokens.oauth_token;
//   res.redirect(302, link);
// };

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

	return [requestUrl, headers];

	// const options = {
	// 	url: requestUrl,
	// 	headers: headers
	// };

	// request.post(options, function (error, response, body) {
	// 	checkAccessToken(req, res, body);
	// });
};
// function checkAccessToken(req, res, accessToken){
// 	const tokens = querystring.parse(accessToken);

// 	// アクセストークンを取得出来なかった場合の処理
// 	if(tokens.oauth_token === undefined){
// 		return res.redirect(302, 'failed-login');
// 	};

// 	req.session.oauth_token = tokens.oauth_token;
// 	req.session.oauth_token_secret = tokens.oauth_token_secret;
// 	req.session.user_id = tokens.user_id;
// 	req.session.screen_name = tokens.screen_name;

// 	renderLoginProcessing(req, res, tokens);
// };



module.exports.getRequestTokenSign = getRequestTokenSign;
module.exports.getAccessTokenSign = getAccessTokenSign;
