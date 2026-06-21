const multer = require('multer');
const path = require('path');

const rootDir = require('../utils/pathUtils');
const Home = require('../models/home');
const BuyRequest = require('../models/BuyRequest');
const { uploadPropertyImage } = require('../utils/cloudinary');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      cb(new Error('Only image uploads are allowed.'));
      return;
    }

    cb(null, true);
  },
});

const ensureOwnerSession = (req, res) => {
  if (!req.session.user) {
    res.redirect('/login');
    return false;
  }

  if (req.session.user.role !== 'Owner') {
    res.status(403).send('Only owners can access this page');
    return false;
  }

  return true;
};

exports.getAddHome = (req, res) => {
  if (!ensureOwnerSession(req, res)) {
    return;
  }

  res.render(path.join(rootDir, 'views', 'host/addHome.ejs'));
};

exports.postAddHome = [
  upload.single('homeImage'),
  async (req, res, next) => {
    if (!ensureOwnerSession(req, res)) {
      return;
    }

    try {
      const formattedAddress = `${req.body.houseNo}, ${req.body.city}, ${req.body.district}, ${req.body.state}, ${req.body.country}`;

      if (!req.file || !req.file.buffer) {
        return res.status(400).render('Error', {
          pageTitle: 'HomeHive | Upload Failed',
          pageDescription: 'No image file was received. Please try again.',
          error: 'Image file was not uploaded. Make sure you select an image before submitting.',
        });
      }

      let uploadedImage = null;
      try {
        uploadedImage = await uploadPropertyImage(req.file);
      } catch (uploadErr) {
        return res.status(500).render('Error', {
          pageTitle: 'HomeHive | Upload Failed',
          pageDescription: 'Image upload to cloud storage failed.',
          error: uploadErr.message || 'Image upload failed.',
        });
      }

      const priceValue = Number(req.body.price);
      if (!Number.isFinite(priceValue) || priceValue <= 0) {
        return res.status(400).send('Invalid price. Enter a numeric amount greater than zero.');
      }

      const propertyType = req.body.propertyType || 'house';

      const home = new Home({
        address: {
          houseNo: req.body.houseNo,
          city: req.body.city,
          district: req.body.district,
          state: req.body.state,
          country: req.body.country,
          postcode: req.body.postcode,
          formattedAddress,
        },
        location: {
          type: 'Point',
          coordinates: [Number(req.body.lng) || 0, Number(req.body.lat) || 0],
        },
        price: String(priceValue),
        homeImage: uploadedImage ? uploadedImage.secure_url : null,
        description: req.body.description,
        propertyType,
        owner: req.session.user.id,
      });

      await home.save();
      res.render(path.join(rootDir, 'views', 'host/submitDetails.ejs'));
    } catch (err) {
      next(err);
    }
  },
];

exports.getHostHomeList = async (req, res, next) => {
  if (!ensureOwnerSession(req, res)) {
    return;
  }

  try {
    const submittedDetails = await Home.find({ owner: req.session.user.id });
    res.render('host/host-homelist', {
      SubmittedDetails: submittedDetails,
      user: req.session.user,
    });
  } catch (err) {
    next(err);
  }
};

exports.getBuyRequests = async (req, res, next) => {
  if (!ensureOwnerSession(req, res)) {
    return;
  }

  try {
    const buyRequests = await BuyRequest.findByOwnerWithRelations(req.session.user.id);

    res.render('host/buy-requests', { buyRequests, user: req.session.user });
  } catch (err) {
    next(err);
  }
};

exports.acceptBuyRequest = async (req, res, next) => {
  if (!ensureOwnerSession(req, res)) {
    return;
  }

  try {
    await BuyRequest.updateStatus(req.params.id, req.session.user.id, 'accepted');
    res.redirect('/host/buy-requests');
  } catch (err) {
    next(err);
  }
};

exports.rejectBuyRequest = async (req, res, next) => {
  if (!ensureOwnerSession(req, res)) {
    return;
  }

  try {
    await BuyRequest.updateStatus(req.params.id, req.session.user.id, 'rejected');
    res.redirect('/host/buy-requests');
  } catch (err) {
    next(err);
  }
};

exports.PostDeleteHome = async (req, res, next) => {
  if (!ensureOwnerSession(req, res)) {
    return;
  }

  try {
    await Home.findOneAndDelete({ _id: req.params.id, owner: req.session.user.id });
    res.redirect('/host/host-homelist');
  } catch (err) {
    next(err);
  }
};

exports.getUpdateHome = async (req, res, next) => {
  if (!ensureOwnerSession(req, res)) {
    return;
  }

  try {
    const home = await Home.findOne({ _id: req.params.id, owner: req.session.user.id });
    if (!home) {
      return res.status(404).render('Error', {
        pageTitle: 'HomeHive | Page Not Found',
        pageDescription: 'The listing you are looking for does not exist.',
      });
    }

    return res.render('host/edit', {
      home,
      user: req.session.user,
    });
  } catch (err) {
    return next(err);
  }
};

exports.PostUpdateHome = [
  upload.single('homeImage'),
  async (req, res, next) => {
    if (!ensureOwnerSession(req, res)) {
      return;
    }

    const priceValue = Number(req.body.price);
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      return res.status(400).send('Invalid price. Enter a numeric amount greater than zero.');
    }

    try {
      const uploadedImage = await uploadPropertyImage(req.file);
      const updateData = {
        address: {
          houseNo: req.body.houseNo,
          city: req.body.city,
          district: req.body.district,
          state: req.body.state,
          country: req.body.country,
          postcode: req.body.postcode,
          formattedAddress: `${req.body.houseNo}, ${req.body.city}, ${req.body.district}, ${req.body.state}, ${req.body.country}`,
        },
        price: String(priceValue),
        description: req.body.description,
        propertyType: req.body.propertyType || 'house',
        ...(uploadedImage ? { homeImage: uploadedImage.secure_url } : {}),
      };

      await Home.findOneAndUpdate(
        { _id: req.params.id, owner: req.session.user.id },
        updateData,
        { runValidators: true },
      );

      res.redirect('/host/host-homelist');
    } catch (err) {
      next(err);
    }
  },
];
