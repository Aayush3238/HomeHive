exports.error = (req, res) => {
  res.status(404).render('Error');
};