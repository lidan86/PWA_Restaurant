import { IdbHandler, restaurantsUrl, reviewsUrl } from './idbhandler';

/**
 * Common database helper functions.
 */
export class DBHelper {
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    IdbHandler.fetchIdbData(IdbHandler.openDB(), 'restaurants').then(
      restaurants => {
        !!restaurants && restaurants.length > 0
          ? callback(null, restaurants)
          : IdbHandler.fetchAndStoreIdbData(
              IdbHandler.openDB(),
              'restaurants',
              callback
            );
      }
    );
  }

  /**
   * Fetch all reviews.
   */
  static fetchReviews(callback) {
    IdbHandler.fetchIdbData(IdbHandler.openDB(), 'reviews').then(reviews => {
      !!reviews && reviews.length > 0
        ? callback(null, reviews)
        : IdbHandler.fetchAndStoreIdbData(
            IdbHandler.openDB(),
            'reviews',
            callback
          );
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) {
          // Got the restaurant
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchReviewsByRestaurantId(restaurantId, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchReviews((error, allreviews) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurantReviews = allreviews.filter(
          r => r.restaurant_id == restaurantId
        );
        console.log('restaurant Reviews', restaurantReviews);
        if (restaurantReviews.length) {
          // Got the restaurant
          callback(null, restaurantReviews);
        } else {
          callback(
            `There are no reviews for Restaurant with id:${restaurantId}`,
            null
          );
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByFavorite(favorite, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given is_favorite
        const results = restaurants.filter(r => r.name == favorite);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhoodAndFavorite(
    cuisine,
    neighborhood,
    favorite,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        if (favorite != 'all') {
          // filter by favorite
          results = results.filter(r => r.name == favorite);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Fetch all favorites with proper error handling.
   */
  static fetchFavorites(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all favorite from all restaurants
        const favorites = restaurants
          .filter(restaurant => restaurant.is_favorite)
          .map(restaurant => restaurant.name);
        callback(null, favorites);
      }
    });
  }

  /**
   * Toggle restaurant favoriting with proper error handling.
   */
  static toggleFavorite(restaurant, callback) {
    console.log('toggle favorite');
    const newValue = !restaurant.is_favorite;
    DBHelper.toggleFavoriteInApiDBandIdb(restaurant.id, newValue, callback);
  }

  /**
   * Toggle restaurant favoriting with proper error handling.
   */
  static toggleFavoriteInApiDBandIdb(restaurantId, value, callback) {
    const favoriteValue = { is_favorite: value };
    fetch(`${restaurantsUrl}/${restaurantId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(favoriteValue), // data can be `string` or {object}!
    })
      .then(res => {
        console.log(
          `Updated API DB with restaurant[${restaurantId}].is_favorite : ${value}`
        );
        return res.json();
      })
      .catch(error => callback(error, null))
      .then(
        IdbHandler.toggleFavoriteInIdb(IdbHandler.openDB(), restaurantId, value)
      )
      .catch(error => callback(error, null));
    // .then(location.reload(true));
  }

  /**
   * Restaurant page URL.
   */
  static saveReviewOffline(formData) {
    const restaurantId = formData.id;
    const data = {
      restaurant_id: restaurantId,
      name: formData.formName,
      createdAt: formData.formDate,
      updatedAt: formData.formDate,
      rating: formData.formRatings,
      comments: formData.formComments,
      offline: formData.unsync,
    };
    IdbHandler.updateIdbData(IdbHandler.openDB(), restaurantId, data);
    location.reload();
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return `/img/${restaurant.photograph}.jpg`;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, newMap) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker(
      [restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant),
      }
    );
    marker.addTo(newMap);
    return marker;
  }

  static synchronizeOfflineReviews() {
    console.log('Start sync...');
    IdbHandler.postIdbOfflineDataInApiDB(IdbHandler.openDB(), 'reviews').then(
      reviews => {}
    );
  }

  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */
}
