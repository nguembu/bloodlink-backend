const { User, BloodBank } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Inscription User (donneur/medecin)
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role, ...additionalData } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ success: false, message: 'Utilisateur existe déjà.' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashedPassword, phone, role, ...additionalData });

    const token = signToken(user.id);
    user.password = undefined;

    res.status(201).json({ success: true, message: 'Compte créé', token, data: { user } });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Connexion User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });

    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });
    }

    if (!user.isActive) return res.status(401).json({ success: false, message: 'Compte désactivé.' });

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user.id);
    user.password = undefined;

    res.status(200).json({ success: true, message: 'Connexion réussie', token, data: { user } });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Inscription BloodBank
exports.registerBloodBank = async (req, res) => {
  try {
    const { hospitalName, email, password, phone, address, latitude, longitude } = req.body;

    const existingBloodBank = await BloodBank.findOne({ 
      where: { [Sequelize.Op.or]: [{ email }, { hospitalName }] } 
    });
    if (existingBloodBank) return res.status(400).json({ success: false, message: 'Banque de sang existe déjà.' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const bloodBank = await BloodBank.create({ hospitalName, email, password: hashedPassword, phone, address, latitude, longitude });

    const token = signToken(bloodBank.id);
    bloodBank.password = undefined;

    res.status(201).json({ success: true, message: 'Banque de sang créée', token, data: { bloodBank } });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Connexion BloodBank
exports.loginBloodBank = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });

    const bloodBank = await BloodBank.findOne({ where: { email } });
    if (!bloodBank || !(await bcrypt.compare(password, bloodBank.password))) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });
    }

    if (!bloodBank.isActive) return res.status(401).json({ success: false, message: 'Compte désactivé.' });

    const token = signToken(bloodBank.id);
    bloodBank.password = undefined;

    res.status(200).json({ success: true, message: 'Connexion réussie', token, data: { bloodBank } });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Profil User
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
