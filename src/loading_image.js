define(function () {
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
  return LoadingImage;
});