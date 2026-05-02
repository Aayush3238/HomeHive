const path = require('path');
const multer = require('multer');
const fs = require('fs');

const rootDir = require('../utils/pathUtils');
const Home = require('../models/home');
const BuyRequest = require('../models/BuyRequest');

const uploadsDir = path.join(rootDir, 'public', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const originalExt = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, originalExt)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/(^-|-$)/g, '') || 'home-image';
    cb(null, `${Date.now()}-${baseName}${originalExt}`);
  },
});

const upload = multer({ storage });

exports.serveUploadedHomeImage = (req, res, next) => {
  const filePath = path.join(uploadsDir, path.basename(req.params.filename));

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return next();
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentTypeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };

    res.type(contentTypeMap[ext] || 'application/octet-stream');
    fs.createReadStream(filePath).pipe(res);
  });
};

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

      const home = new Home({
        address: {
          houseNo: req.body.houseNo,
          city: req.body.city,
          district: req.body.district,
          state: req.body.state,
          country: req.body.country,
          formattedAddress,
        },
        location: {
          type: 'Point',
          coordinates: [Number(req.body.lng) || 0, Number(req.body.lat) || 0],
        },
        price: req.body.price,
        homeImage: req.file ? req.file.filename : null,
        description: req.body.description,
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
      return res.status(404).render('Error');
    }

    return res.render('host/edit', {
      home,
      user: req.session.user,
    });
  } catch (err) {
    return next(err);
  }
};

exports.PostUpdateHome = async (req, res, next) => {
  if (!ensureOwnerSession(req, res)) {
    return;
  }

  const updateData = {
    address: {
      houseNo: req.body.houseNo,
      city: req.body.city,
      district: req.body.district,
      state: req.body.state,
      country: req.body.country,
      formattedAddress: `${req.body.houseNo}, ${req.body.city}, ${req.body.district}, ${req.body.state}, ${req.body.country}`,
    },
    price: req.body.price,
    description: req.body.description,
  };

  try {
    await Home.findOneAndUpdate(
      { _id: req.params.id, owner: req.session.user.id },
      updateData,
      { runValidators: true },
    );

    res.redirect('/host/host-homelist');
  } catch (err) {
    next(err);
  }
};
