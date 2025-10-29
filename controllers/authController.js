const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BloodBank = require('../models/BloodBank');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// Inscription User
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role, ...data } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: 'Email déjà utilisé.' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed, phone, role, ...data });
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
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });

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
    const existing = await BloodBank.findOne({ where: { [Op.or]: [{ email }, { hospitalName }] } });
    if (existing) return res.status(400).json({ success: false, message: 'Banque déjà existante.' });

    const hashed = await bcrypt.hash(password, 12);
    const bank = await BloodBank.create({ hospitalName, email, password: hashed, phone, address, latitude, longitude });
    const token = signToken(bank.id);
    bank.password = undefined;

    res.status(201).json({ success: true, message: 'Banque créée', token, data: { bloodBank: bank } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Connexion BloodBank
exports.loginBloodBank = async (req, res) => {
  try {
    const { email, password } = req.body;
    const bank = await BloodBank.findOne({ where: { email } });
    if (!bank || !(await bcrypt.compare(password, bank.password))) return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });
    if (!bank.isActive) return res.status(401).json({ success: false, message: 'Compte désactivé.' });

    const token = signToken(bank.id);
    bank.password = undefined;

    res.status(200).json({ success: true, message: 'Connexion réussie', token, data: { bloodBank: bank } });
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
