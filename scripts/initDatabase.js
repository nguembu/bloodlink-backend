const mongoose = require('mongoose');
require('dotenv').config();

const initDatabase = async () => {
  try {
    console.log('🔄 Initialisation de la base de données BloodLink...');
    
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connecté à MongoDB');
    
    // Créer des données de test
    const User = require('../models/User');
    const Alert = require('../models/Alert');
    
    // Nettoyer la base (optionnel - en développement seulement)
    if (process.env.NODE_ENV === 'development') {
      await User.deleteMany({});
      await Alert.deleteMany({});
      console.log('🗑️  Anciennes données nettoyées');
    }
    
    // Créer des utilisateurs de test
    const testDoctor = await User.create({
      email: 'docteur@hopital.fr',
      password: 'password123',
      role: 'doctor',
      name: 'Dr. Martin',
      hospital: 'Hôpital Central Paris',
      phone: '+33123456789'
    });
    
    const testDonor1 = await User.create({
      email: 'donneur1@email.fr',
      password: 'password123',
      role: 'donor',
      name: 'Jean Dupont',
      bloodType: 'A+',
      phone: '+33123456780',
      location: {
        type: 'Point',
        coordinates: [2.3522, 48.8566], // Paris
        address: 'Paris, France'
      }
    });
    
    const testDonor2 = await User.create({
      email: 'donneur2@email.fr',
      password: 'password123',
      role: 'donor',
      name: 'Marie Leroy',
      bloodType: 'O-',
      phone: '+33123456781',
      location: {
        type: 'Point',
        coordinates: [2.2973, 48.8346], // Proche de Paris
        address: 'Issy-les-Moulineaux, France'
      }
    });
    
    console.log('✅ Utilisateurs de test créés');
    
    // Créer une alerte de test
    const testAlert = await Alert.create({
      doctor: testDoctor._id,
      bloodType: 'A+',
      hospital: 'Hôpital Central Paris',
      hospitalLocation: {
        type: 'Point',
        coordinates: [2.3522, 48.8566]
      },
      urgency: 'high',
      radius: 5,
      description: 'Urgence pour chirurgie cardiaque'
    });
    
    console.log('✅ Alerte de test créée');
    
    // Afficher les données créées
    console.log('\n📊 Données initialisées:');
    console.log(`- Médecins: 1 (${testDoctor.email})`);
    console.log(`- Donneurs: 2`);
    console.log(`- Alertes: 1`);
    
    console.log('\n🎉 Base de données initialisée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion fermée');
  }
};

// Exécuter si appelé directement
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;