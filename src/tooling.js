var Tooling = {};
Tooling.baseUrl = '/services/data/v29.0/tooling/';
Tooling.getSessionIdInCookie = function () {
    var cookies = document.cookie.split('; ').reduce(function (o, c) {
        var namevalue = c.split('=');
        o[namevalue[0]] = namevalue[1];
        return o;
    }, {});
    return cookies.sid;
};
Tooling.send = function (method, url, params, callback) {
    var req = new XMLHttpRequest();
    req.open(method, this.baseUrl + url);
    req.onload = function (event) {
        var req = event.target;
        var res = req.responseText;
        callback(JSON.parse(res), event);
    };
    req.setRequestHeader('Accept', 'application/json');
    req.setRequestHeader('Authorization', 'OAuth ' + this.getSessionIdInCookie());
    req.setRequestHeader('Content-Type', 'application/json');
    req.send(params);
};
Tooling.urlParameters = function (hash) {
    return Object.keys(hash).reduce(function (s, key) {
        s += !s ? '' : '&';
        return s + encodeURIComponent(key) + '=' + encodeURIComponent(hash[key]);
    }, '');
};
Tooling.get = function (url, params, callback) {
    params = params || {};
    this.send('GET', url + '?' + this.urlParameters(params), null, callback);
};
Tooling.post = function (url, params, callback) {
    params = params || {};
    this.send('POST', url, this.urlParameters(params), callback);
};
Tooling.executeAnonymous = function (anonymousBody, callback) {
    this.get('executeAnonymous/', {
        anonymousBody: anonymousBody,
        aciton: 'EXEC',
        startDate: Date.now(),
        openObjects: ''
    }, callback);
};
Tooling.query = function (q, callback, _dc) {
    this.get('query/', {q: q}, callback);
};

// Tooling外のAPI。ほかに置き場所がない&リクエスト内容がToolingに類似するためここに置く。
Tooling.getTrace = function (logId, callback) {
    var url = '/servlet/debug/apex/ApexCSIJsonServlet';
    var params = {
        extent : 'steps',
        log: logId
    };
    var _baseUrl = this.baseUrl;
    this.baseUrl = '';
    this.get(url, params, callback);
    this.baseUrl = _baseUrl;
};