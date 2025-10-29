const BloodBank = require('../models/BloodBank');
const User = require('../models/User');

// Calcul de distance entre deux points (formule Haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value) => {
  return value * Math.PI / 180;
};

// Trouver les banques de sang les plus proches
const findNearestBloodBanks = async (latitude, longitude, limit = 5) => {
  return await BloodBank.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: 100000 // 100km
      }
    },
    isActive: true
  })
  .limit(limit);
};

// Trouver les donneurs dans un rayon
const findUsersInRadius = async (centerLat, centerLon, radiusKm, bloodType = null) => {
  const query = {
    role: 'donor',
    status: 'available',
    isActive: true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [centerLon, centerLat]
        },
        $maxDistance: radiusKm * 1000
      }
    }
  };

  if (bloodType) {
    query.bloodType = bloodType;
  }

  return await User.find(query);
};

module.exports = {
  calculateDistance,
  findNearestBloodBanks,
  findUsersInRadius
};