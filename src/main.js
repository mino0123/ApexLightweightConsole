var window = window || unsafeWindow;
var apexConsole = new ApexConsole();
unsafeWindow.apexConsole = apexConsole;
unsafeWindow.ApexConsole = ApexConsole;
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
    var linkElements = document.querySelector('.linkElements');
    if (!linkElements) {
        return;
    }
    var link = document.createElement('a');
    link.textContent = text;
    link.href = 'javascript: void 0;';
    link.addEventListener('click', onclick, false);
    linkElements.insertBefore(link, linkElements.firstChild);
}

addNavLink('console', function () {
    try {
        apexConsole.show();
    } catch (e) {
        console.log(e);
    }
});