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
      pageTitle: 'HomeHive | Meetings',
      pageDescription: 'Track scheduled meetings and continue buyer-owner conversations.',
      activeNav: 'bookings',
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
      pageTitle: `HomeHive | ${home.address?.city || 'Property'} Listing`,
      pageDescription: home.description || 'Explore full property details on HomeHive.',
      activeNav: 'explore',
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
      pageTitle: 'HomeHive | Saved Homes',
      pageDescription: 'Return to your shortlisted homes and continue comparing options.',
      activeNav: 'saved',
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

  if (!homeId || typeof homeId !== 'string') {
    return res.status(400).send('Invalid property reference.');
  }

  if (!message || typeof message !== 'string' || message.trim().length < 5) {
    return res.status(400).send('Please include a message with your offer (at least 5 characters).');
  }

  try {
    const home = await Home.findById(homeId);
    if (!home) {
      return res.status(404).render('Error', {
        pageTitle: 'HomeHive | Not Found',
        pageDescription: 'The property you are trying to offer on does not exist.',
        error: null,
      });
    }

    const parsedPrice = Number(offeredPrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).send('Please enter a valid offer amount greater than zero.');
    }

    if (parsedPrice > 10000000000) {
      return res.status(400).send('Offer amount is too large.');
    }

    if (home.owner.toString() === req.session.user.id) {
      return res.status(400).send('You cannot send an offer on your own property.');
    }

    const existing = await BuyRequest.findExistingRequest(homeId, req.session.user.id);
    if (existing) {
      return res.status(409).render('Error', {
        pageTitle: 'HomeHive | Duplicate Offer',
        pageDescription: 'You have already sent an offer for this property.',
        error: 'You have already sent an offer for this property. You can view your existing offer in My Requests.',
      });
    }

    const buyRequest = new BuyRequest({
      home: homeId,
      buyer: req.session.user.id,
      owner: home.owner,
      offeredPrice: parsedPrice,
      message: message.trim().slice(0, 1000),
    });

    await buyRequest.save();
    return res.redirect('/');
  } catch (err) {
    return next(err);
  }
};

exports.getMyRequests = async (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const buyRequests = await BuyRequest.findByBuyerWithRelations(req.session.user.id);
    return res.render('store/my-requests', {
      buyRequests,
      user: req.session.user,
      pageTitle: 'HomeHive | My Requests',
      pageDescription: 'Track the status of your property offers and manage conversations with owners.',
      activeNav: 'my-requests',
    });
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

  if (!requestId || typeof requestId !== 'string') {
    return res.status(400).send('Invalid request reference.');
  }

  if (!scheduledDate) {
    return res.status(400).send('Please select a date and time for the meeting.');
  }

  const meetingDate = new Date(scheduledDate);
  if (Number.isNaN(meetingDate.getTime()) || meetingDate <= new Date()) {
    return res.status(400).send('Please select a future date and time for the meeting.');
  }

  if (!location || typeof location !== 'string' || location.trim().length < 3) {
    return res.status(400).send('Please enter a valid meeting location.');
  }

  try {
    const buyRequest = await BuyRequest.findById(requestId);
    if (!buyRequest) {
      return res.status(404).render('Error', {
        pageTitle: 'HomeHive | Not Found',
        pageDescription: 'The buy request for this meeting was not found.',
        error: null,
      });
    }

    if (buyRequest.owner.toString() !== req.session.user.id) {
      return res.status(403).send('Only the owner can schedule meetings for this request.');
    }

    if (buyRequest.status !== 'accepted') {
      return res.status(400).send('Meetings can only be scheduled for accepted requests.');
    }

    const meeting = new Meeting({
      buyRequest: requestId,
      participants: [buyRequest.buyer, buyRequest.owner],
      scheduledDate: meetingDate,
      location: location.trim().slice(0, 200),
      notes: notes ? notes.trim().slice(0, 500) : null,
    });

    await meeting.save();
    return res.redirect('/store/bookings');
  } catch (err) {
    return next(err);
  }
};

exports.updateMeetingStatus = async (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const { meetingId } = req.params;
  const { status } = req.body;

  const allowedStatuses = ['completed', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).send('Invalid meeting status');
  }

  try {
    const meeting = await Meeting.updateStatus(meetingId, req.session.user.id, status);
    if (!meeting) {
      return res.status(404).send('Meeting not found or you are not a participant');
    }
    return res.redirect('/store/bookings');
  } catch (err) {
    return next(err);
  }
};
