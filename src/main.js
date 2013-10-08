var window = window || unsafeWindow;
var apexConsole = new ApexConsole();
unsafeWindow.apexConsole = apexConsole;
unsafeWindow.ApexConsole = ApexConsole;
unsafeWindow.Tooling = Tooling;
unsafeWindow.ApexCSIAPI = ApexCSIAPI;
unsafeWindow.csi = new ApexCSIAPI();
var buffers = new BufferList(apexConsole);
apexConsole.viewElements.push(buffers.element);
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