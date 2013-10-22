function ApexCSIAPI() {
    this.url = '/_ui/common/apex/debug/ApexCSIAPI';
}
ApexCSIAPI.createGeneralSuccessListener = function (callback) {
    return function (result) {
        var win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
        callback(win.Util.evalAjaxServletOutput(result.responseText));
    };
};
ApexCSIAPI.generalFailureListener = function () {
    console.log(arguments);
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
    var win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    win.Ext.Ajax.request({
        url     : this.url,
        params  : params,
        success : ApexCSIAPI.createGeneralSuccessListener(callback),
        failure : ApexCSIAPI.generalFailureListener
    });
};
