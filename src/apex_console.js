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

    if (! unsafeWindow.Ext) {
        loadScript('/EXT/ext-3.0.0/ext-core.js');
    }

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
}
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
            alert(result.errorText);
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

        var selectedTab = ApexConsole.defaultTab
        var selectedTab = localStorage.getItem('alc_SelectedTab');
        var defaultSelectedTab = getTabByText(selectedTab) || getFirstTab();
        dispatchClick(defaultSelectedTab);

        this.elements['result'] = logView.element;
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