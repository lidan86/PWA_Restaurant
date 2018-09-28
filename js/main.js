import { DBHelper } from './dbhelper';

let restaurants, neighborhoods, cuisines, favorites;
let newMap;
const markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', event => {
  setFilterListeners(); // needed due to es6 changes in arrow functions
  newMap = initMap(); // added
  fetchNeighborhoods();
  fetchCuisines();
  fetchFavorites();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Fetch all favorite restaurants and set their HTML.
 */
const fetchFavorites = () => {
  DBHelper.fetchFavorites((error, favorites) => {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.favorites = favorites;
      fillFavoritesHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
const fillFavoritesHTML = (favorites = self.favorites) => {
  const select = document.getElementById('favorites-select');
  favorites.forEach(favorite => {
    const option = document.createElement('option');
    option.innerHTML = favorite;
    option.value = favorite;
    select.append(option);
  });
};

/**
 * Initialize leaflet map, called from HTML.
 */
const initMap = () => {
  const map = L.map('map', {
    center: [40.722216, -73.987501],
    zoom: 12,
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

  updateRestaurants();

  return map;
};
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

const setFilterListeners = () => {
  document.querySelector('#neighborhoods-select').onchange = updateRestaurants;
  document.querySelector('#cuisines-select').onchange = updateRestaurants;
  document.querySelector('#favorites-select').onchange = updateRestaurants;
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');
  const fSelect = document.getElementById('favorites-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;
  const fIndex = fSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;
  const favorite = fSelect[fIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhoodAndFavorite(
    cuisine,
    neighborhood,
    favorite,
    (error, restaurants) => {
      if (error) {
        // Got an error!
        console.error(error);
      } else {
        resetRestaurants(restaurants);
        fillRestaurantsHTML();
      }
    }
  );
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = restaurant => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  const altText = `Image of ${restaurant.name} restaurant in ${
    restaurant.neighborhood
  }`;
  image.title = altText;
  image.alt = altText;
  li.append(image);

  const container = document.createElement('div');
  container.className = 'restaurant-info';

  const name = document.createElement('h2');
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
  container.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  container.append(neighborhood);

  const address = document.createElement('address');
  address.innerHTML = restaurant.address;
  container.append(address);

  li.append(container);

  const more = document.createElement('button');
  more.innerHTML = 'View Details';
  more.addEventListener('click', () => {
    window.location.href = DBHelper.urlForRestaurant(restaurant);
  });

  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, newMap);
    marker.on('click', onClick);

    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });
};
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */
