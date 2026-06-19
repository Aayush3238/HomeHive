const Home = require('../models/home');
const User = require('../models/User');
const BuyRequest = require('../models/BuyRequest');
const Message = require('../models/Message');
const Meeting = require('../models/Meeting');

exports.homepage = async (req, res, next) => {
  try {
    const submittedDetails = await Home.find();
    res.render('store/home', {
      SubmittedDetails: submittedDetails,
    });
  } catch (err) {
    next(err);
  }
};

exports.getBookings = async (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const meetings = await Meeting.findByParticipantWithRelations(req.session.user.id);

    return res.render('store/bookings', {
      meetings,
      user: req.session.user,
    });
  } catch (err) {
    return next(err);
  }
};

exports.getHomeDetails = async (req, res, next) => {
  try {
    const home = await Home.findById(req.params.id);
    if (!home) {
      return res.status(404).render('Error', {
        pageTitle: 'HomeHive | Page Not Found',
        pageDescription: 'The property you are looking for does not exist.',
      });
    }

    return res.render('store/home-details', {
      home,
    });
  } catch (err) {
    return next(err);
  }
};

exports.getFavouriteList = async (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const user = await User.findById(req.session.user.id);

    if (!user) {
      req.session.destroy(() => {});
      return res.redirect('/login');
    }

    const favourites = await User.findFavouritesByUserId(req.session.user.id);

    return res.render('store/favourite-list', {
      favourites,
      user: req.session.user,
    });
  } catch (err) {
    return next(err);
  }
};

exports.addToFavourite = async (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    await User.addFavourite(req.session.user.id, req.params.id);

    return res.redirect('back');
  } catch (err) {
    return next(err);
  }
};

exports.createBuyRequest = async (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const { homeId, offeredPrice, message } = req.body;

  try {
    const home = await Home.findById(homeId);
    if (!home) {
      return res.status(404).send('Home not found');
    }

    const parsedPrice = Number(offeredPrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).send('Invalid offered price');
    }

    const buyRequest = new BuyRequest({
      home: homeId,
      buyer: req.session.user.id,
      owner: home.owner,
      offeredPrice: parsedPrice,
      message,
    });

    await buyRequest.save();
    return res.redirect('/');
  } catch (err) {
    return next(err);
  }
};

exports.getBuyRequest = async (req, res, next) => {
   if (!req.session.user) {
     return res.status(401).json({ error: 'Unauthorized' });
   }

   try {
     const buyRequest = await BuyRequest.findById(req.params.requestId);
     if (!buyRequest) {
       return res.status(404).json({ error: 'Buy request not found' });
     }

     // Check if user is participant in this conversation
     const isParticipant =
       buyRequest.buyer.toString() === req.session.user.id
       || buyRequest.owner.toString() === req.session.user.id;

     if (!isParticipant) {
       return res.status(403).json({ error: 'Forbidden' });
     }

     // Determine the other participant's ID
     const otherParticipantId = 
       buyRequest.buyer.toString() === req.session.user.id
         ? buyRequest.owner.toString()
         : buyRequest.buyer.toString();

     res.json({
       buyRequest,
       otherParticipantId
     });
   } catch (err) {
     return next(err);
   }
 };

exports.getMessages = async (req, res, next) => {
   if (!req.session.user) {
     return res.status(401).json({ error: 'Unauthorized' });
   }

   try {
     const buyRequest = await BuyRequest.findById(req.params.requestId);
     if (!buyRequest) {
       return res.status(404).json({ error: 'Conversation not found' });
     }

     const isParticipant =
       buyRequest.buyer.toString() === req.session.user.id
       || buyRequest.owner.toString() === req.session.user.id;

     if (!isParticipant) {
       return res.status(403).json({ error: 'Forbidden' });
     }

     const messages = await Message.findByConversationWithSender(req.params.requestId);

     return res.json(messages);
   } catch (err) {
     return next(err);
   }
 };

exports.scheduleMeeting = async (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const { requestId, scheduledDate, location, notes } = req.body;

  try {
    const buyRequest = await BuyRequest.findById(requestId);
    if (!buyRequest) {
      return res.status(404).send('Buy request not found');
    }

    if (buyRequest.owner.toString() !== req.session.user.id) {
      return res.status(403).send('Only the owner can schedule meetings for this request');
    }

    const meeting = new Meeting({
      buyRequest: requestId,
      participants: [buyRequest.buyer, buyRequest.owner],
      scheduledDate: new Date(scheduledDate),
      location,
      notes,
    });

    await meeting.save();
    return res.redirect('/store/bookings');
  } catch (err) {
    return next(err);
  }
};
