const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BloodBank = require('../models/BloodBank');
const { Op } = require('sequelize');

// Fonction signToken corrigée
const signToken = (id) => {
  // Vérifier que JWT_SECRET est défini
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  // Utiliser une valeur par défaut si JWT_EXPIRES_IN n'est pas défini ou invalide
  const expiresIn = process.env.JWT_EXPIRES_IN || '30d';
  
  console.log('🔐 Generating token with expiresIn:', expiresIn);
  
  return jwt.sign({ id }, process.env.JWT_SECRET, { 
    expiresIn: expiresIn
  });
};

// Inscription User
exports.register = async (req, res) => {
  try {
    console.log('📝 Registration attempt:', req.body);
    
    const { name, email, password, phone, role, ...data } = req.body;
    
    // Validation des champs requis
    if (!email || !password || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, mot de passe et téléphone sont obligatoires.' 
      });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: 'Email déjà utilisé.' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed, phone, role, ...data });
    
    // Générer le token
    const token = signToken(user.id);
    user.password = undefined;

    console.log('✅ User registered successfully:', user.id);
    
    res.status(201).json({ 
      success: true, 
      message: 'Compte créé', 
      token, 
      data: { user } 
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Connexion User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect.' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Compte désactivé.' 
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user.id);
    user.password = undefined;

    res.status(200).json({ 
      success: true, 
      message: 'Connexion réussie', 
      token, 
      data: { user } 
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Inscription BloodBank
exports.registerBloodBank = async (req, res) => {
  try {
    const { hospitalName, email, password, phone, address, latitude, longitude } = req.body;
    
    // Vérifier l'import de Op
    if (!Op) {
      throw new Error('Sequelize Op is not imported');
    }
    
    const existing = await BloodBank.findOne({ 
      where: { 
        [Op.or]: [{ email }, { hospitalName }] 
      } 
    });
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Banque déjà existante.' 
      });
    }

    const hashed = await bcrypt.hash(password, 12);
    const bank = await BloodBank.create({ 
      hospitalName, 
      email, 
      password: hashed, 
      phone, 
      address, 
      latitude, 
      longitude 
    });
    
    const token = signToken(bank.id);
    bank.password = undefined;

    res.status(201).json({ 
      success: true, 
      message: 'Banque créée', 
      token, 
      data: { bloodBank: bank } 
    });
    
  } catch (error) {
    console.error('❌ BloodBank registration error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Connexion BloodBank
exports.loginBloodBank = async (req, res) => {
  try {
    const { email, password } = req.body;
    const bank = await BloodBank.findOne({ where: { email } });
    
    if (!bank || !(await bcrypt.compare(password, bank.password))) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect.' 
      });
    }
    
    if (!bank.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Compte désactivé.' 
      });
    }

    const token = signToken(bank.id);
    bank.password = undefined;

    res.status(200).json({ 
      success: true, 
      message: 'Connexion réussie', 
      token, 
      data: { bloodBank: bank } 
    });
    
  } catch (error) {
    console.error('❌ BloodBank login error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Profil User
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.json({ 
      success: true, 
      data: { user } 
    });
  } catch (error) {
    console.error('❌ Profile error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};