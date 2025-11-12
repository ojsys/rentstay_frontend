/**
 * Location utilities for RentStay
 */

/**
 * Get user's city with fallback logic
 * Priority: 1. User profile -> 2. localStorage -> 3. Default (Jos)
 */
export const getUserCity = (user, isAuthenticated) => {
  // Priority 1: Logged in user's city
  if (isAuthenticated && user?.city) {
    return user.city;
  }

  // Priority 2: Previously saved city in localStorage
  const savedCity = localStorage.getItem('userCity');
  if (savedCity) {
    return savedCity;
  }

  // Priority 3: Default to Jos
  return 'Jos';
};

/**
 * Save user's city preference
 */
export const saveUserCity = (city) => {
  localStorage.setItem('userCity', city);
};

/**
 * Get city from browser geolocation (optional feature)
 */
export const detectCityFromLocation = async (reverseGeocodeFn) => {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          if (reverseGeocodeFn) {
            const { latitude, longitude } = position.coords;
            const data = await reverseGeocodeFn(latitude, longitude);
            const city = data.city || 'Jos';
            resolve(city);
            return;
          }
          resolve('Jos');
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        reject(error);
      },
      {
        timeout: 10000,
        enableHighAccuracy: false
      }
    );
  });
};

/**
 * Nigerian cities for dropdown/selection
 */
export const nigerianCities = [
  'Jos',
  'Abuja',
  'Lagos',
  'Port Harcourt',
  'Kano',
  'Ibadan',
  'Kaduna',
  'Benin City',
  'Enugu',
  'Calabar',
  'Owerri',
  'Uyo',
  'Warri',
  'Maiduguri',
  'Zaria',
  'Aba',
  'Ilorin',
  'Onitsha',
  'Abeokuta',
  'Akure'
].sort();
