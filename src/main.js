require(['css', 'apex_console', 'buffer_list'], function (none, ApexConsole, BufferList) {
  console.log('main.js');
  try {

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

  (function () {
      var linkElementsWrapper = document.querySelector('.linkElements');
      if (linkElementsWrapper) {
          var showConsole = function () {
              try {
                  apexConsole.show();
              } catch (e) {
                  console.log(e);
              }
          };
          var apexConsoleElement = document.createElement('a');
          apexConsoleElement.textContent = 'console';
          apexConsoleElement.href = 'javascript: void 0;';
          apexConsoleElement.addEventListener('click', showConsole, false);
          linkElementsWrapper.insertBefore(apexConsoleElement, linkElementsWrapper.firstChild);
      }
  })();
  } catch (e) {console.log(e);}
});