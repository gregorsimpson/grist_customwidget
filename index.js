  function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

var data = {
  message: ''
}

function handleError(err) {
  console.error('ERROR', err);
  data.message = String(err).replace(/^Error: /, '');
}

ready(async function() {
  Vue.config.errorHandler = handleError;
  app = new Vue({
    el: '#app',
    data: data
  });
});
