exports.error = (req, res) => {
  res.status(404).render('Error', {
    pageTitle: 'HomeHive | Page Not Found',
    pageDescription: 'The page you requested is unavailable.',
  });
};