// ==UserScript==
// @include        https://*salesforce.com/*
// @name           ApexLightweightConsole
// @noframes
// ==/UserScript==

function ApexConsole() {
  this.initialized  = false; // boolean
  this.showed       = false; // boolean
  this.elements     = {};    // Hash of Element {content,code,bg,execute,result}
  this.logView      = null;  // ApexLogView
  this.viewElements = [];    // Array of Element. used show/hide
  this.events       = [];    // [{oninit, onexe, onhide}]
}
ApexConsole.prototype.fire = function apex_console_fire(name) {
    this.events.forEach(callEvent);
    function callEvent(e) {
        var f = e[name];
        f && f();
    }
};
ApexConsole.prototype.initialize = function apex_console_initialize() {
    var content = this.elements.content = document.createElement('div'),
        code    = this.elements.code    = document.createElement('textarea'),
        bg      = this.elements.bg      = document.createElement('div'),
        execute = this.elements.execute = document.createElement('button'),
        loading = this.loading          = new LoadingImage();

    this.fire('oninit');

    content.classList.add('apex-console');
    code.classList.add('apex-console-code');
    bg.classList.add('apex-console-bg');
    execute.classList.add('apex-console-execute');
    execute.classList.add('btn');

    content.appendChild(code);
    content.appendChild(execute);
    loading.insertAfter(execute);

    var that = this;

    bg.addEventListener('click', function apex_console_bgclick() {
        that.hide();
    }, false);
    code.addEventListener('keydown', function (event) {
        if (event.ctrlKey && event.keyCode === event.DOM_VK_RETURN) {
            that.executeCode();
        }
    }, false);

    execute.textContent = 'execute  [Ctrl+Enter]';
    execute.addEventListener('click', function apex_console_executeclick() {
        try {
            that.executeCode();
        } catch (e) {
            console.log(e);
        }
    });

    this.viewElements.push(content);
    this.viewElements.push(bg);

    this.initialized = true;
};
ApexConsole.prototype.appendToBody = function apex_console_appendToBody(element) {
    document.body.appendChild(element);
};
ApexConsole.prototype.removeFromBody = function apex_console_removeFromBody(element) {
    if (element.parentNode) {
        document.body.removeChild(element);
    }
};
ApexConsole.prototype.show = function apex_console_show() {
    if (! this.initialized) {
        this.initialize();
    }

    this.viewElements.forEach(this.appendToBody);

    var code = this.elements.code;
    setTimeout(function () { // すぐにselectすると
        code.select();       // テキストエリアの表示がおかしくなる
    }, 0);                   //

    this.showed = true;
};
ApexConsole.prototype.setCode = function apex_console_set_code(value) {
    var code = this.elements.code;
    code.value = value;
    code.style.height = Math.max(code.scrollHeight, 300) + 'px';
};
ApexConsole.prototype.hide = function apex_console_hide() {
    this.fire('onhide');
    this.viewElements.forEach(this.removeFromBody);
    this.showed = false;
};
ApexConsole.prototype.toggle = function apex_console_toggle() {
    if (this.showed) {
        this.hide();
    } else {
        this.show();
    }
};
ApexConsole.prototype.executeCode = function apex_console_executecode() {
    var code = this.elements.code.value;

    this.fire('onexe');

    var that = this;
    var executeId;
    var csi = new ApexCSIAPI();
    Tooling.executeAnonymous(code, onExecuteAnonymousEnd);

    this.loading.show();

    function onExecuteAnonymousEnd(result) {
        if (result.success) {
            var query = 'SELECT Id, Application, Status, Operation, StartTime, LogLength, LogUserId, LogUser.Name FROM ApexLog ORDER BY StartTime DESC LIMIT 1';
            Tooling.query(query, function (qr) {
                executeId = qr.records[0].Id;
                csi.open(executeId, onOpenEnd);
            });
        } else {
            if (result.compiled) {
                alert(result.exceptionMessage);
            } else {
                alert(result.compileProblem);
            }
            that.loading.hide();
        }
    }
    function onOpenEnd(result) {
        Tooling.getTrace(executeId, onGetTraceEnd);
    }
    function onGetTraceEnd(result) {
        that.renderResult(result);
        that.loading.hide();
    }
};
ApexConsole.prototype.renderResult = function (logs) {
    var logView = this.logView;
    if (! logView) {
        logView = this.logView = new ApexLogView();
        logView.logs = logs;

        var selectedTab = localStorage.getItem('alc_SelectedTab');
        var defaultSelectedTab = getTabByText(selectedTab) || getFirstTab();
        dispatchClick(defaultSelectedTab);

        this.elements.result = logView.element;
        this.elements.content.appendChild(logView.element);
    } else {
        logView.logs = logs;
        logView.render();
    }

    function getTabByText(text) {
        var tabs = logView.element.querySelectorAll('li a');
        for (var i = 0, len = tabs.length; i < len; i++) {
            var t = tabs[i];
            if (t.textContent === text) {
                return t;
            }
        }
    }
    function getFirstTab() {
        return logView.element.querySelector('li a');
    }
    function dispatchClick(element) {
        var event = document.createEvent('MouseEvents');
        event.initEvent("click", false, true);
        element.dispatchEvent(event);
    }
};
function BufferList(apexConsole) {
    var element = this.element = document.createElement('ul');
    element.classList.add('apex-console-buffers');
    this.buffers = {};
    this.console = apexConsole;
    this.load();
    this.render();
    this.selectedName = undefined;
    var that = this;
    apexConsole.events.push({
        oninit: function oninit() {
            setTimeout(function () {
                apexConsole.elements.content.insertBefore(element, apexConsole.elements.execute);
            }, 0);
            var bs = that.buffers;
            for (var i in bs) {
                that.select(bs[i].name);
                return;
            }
        },
        onexe: function onsave() {
            that.save();
        }
    });
}
BufferList.prototype.newBuffer = function (params) {
    var that = this;
    var buf = {};
    buf.name = params.name;
    buf.code = params.code;
    buf.onrename = params.onrename;
    [rename, remove, render].forEach(setMethod);
    return buf;

    function setMethod(fn) {
        buf[fn.name] = fn;
    }
    function rename(name) {
        buf.name = name;
        buf.onrename && buf.onrename();
        that.render();
    }
    function remove() {
        delete that.buffers[buf.name];
        that.render();
    }
    function render(target) {
        var element = buf.element;
        if (! element) {
            buf.element = target.newListItem(buf.name, that.createClickListener(buf));
        }
        that.element.appendChild(buf.element);
    }
};
BufferList.prototype.load = function () {
    var code = localStorage.getItem('alc_Code'),
        data = JSON.parse(code),
        buffers = this.buffers;

    if (!data) {
        var name = this.generateNewName();
        data = {};
        data[name] = {name:name, code:code || ''};
    }

    for (var i in data) {
        var buf = data[i];
        //buffers[buf.name] = this.newBuffer(buf);
        buffers[buf.name] = new Tab(this, buf.name, buf.code);
    }
};
BufferList.prototype.save = function () {
    this.flushCode();
    localStorage.setItem('alc_Code', JSON.stringify(this.buffers));
};
BufferList.prototype.render = function () {
    var element = this.element,
        buffers = this.buffers,
        that = this;

    element.innerHTML = '';
    for (var i in buffers) {
        buffers[i].render(this);
    }

    var add = this.newListItem(' + ', function addBuffer() {
        var newName = that.generateNewName();//,
            //newBuf = that.newBuffer({name: newName, code: ''});

        that.buffers[newName] = new Tab(that, newName, '');
        that.render();
    });
    this.element.appendChild(add);

    this.save();
};
BufferList.prototype.NEW_BUFFER_NAME = 'code';
BufferList.prototype.generateNewName = function () {
    var buffers = this.buffers;
    var count = 0;
    while (this.NEW_BUFFER_NAME + (++count) in buffers) {}
    return this.NEW_BUFFER_NAME + count;
};
BufferList.prototype.newListItem = function (text, onclick) {
    var element = document.createElement('li');
    var a = document.createElement('a');
    a.textContent = text;
    a.href = 'javascript: void 0;';
    element.appendChild(a);
    element.addEventListener('click', onclick, false);
    return element;
};
BufferList.prototype.createClickListener = function (buf) {
    var that = this;
    return function () {
        that.select(buf.name);
    };
};
BufferList.prototype.remove = function (name) {
    delete this.buffers[name];
    this.render();
    if (! this.buffers[this.selectedName]) {
        for (var i in this.buffers) {
            this.select(this.buffers[i].name);
            return;
        }
    }
};
BufferList.prototype.add = function (name) {
    this.buffers[name] = {name:name, code:'', element:null};
    this.render();
};
BufferList.prototype.select = function (name) {
    var buffers = this.buffers,
        acon = this.console;

    this.save();
    this.selectedName = name;
    for (var i in buffers) {
        var buf = buffers[i];
        if (name === i) {
            acon.setCode(buf.code);
            buf.element.classList.add('selected');
        } else {
            buf.element.classList.remove('selected');
        }
    }
};
BufferList.prototype.flushCode = function () {
    if (this.selectedName && this.buffers[this.selectedName]) {
        this.buffers[this.selectedName].code = this.console.elements.code.value;
    }
};
function Tab(list, name, code) {
    this.list = list;
    this.name = name || code;
    this.code = code || '';
}
Tab.prototype.editStart = function() {
    this.editing = true;
    this.render();
};
Tab.prototype.editEnd = function() {
    var oldName = this.name;
    this.name = this.input.value;
    this.editing = false;
    this.input = null;
    delete this.list.buffers[oldName];
    this.list.buffers[this.name] = this;
    this.list.save();
    this.render();
};
Tab.prototype.remove = function() {
    this.list.remove(this.name);
};
Tab.prototype.render = function() {
    var element = this.element,
        that = this;
    if (! element) {
        element = this.element = document.createElement('li');
        element.addEventListener('click', function() {
            that.list.select(that.name);
        }, false);
        element.addEventListener('dblclick', function() {
            that.editStart();
        }, false);
    }
    element.innerHTML = '';
    if (! this.editing) {
        var a = document.createElement('a');
        a.textContent = this.name;
        a.href = 'javascript: void 0;';
        element.appendChild(a);
        var x = document.createElement('a');
        x.textContent = 'X';
        x.className = 'remove';
        x.href = 'javascript: void 0;';
        x.addEventListener('click', function() {
            that.remove();
        }, false);
        element.appendChild(x);
    } else {
        var input = this.input = document.createElement('input');
        input.type = 'text';
        input.value = this.name;
        input.addEventListener('blur', function() {
            that.editEnd();
        }, false);
        input.addEventListener('keypress', function(event) {
            if (event.keyCode === KeyboardEvent.DOM_VK_RETURN) {
                that.editEnd();
            }
        }, false);
        element.appendChild(input);
        input.select();
    }
    if (! element.parentNode) {
        this.list.element.appendChild(element);
    }
    return element;
};
Tab.prototype.toJSON = function() {
    return {name: this.name, code: this.code};
};

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

var css = '' +
'    .apex-console {' +
'        position         : absolute;' +
'        top              : 30px;' +
'        left             : 5%;' +
'        z-index          : 2001;' +
'        width            : 88%;' +
'        min-width        : 500px;' +
'        max-width        : 1000px;' +
'        background-color : white;' +
'    }' +
'    .apex-console-code {' +
'        height      : 300px;' +
'        width       : 89%;' +
'        resize      : both;' +
'        font-family : inconsolata;' +
'    }' +
'    .apex-console-bg {' +
'        position         : fixed;' +
'        top              : 0;' +
'        left             : 0;' +
'        opacity          : 0.5;' +
'        background-color : black;' +
'        height           : 100%;' +
'        width            : 100%;' +
'        z-index          : 2000;' +
'    }' +
'    .apex-console-execute {' +
'        margin-left      : 0 !important;' +
'        width            : 10%;' +
'    }' +
'    .apex-console-result {' +
'        width            : 100%;' +
'        padding-bottom   : 20px;' +
'    }' +
'    .apex-console-result table {' +
'        width            : 100%;' +
'        border-collapse  : collapse;' +
'    }' +
'    .apex-console-result th {' +
'        text-align    : center;' +
'        border-bottom : 1px solid #333;' +
'    }' +
'    .apex-console-result td {' +
'        border     : 1px dotted #CCC;' +
'    }' +
'    .apex-console-result-tabs {' +
'        display : inline-block;' +
'        background-color: white;' +
'        margin: 0;' +
'        padding: 0;' +
'    }' +
'    .apex-console-result-tabs li {' +
'        list-style-type : none;' +
'        float           : left;' +
'        margin          : 0.3em 0.1em;' +
'        border          : 1px gray solid;' +
'        padding         : 0px;' +
'        min-width       : 80px;' +
'    }' +
'    .apex-console-result-tabs li.selected {' +
'        background-color : #9999FF;' +
'    }' +
'    .apex-console-result-tabs li a {' +
'        text-decoration : none;' +
'        display         : block;' +
'        padding         : 0.5em;' +
'        cursor          : pointer;' +
'    }' +
'    .apex-console-result-tabs li a:hover {' +
'        background-color : #9999FF;' +
'        color            : #EFEFEF;' +
'    }' +
    '' +
'    .apex-console-buffers {' +
'        display          : inline-block;' +
'        margin           : 0;' +
'        padding          : 0;' +
'        vertical-align   : top;' +
'        width            : 10%;' +
'        font-family      : inconsolata;' +
'        font-weight      : bold;' +
'    }' +
'    .apex-console-buffers li {' +
'        list-style-type  : none;' +
'        height           : 30px;' +
'        margin           : 0;' +
'        vertical-align   : middle;' +
'        min-width        : -moz-max-content;' +
'        min-width        : -webkit-max-content;' +
'        min-width        : max-content;' +
'        border-radius    : 0 10px 10px 0;' +
'        background-color : #EEC;' +
'        box-shadow       : 2px 2px 3px #CCC;' +
'        clear            : both;' +
'    }' +
'    .apex-console-buffers li.selected {' +
'        box-shadow : none;' +
'        background-color : #FFD;' +
'    }' +
'    .apex-console-buffers li.selected a {' +
'        border-radius    : 0 10px 10px 0;' +
'    }' +
'    .apex-console-buffers li a {' +
'        text-decoration : none;' +
'        padding         : 0.5em;' +
'        cursor          : default;' +
'        margin          : auto;' +
'        display         : inline-block;' +
'    }' +
'    .apex-console-buffers input {' +
'        margin          : auto;' +
'        display         : inline-block;' +
'        width           : 100%;' +
'        height          : 100%;' +
'    }' +
'    .apex-console-buffers .remove {' +
'        float           : right;' +
'    }';

if (typeof GM_addStyle === 'function') {
    GM_addStyle(css);
} else {
    (function () {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.textContent = css;
        document.head.appendChild(style);
    }());
}

function LoadingImage() {
  var element = this.element  = document.createElement('img');
  element.src                 = '/img/loading.gif';
  element.style.verticalAlign = 'middle';
  element.style.display       = 'none';
}
LoadingImage.prototype.insertAfter = function (target) {
    var parent = target.parentNode;
    parent.insertBefore(this.element, target.nextSibiling);
};
LoadingImage.prototype.show = function () {
    this.element.style.display = 'inline';
};
LoadingImage.prototype.hide = function () {
    this.element.style.display = 'none';
};

function ApexLogView() {
    this.logs = null;

    this.element = document.createElement('div');
    this.element.classList.add('apex-console-result');

    var that = this;
    var tabs = this.tabs = document.createElement('ul');
    var tabElements = [];
    tabs.classList.add('apex-console-result-tabs');
    for (var i in ApexLogView.filters) {
        tabs.appendChild(createFilterTab(i, ApexLogView.filters[i]));
    }
    this.element.appendChild(tabs);

    this.table = document.createElement('table');
    this.element.appendChild(this.table);

    function removeSelected(e) {
        e.classList.remove('selected');
    }
    function createFilterTab(label, filter) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.textContent = label;
        a.addEventListener('click', function () {
            localStorage.setItem('alc_SelectedTab', label);
            tabElements.forEach(removeSelected);
            li.classList.add('selected');
            that.applyFilter(filter);
        }, false);
        li.appendChild(a);
        tabElements.push(li);
        return li;
    }
    function createTreeViewTab() {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.textContent = label;
        a.addEventListener('click', function () {
            localStorage.setItem('alc_SelectedTab', label);
            tabElements.forEach(removeSelected);
            li.classList.add('selected');



        }, false);
        li.appendChild(a);
        tabElements.push(li);
        return li;
    }
}

function EventPair(start, end) {
    this.start = start;
    this.end   = end;
}

new EventPair('EXECUTION_STARTED', 'EXECUTION_FINISHED');
new EventPair('CODE_UNIT_STARTED', 'CODE_UNIT_FINISHED');
new EventPair('SYSTEM_CONSTRUCTOR_ENTRY', 'SYSTEM_CONSTRUCTOR_EXIT');
new EventPair('SYSTEM_METHOD_ENTRY', 'SYSTEM_METHOD_EXIT');

var LogEvent = {
    isEndEvent : function (event) {
        return;
    }
};
function LogThreeView(logs) {
    var stack = [];

    for (var i = 0, len = logs.length; i < len; i++) {



    }

}
LogThreeView.plusImage = function () {
    var img = document.createElement('img');
    img.src = '/img/alohaSkin/setup/setup_plus_lev1.gif';
    return img;
};
LogThreeView.minusImage = function () {
    var img = document.createElement('img');
    img.src = '/img/alohaSkin/setup/setup_minus_lev1.gif';
    return img;
};

ApexLogView.prototype.render = function() {
    var params = 'category|event|file|lineNumber|iteration|sequenceNumber|frameSequenceNumber|detail|isExecutable|method|nanosSinceRequestStart'.split('|');
    params = 'event|method|detail'.split('|');
    var logs = this.logs,
        table = this.table;
    table.innerHTML = '';

    var headerRow = table.insertRow(0);
    var i, cell;
    for (i = 0, len = params.length; i < len; i++) {
        cell = document.createElement('th');
        cell.textContent = params[i];
        headerRow.appendChild(cell);
    }
    for (i = 0, len = logs.length; i < len; i++) {
        var log = logs[i];
        if (! this.filter(log)) {
            continue;
        }
        var row = table.insertRow(table.rows.length);
        var cells = row.cells;
        for (var j = 0, paramLen = params.length; j < paramLen; j++) {
            cell = row.insertCell(cells.length);
            cell.innerHTML = log[params[j]];
        }
    }
};
ApexLogView.filters = {
    EXECUTABLE : function (log) {
        return log.isExecutable;
    },
    USER_DEBUG : function (log) {
        return log.event === 'USER_DEBUG';
    },
    METHOD_ENTRY : function (log) {
        return log.event === 'SYSTEM_METHOD_ENTRY' ||
               log.event === 'SYSTEM_CONSTRUCTOR_ENTRY' ||
               ApexLogView.filters.EXCEPTION(log);
    },
    EXCEPTION : function (log) {
        return log.event === 'EXCEPTION_THROWN' || log.event === 'FATAL_ERROR';
    },
    LIMIT_USAGE_FOR_NS : function (log) {
        return log.event === 'LIMIT_USAGE_FOR_NS';
    },
    ALL : function () {return true;}
};
ApexLogView.prototype.applyFilter = function(filter) {
    this.filter = filter;
    this.render();
};

var Tooling = {};
Tooling.baseUrl = '/services/data/v29.0/tooling/';
Tooling.send = function (method, url, params, callback) {
    var req = new XMLHttpRequest();
    req.open(method, this.baseUrl + url);
    req.onload = function (event) {
        var req = event.target;
        var res = req.responseText;
        callback(JSON.parse(res), event);
    };
    var win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    req.setRequestHeader('Accept', 'application/json');
    req.setRequestHeader('Authorization', 'OAuth ' + win.ApiUtils.getSessionId());
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
var window = window || unsafeWindow;
var apexConsole = new ApexConsole();
unsafeWindow.apexConsole = apexConsole;
unsafeWindow.ApexConsole = ApexConsole;
var buffers = new BufferList(apexConsole);
apexConsole.buffers = buffers;

window.addEventListener('keydown', function windowKeyDownListener(event) {
    try {
        if (event.ctrlKey && event.shiftKey && event.keyCode === event.DOM_VK_X) {
            apexConsole.toggle();
        }
    } catch (e) {
        console.log(e);
    }
}, false);

function addNavLink(text, onclick) {
    var parent;
    parent = document.querySelector('.linkElements') ||
            document.querySelector('#toolbar');
    if (!parent) {
        return;
    }
    var link = document.createElement('a');
    link.style.color = '#FFFFFF';
    link.textContent = text;
    link.href = 'javascript: void 0;';
    link.addEventListener('click', onclick, false);
    parent.insertBefore(link, parent.firstChild);
}

addNavLink('console', function () {
    try {
        apexConsole.show();
    } catch (e) {
        console.log(e);
    }
});