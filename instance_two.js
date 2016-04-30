var util = require('util'),
    express = require('express'),
    session = require('express-session'),
    compression = require('compression'),
    request = require('request'),
    querystring = require('querystring'),
    cookieParser = require('cookie-parser'),
    MemcachedStore = require('connect-memcached')(session);

var client_id = 'xxx';
var client_secret = 'xxx';
var redirect_uri = 'http://suggst.net/callback';

var generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(compression());

app.use(session({
    secret: generateRandomString(10),
    resave: false,
    saveUninitialized: false,
    store: new MemcachedStore({
        hosts: ['127.0.0.1:11211']
    })
}));

app.use(express.static(__dirname + '/public'))
    .use(cookieParser());

app.get('/authenticate', function (req, res) {

    var sess = req.session;

    if (sess.authdata) {
        var date = new Date();
        console.log('life left: ' + ((date.getTime() - sess.authdata.now) / 1000) + ' seconds');
        console.log('lifetime: ' + sess.authdata.lifetime);
        if (((date.getTime() - sess.authdata.now) / 1000) <= sess.authdata.lifetime) {
            console.log('yes, redirectin\'');
            return res.redirect('/#/suggst?' +
                querystring.stringify({
                    token: sess.authdata.token
                }));
        }
    }

    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    var scope = 'playlist-read-private user-library-read user-library-modify';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

app.get('/callback', function (req, res) {

    var sess = req.session;
    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#/suggst?' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var access_token = body.access_token,
                    refresh_token = body.refresh_token;

                var now = new Date();
                var time = now.getTime();

                sess.authdata = {
                    token: body.access_token,
                    lifetime: body.expires_in,
                    now: time
                };

                res.redirect('/#/suggst?' +
                    querystring.stringify({
                        token: access_token
                    }));

            } else {
                res.redirect('/#/suggst?' +
                    querystring.stringify({
                        error: 'invalid_token'
                    }));
            }
        });
    }
});

console.log('Listening on 8002');
app.listen(8002);