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

    if (data) {
        data = {untitled:{name:this.generateNewName(), code:code || ''}};
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
