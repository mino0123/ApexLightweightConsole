var casper = require('casper').create({
        clientScripts: ['apexlightweightconsole.user.js']
    }),
    login = require('./lib/sfdclogin');

casper.start('about:blank');

require('./lib/sfdclogin')(casper);

casper.then(function test() {

    this.test.begin('console open', 1, function (test) {
        casper.then(function open_console() {
            this.evaluate(function () {
                window.apexConsole = new ApexConsole();
                var buffers = new BufferList(apexConsole);
                apexConsole.viewElements.push(buffers.element);
                apexConsole.buffers = buffers;
                apexConsole.show();
            });
        });
        casper.wait(10);
        casper.then(function assert() {
            test.assert(casper.evaluate(function () {
                return document.getElementsByClassName('apex-console').length > 0;
            }));
            test.done();
        });
    });

    this.test.begin('execute apex code', 1, function (test) {
        casper.evaluate(function () {
            apexConsole.elements.code.value = 'System.debug(1);';
            apexConsole.executeCode();
        });
        casper.waitFor(function () {
            return this.evaluate(function () {
                return document.getElementsByClassName('apex-console-result').length > 0;
            });
        });
        casper.then(function () {
            test.assert(this.evaluate(function result_view_is_showed() {
                return document.querySelectorAll('.apex-console-result tr').length > 0;
            }));
            test.done();
        });
    });

    this.test.begin('change result tab', 1, function (test) {
        clickResultTab(casper, 'USER_DEBUG');
        casper.then(function () {
            test.assert(casper.evaluate(function show_only_debug_log() {
                return document.querySelectorAll('.apex-console-result tr').length === 2;
            }));
            test.done();
            casper.exit();
        });
    });

});

function clickResultTab(casper, tabLabel) {
    casper.evaluate(function (tabLabel) {
        var links = document.querySelectorAll('.apex-console-result-tabs a');
        links = Array.prototype.slice.call(links);
        var tab = links.filter(function (el) {
            return el.textContent === tabLabel;
        })[0];
        var ev = document.createEvent('MouseEvents');
        ev.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        tab.dispatchEvent(ev);
    }, tabLabel);
}

casper.run();
