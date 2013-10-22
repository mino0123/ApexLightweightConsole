var fs = require('fs'),
    page = require('casper').create({
        viewportSize: {
            width: 783,
            height: 600
        },
        clientScripts: [
            'apexlightweightconsole.user.js'
        ]
    });
const credentialpath = './credential.json';

(function () {
    if (! fs.exists(credentialpath)) {
        console.log('Please write account information to credential.json');
        return;
    }

    var credential = require(credentialpath);

    // CasperJS
    page.echo('open login page.');
    page.start('https://login.salesforce.com', function () {
        this.fill('form[name=login]', {
            username: credential.username,
            pw: credential.password
        });
        this.click('button#Login');
        this.echo('now logging in...');
        this.waitFor(loginSucceed, function () {
            this.echo('login successful.');
            this.evaluate(function () {
                window.apexConsole = new ApexConsole();
                var buffers = new BufferList(apexConsole);
                apexConsole.viewElements.push(buffers.element);
                apexConsole.buffers = buffers;
                apexConsole.show();
            });
            this.wait(10, function () {
                this.capture('screenshots/1.png');
                this.evaluate(function () {
                    apexConsole.elements.code.value = 'System.debug(1);';
                    apexConsole.executeCode();
                });
                this.capture('screenshots/2.png');
                this.waitFor(loadingImageUnvisible, function () {
                    clickLastTab();
                    this.capture('screenshots/3.png');
                    dblclickFirstBuffer(this);
                    this.wait(100, function () {
                        this.capture('screenshots/4.png');
                        inputBufferRename(this);
                        this.capture('screenshots/5.png');
                    });
                    this.echo('end.');
                });
            });
        });
    });

    page.run();

    function loginSucceed() {
        return this.evaluate(function () {
            return !!document.querySelector('#phHeaderLogoImage');
        });
    }
    function loadingImageUnvisible(argument) {
        return this.evaluate(function () {
            return apexConsole.loading.element.style.display === 'none';
        });
    }
    function clickLastTab() {
        page.evaluate(function () {
            var tabs = document.querySelectorAll('.apex-console-result-tabs a');
            var evt = document.createEvent('MouseEvents');
            evt.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            tabs[tabs.length - 1].dispatchEvent(evt);
        });
    }
    function dblclickFirstBuffer(page) {
        page.evaluate(function () {
            var items = document.querySelectorAll('.apex-console-buffers li');
            var evt = document.createEvent('MouseEvents');
            evt.initMouseEvent('dblclick', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            items[0].dispatchEvent(evt);
        });
    }
    function inputBufferRename(page) {
        page.evaluate(function () {
            var input = document.querySelector('.apex-console-buffers input');
            input.value = 'aaaaaaaaaaaaaaaaaaaaa';
            var evt = document.createEvent('MouseEvents');
            evt.initMouseEvent('blur', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            input.dispatchEvent(evt);
        });
    }
}());
