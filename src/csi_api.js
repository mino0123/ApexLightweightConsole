function ApexCSIAPI() {
    this.url = '/_ui/common/apex/debug/ApexCSIAPI';
}
ApexCSIAPI.createGeneralSuccessListener = function (callback) {
    return function (result) {
        callback(unsafeWindow.Util.evalAjaxServletOutput(result.responseText));
    }
};
ApexCSIAPI.generalFailureListener = function () {
    console.log(arguments);
};
ApexCSIAPI.prototype.config = function (callback) {
    unsafeWindow.Ext.Ajax.request({
        interval : 2E4,
        url      : this.url,
        params   : {action : 'CONFIG'},
        success  : ApexCSIAPI.createGeneralSuccessListener(callback),
        failure : ApexCSIAPI.generalFailureListener
    });
};
ApexCSIAPI.prototype.poll = function (callback) {
    var params = {
        action          : 'POLL',
        alreadyFetched  : '',
        fewmetLocations : JSON.stringify([]),
        openClasses     : '',
        traceLevels     : JSON.stringify({"APEX_CODE":"FINEST","VALIDATION":"INFO","WORKFLOW":"INFO","APEX_PROFILING":"INFO","DB":"INFO","CALLOUT":"INFO","VISUALFORCE":"INFO","SYSTEM":"DEBUG"}),
        workspace       : JSON.stringify([])
    };
    unsafeWindow.Ext.Ajax.request({
        interval : 2E4,
        url      : this.url,
        params   : params,
        success  : ApexCSIAPI.createGeneralSuccessListener(callback),
        failure : ApexCSIAPI.generalFailureListener
    });
};
ApexCSIAPI.prototype.getAlreadyFetched = function () {
    return (this.traces || []).map(function (trace) {
        return trace.id;
    });
};
ApexCSIAPI.prototype.executeAnonymous = function (anonymousBody, callback) {
    var params = {
        action          : 'EXEC',
        alreadyFetched  : this.getAlreadyFetched(),
        anonymousBody   : anonymousBody,
        startDate       : Date.now(),
        fewmetLocations : JSON.stringify([]),
        openEditors     : '',
        traceLevels     : JSON.stringify({"APEX_CODE":"FINEST","VALIDATION":"INFO","WORKFLOW":"INFO","APEX_PROFILING":"INFO","DB":"INFO","CALLOUT":"INFO","VISUALFORCE":"INFO","SYSTEM":"DEBUG"}),
        workspace       : JSON.stringify([])
    };
    return unsafeWindow.Ext.Ajax.request({
        interval : 2E4,
        url      : this.url,
        params   : params,
        success  : ApexCSIAPI.createGeneralSuccessListener(callback),
        failure  : ApexCSIAPI.generalFailureListener
    });
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
    unsafeWindow.Ext.Ajax.request({
        url     : this.url,
        params  : params,
        success : ApexCSIAPI.createGeneralSuccessListener(callback),
        failure : ApexCSIAPI.generalFailureListener
    });
};
ApexCSIAPI.prototype.getTrace = function (traceId, callback) {
    var params = {
        extent : 'steps',
        log    : traceId
    };
    unsafeWindow.Ext.Ajax.request({
        timeout : 60000,
        url     : '/servlet/debug/apex/ApexCSIJsonServlet',
        params  : params,
        success : createJsonSuccessListener(callback),
        failure : ApexCSIAPI.generalFailureListener
    });
    function createJsonSuccessListener(callback) {
        return function (result) {
            callback(JSON.parse(result.responseText));
        }
    }
};
