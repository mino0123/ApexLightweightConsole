var fs = require('fs');
const credentialpath = './credential.json';

module.exports = function (casper) {
    if (! fs.exists(credentialpath)) {
        throw new Error('Please write account information to credential.json');
    }

    var credential = require('../.' + credentialpath);

    casper.then(function open_login_page() {
        this.log('open login page...', 'debug');
        casper.open('https://login.salesforce.com');
    });
    casper.then(function fill_login_form() {
        this.fill('form[name=login]', {
            username: credential.username,
            pw: credential.password
        });
        this.click('button#Login');
        this.log('now logging in...', 'debug');
    });
    casper.waitFor(function () {
        return this.evaluate(function () {
            return !!document.querySelector('#phHeaderLogoImage');
        });
    });
    casper.then(function login_successful() {
        this.log('login successful.', 'info');
    });
};
