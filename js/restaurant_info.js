import { DBHelper } from './dbhelper';

let restaurant, reviews;
let newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', event => {
  newMap = initMap(); //added
});

/**
 * Initialize leaflet map
 */
const initMap = () => {
  fetchRestaurantFromURL((error, restaurant = self.restaurant) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      if (!Array.isArray(restaurant)) {
        const map = L.map('map', {
          center: [self.restaurant.latlng.lat, self.restaurant.latlng.lng],
          zoom: 16,
          scrollWheelZoom: false,
        });
        L.tileLayer(
          'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}',
          {
            mapboxToken:
            '<your MAPBOX API KEY HERE>',
            maxZoom: 18,
            attribution:
              'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
              '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
              'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            id: 'mapbox.streets',
          }
        ).addTo(map);
        fillBreadcrumb();
        DBHelper.mapMarkerForRestaurant(self.restaurant, map);
      }
    }
  });
  fetchReviewsFromURL((error, reviews = self.reviews) => {
    if (error) {
      // Got an error!
      console.error(error);
    }
  });
  navigator.onLine ? DBHelper.synchronizeOfflineReviews() : null;

  return map;
};

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = callback => {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  // const id = getParameterByName('id');
  if (!id) {
    // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant = self.restautant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

const fetchReviewsFromURL = callback => {
  if (self.reviews) {
    // restaurant already fetched!
    callback(null, self.reviews);
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  // const id = getParameterByName('id');
  if (!id) {
    // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchReviewsByRestaurantId(id, (error, reviews = self.reviews) => {
      self.reviews = reviews;
      if (!(Array.isArray(reviews) && reviews.length)) {
        console.error(error);
        return;
      }
      fillReviewsHTML();
      callback(null, reviews);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const favoriteStar = document.createElement('img');
  favoriteStar.className = 'star-img';
  favoriteStar.src = restaurant.is_favorite
    ? '../img/starFilled.svg'
    : '../img/starEmpty.svg';
  const starAltText = restaurant.is_favorite
    ? `Restaurant ${restaurant.name} is favorited. Click to remove.`
    : `Restaurant ${restaurant.name} is not favorited. Click to add.`;
  favoriteStar.title = starAltText;
  favoriteStar.alt = starAltText;
  favoriteStar.onclick = () => DBHelper.toggleFavorite(restaurant);
  name.append(favoriteStar);

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  const altText = `Image of ${restaurant.name} restaurant in ${
    restaurant.neighborhood
  }`;
  image.title = altText;
  image.alt = altText;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (
  operatingHours = self.restaurant.operating_hours
) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
  } else {
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
  }

  const formContainer = document.getElementById('reviewsForm-container');
  const formTitle = document.createElement('h2');
  formTitle.innerHTML = 'Add a Review';
  formContainer.appendChild(formTitle);

  const form = document.getElementById('reviews-form');
  form.appendChild(createReviewFormHTML());
  formContainer.appendChild(form);
};

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = review => {
  const li = document.createElement('li');
  const title = document.createElement('p');
  const name = document.createElement('span');
  name.innerHTML = review.name;
  name.setAttribute('class', 'review_name');
  const date = document.createElement('span');
  date.innerHTML = new Date(review.createdAt).toDateString();
  date.setAttribute('class', 'review_date');
  title.appendChild(name);
  title.appendChild(date);
  title.setAttribute('class', 'review_title');
  li.appendChild(title);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.setAttribute('class', 'review_rating');
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewFormHTML = () => {
  const urlParams = new URLSearchParams(window.location.search);

  const createform = document.createElement('form');
  createform.setAttribute('id', 'review_form');
  createform.setAttribute('name', 'formReview');
  createform.setAttribute('role', 'form');
  createform.onsubmit = () => {
    if (validateForm()) {
      const formData = {
        id: parseInt(urlParams.get('id')),
        formName: document.forms['formReview']['formName'].value,
        formRatings: parseInt(
          document.forms['formReview']['formRatings'].options[
            document.forms['formReview']['formRatings'].selectedIndex
          ].value
        ),
        formDate: document.forms['formReview']['formDate'].value,
        formComments: document.forms['formReview']['formComments'].value,
        unsync: document.forms['formReview']['formUnsync'].value,
      };
      DBHelper.saveReviewOffline(formData);
    }
  };

  const reviewBox = document.createElement('div');

  const title = document.createElement('p');
  const nameValue = urlParams.get('formName') || null;
  const inputName = document.createElement('input');
  inputName.setAttribute('class', 'review_name');
  inputName.setAttribute('type', 'text');
  inputName.setAttribute('name', 'formName');
  inputName.setAttribute('aria-label', "Text input for reviewer's name");
  inputName.setAttribute(
    'placeholder',
    nameValue ? nameValue : 'e.g. Gordon James Ramsay'
  );
  inputName.setAttribute('value', nameValue ? nameValue : '');

  const dateInput = document.createElement('input');
  dateInput.setAttribute('class', 'review_dateInput');
  dateInput.setAttribute('type', 'hidden');
  dateInput.setAttribute('name', 'formDate');
  dateInput.setAttribute('aria-label', "Today's Date input prefilled");
  dateInput.setAttribute('value', new Date().toDateString());
  reviewBox.appendChild(dateInput);

  const date = document.createElement('span');
  date.innerHTML = new Date().toDateString();
  date.setAttribute('class', 'review_date');

  title.appendChild(inputName);
  title.appendChild(date);
  title.setAttribute('class', 'review_title');
  reviewBox.appendChild(title);

  const selectRating = document.createElement('select');
  selectRating.setAttribute('name', 'formRatings');
  selectRating.setAttribute('aria-label', 'Ratings Dropdown');
  selectRating.setAttribute(
    'placeholder',
    'Please enter a number between 1 to 5'
  );
  [0, 1, 2, 3, 4, 5].forEach(rating => {
    const option = document.createElement('option');
    option.innerHTML = rating;
    option.value = rating;
    selectRating.append(option);
  });
  const rating = document.createElement('p');
  rating.innerHTML = 'Rating: ';
  rating.setAttribute('class', 'review_rating');
  rating.appendChild(selectRating);
  reviewBox.appendChild(rating);

  const textareaValue = urlParams.get('formComments') || null;
  const textareaReview = document.createElement('textarea');
  textareaReview.setAttribute('class', 'review_comments');
  textareaReview.setAttribute('name', 'formComments');
  textareaReview.setAttribute('aria-label', 'Textarea to review restaurant');
  textareaReview.setAttribute(
    'placeholder',
    textareaValue
      ? textareaValue
      : 'e.g. The dishes were very tasty, and the staff was really polite.'
  );
  textareaReview.setAttribute('value', textareaValue ? textareaValue : '');
  reviewBox.appendChild(textareaReview);

  // needed to keep it in url after submission
  const errorMessagesInput = document.createElement('input');
  errorMessagesInput.setAttribute('type', 'hidden');
  errorMessagesInput.setAttribute('name', 'formErrors');
  errorMessagesInput.setAttribute('id', 'review_errors_input');
  reviewBox.append(errorMessagesInput);

  const errors = urlParams.get('formErrors') || null;
  const errorMessages = document.createElement('p');
  errorMessages.setAttribute('id', 'review_errors');
  errorMessages.setAttribute('style', 'background-color: pink');
  errorMessages.innerHTML = errors
    ? `Attention! \n${errors} must be filled before submitted`
    : '';
  reviewBox.append(errorMessages);

  const submitContainer = document.createElement('p');
  submitContainer.setAttribute('id', 'review_submitContainer');
  const submit = document.createElement('input');
  submit.setAttribute('id', 'review_submit');
  submit.setAttribute('type', 'submit');
  submit.setAttribute('aria-label', 'Submit button for reviews form');
  submit.innerHTML = 'Submit review';
  submitContainer.append(submit);
  reviewBox.append(submitContainer);

  const restaurantId = urlParams.get('id');
  // needed to keep it in url after submission
  const inputRestaurantId = document.createElement('input');
  inputRestaurantId.setAttribute('type', 'hidden');
  inputRestaurantId.setAttribute('name', 'id');
  inputRestaurantId.setAttribute('value', restaurantId);
  reviewBox.appendChild(inputRestaurantId);

  // needed to post it in form submission to update idb with it and have a flag point to find the unsynced idb entries
  const inputUnsynced = document.createElement('input');
  inputUnsynced.setAttribute('type', 'hidden');
  inputUnsynced.setAttribute('name', 'formUnsync');
  inputUnsynced.setAttribute('value', true);
  reviewBox.appendChild(inputUnsynced);

  createform.appendChild(reviewBox);

  return createform;
};

const validateForm = () => {
  let name = document.forms['formReview']['formName'].value;
  var rating =
    document.forms['formReview']['formRatings'].options[
      document.forms['formReview']['formRatings'].selectedIndex
    ].value;
  var review = document.forms['formReview']['formComments'].value;

  let errors = '';
  if (name === '') {
    errors += 'Name,';
  }
  if (rating === '0') {
    errors += 'Rating,';
  }
  if (review === '') {
    errors += 'Review';
  }
  const messageParam = document.getElementById('review_errors_input');
  messageParam.setAttribute('value', errors);

  return name === '' || rating === '0' || review === '' ? false : true;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
