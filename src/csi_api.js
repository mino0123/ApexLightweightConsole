function ApexCSIAPI() {
    this.url = '/_ui/common/apex/debug/ApexCSIAPI';
}
ApexCSIAPI.generalFailureListener = function () {
    console.log(arguments);
};
ApexCSIAPI.prototype.objectToParamStr = function (obj) {
    return Object.keys(obj).reduce(function (str, key) {
        return str + (str === '' ? '' : '&') + encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]);
    }, '');
};
ApexCSIAPI.prototype.open = function (entity, callback) {
    var workspace = [];
    workspace.push({
        id    : entity,
        name  : (new Date()).toISOString(),
        xtype : "logviewer"
    });
    var params = {
        action    : 'OPEN',
        entity    : entity,
        workspace : JSON.stringify(workspace)
    };
    var req = new XMLHttpRequest();
    req.open('POST', this.url, true);
    req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    req.onload = function (event) {
        var req = event.target;
        if (req.status === 200) {
            var response = req.responseText.replace(/^.*?\n/, '');// remove 'while(1);'
            callback(eval('(' + response + ')'));
        } else {
            ApexCSIAPI.generalFailureListener(req);
        }
    };
    req.send(this.objectToParamStr(params));
};
