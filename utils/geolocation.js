const db = require('../db');

// Calcul de distance entre deux points (Haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Trouver les banques de sang proches
const findNearestBloodBanks = (latitude, longitude, limit = 5) => {
  const bloodBanks = db.prepare('SELECT id, hospitalName, locationLat, locationLng FROM bloodbanks WHERE isActive = 1').all();
  bloodBanks.forEach(bank => {
    bank.distance = calculateDistance(latitude, longitude, bank.locationLat, bank.locationLng);
  });
  bloodBanks.sort((a,b) => a.distance - b.distance);
  return bloodBanks.slice(0, limit);
};

// Trouver donneurs dans un rayon
const findUsersInRadius = (centerLat, centerLon, radiusKm, bloodType = null) => {
  let users = db.prepare('SELECT * FROM users WHERE role = ? AND status = ? AND isActive = 1').all('donor','available');
  if(bloodType){
    users = users.filter(u => u.bloodType === bloodType);
  }
  users.forEach(u => {
    u.distance = calculateDistance(centerLat, centerLon, u.latitude, u.longitude);
  });
  return users.filter(u => u.distance <= radiusKm);
};

module.exports = {
  calculateDistance,
  findNearestBloodBanks,
  findUsersInRadius
};
