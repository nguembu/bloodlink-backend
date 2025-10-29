const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Données de validation invalides',
      errors: errors.array()
    });
  }
  next();
};

// Validation pour l'inscription
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Veuillez fournir un email valide'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  
  body('role')
    .isIn(['doctor', 'donor'])
    .withMessage('Le rôle doit être "doctor" ou "donor"'),
  
  // body('name')
  //   .if(body('role').equals('donor'))
  //   .notEmpty()
  //   .withMessage('Le nom est requis pour les donneurs')
  //   .isLength({ min: 2, max: 50 })
  //   .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  
  body('bloodType')
    .if(body('role').equals('donor'))
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Type sanguin invalide'),
  
  // body('hospital')
  //   .if(body('role').equals('doctor'))
  //   .notEmpty()
  //   .withMessage('Le nom de l\'hôpital est requis pour les médecins'),
  
  handleValidationErrors
];

// Validation pour la connexion
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Veuillez fournir un email valide'),
  
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis'),
  
  handleValidationErrors
];

// Validation pour la création d'alerte
const validateAlert = [
  body('bloodType')
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Type sanguin invalide'),
  
  body('hospital')
    .notEmpty()
    .withMessage('Le nom de l\'hôpital est requis')
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom de l\'hôpital doit contenir entre 2 et 100 caractères'),
  
  body('location.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude invalide'),
  
  body('location.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude invalide'),
  
  body('urgency')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Niveau d\'urgence invalide'),
  
  body('radius')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Le rayon doit être entre 1 et 50 km'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La description ne peut pas dépasser 500 caractères'),
  
  handleValidationErrors
];

// Validation pour la mise à jour de localisation
const validateLocation = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude invalide'),
  
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude invalide'),
  
  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('L\'adresse ne peut pas dépasser 200 caractères'),
  
  handleValidationErrors
];

// Validation pour la réponse à une alerte
const validateAlertResponse = [
  body('status')
    .isIn(['accepted', 'declined'])
    .withMessage('Le statut doit être "accepted" ou "declined"'),
  
  body('message')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Le message ne peut pas dépasser 200 caractères'),
  
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateAlert,
  validateLocation,
  validateAlertResponse
};