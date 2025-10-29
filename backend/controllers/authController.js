const User = require('../models/User');
const BloodBank = require('../models/BloodBank');
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

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà.'
      });
    }

    // Créer l'utilisateur
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
      ...additionalData
    });

    const token = signToken(user._id);

    // Ne pas renvoyer le mot de passe
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      token,
      data: { user }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Connexion User (donneur/medecin)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un email et un mot de passe.'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Votre compte a été désactivé.'
      });
    }

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user._id);
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      data: { user }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Inscription BloodBank
exports.registerBloodBank = async (req, res) => {
  try {
    const { hospitalName, email, password, phone, address, location } = req.body;

    const existingBloodBank = await BloodBank.findOne({ 
      $or: [{ email }, { hospitalName }] 
    });
    
    if (existingBloodBank) {
      return res.status(400).json({
        success: false,
        message: 'Une banque de sang avec cet email ou nom existe déjà.'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    const bloodBank = await BloodBank.create({
      hospitalName,
      email,
      password: hashedPassword,
      phone,
      address,
      location
    });

    const token = signToken(bloodBank._id);

    bloodBank.password = undefined;

    res.status(201).json({
      success: true,
      message: 'Banque de sang créée avec succès',
      token,
      data: { bloodBank }
    });

  } catch (error) {
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

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un email et un mot de passe.'
      });
    }

    const bloodBank = await BloodBank.findOne({ email }).select('+password');
    
    if (!bloodBank || !(await bcrypt.compare(password, bloodBank.password))) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.'
      });
    }

    if (!bloodBank.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Votre compte a été désactivé.'
      });
    }

    const token = signToken(bloodBank._id);
    bloodBank.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      data: { bloodBank }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Profil User
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};