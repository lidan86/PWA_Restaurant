if (navigator.serviceWorker) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(registration => {
      // console.log(document,document.getElementById('form'))
      // document.getElementsByTagName('form').onsubmit = () => {
      //   registration.sync.register('reviews-synchronization')
      //     .then(() => console.log('Reviews syncronization is registered'));
      // };

      console.log(`Registration successful in scope ${registration.scope}`);
      return registration;
    })
    .catch(error => {
      console.log(`Service worker registration failed with error: ${error}`);
    });
}
