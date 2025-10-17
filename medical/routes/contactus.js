const express = require('express');
const router = express.Router();
const Contact = require('../models/contactModel');

router.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  const contact = new Contact({ name, email, message });

  const validationError = contact.validateSync();
  if (validationError) {
    // Render home with error messages, no success message
    return res.render('home', { error: 'Please fill all required fields correctly.', success: null });
  }

  try {
    await contact.save();
    // Render home with success message, no error message
    res.render('home', { success: 'Message sent successfully!', error: null });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/read', (req, res) => {

  Contact.find().then(data => {
    res.render('read',{data:data})

  }).catch(error => {

    console.error(error);
    
  });

});
router.get('/delete/:id', (req, res) => {
  const contactId = req.params.id;
  Contact.findByIdAndDelete(contactId)
    .then(() => {
      res.redirect('/contactus/read'); // Or adjust path accordingly
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Error deleting message');
    });
});


module.exports = router;
