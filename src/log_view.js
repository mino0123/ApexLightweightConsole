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
        return
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
    for (var i = 0, len = params.length; i < len; i++) {
        var cell = document.createElement('th');
        cell.textContent = params[i];
        headerRow.appendChild(cell);
    }
    for (var i = 0, len = logs.length; i < len; i++) {
        var log = logs[i];
        if (! this.filter(log)) {
            continue;
        }
        var row = table.insertRow(table.rows.length);
        var cells = row.cells;
        for (var j = 0, paramLen = params.length; j < paramLen; j++) {
            var cell = row.insertCell(cells.length);
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
