const express = require('express');
const router = express.Router();
const Product = require('../models/productsModel');

// Authentication middleware
const isAuthenticated = (allowedDomain) => (req, res, next) => {
  if (req.session && req.session.userEmail) {
    const userEmail = req.session.userEmail;
    console.log('User email:', userEmail);
    if (allowedDomain) {
      if (userEmail.endsWith(allowedDomain)) {
        return next();
      } else {
        return res.status(403).send('unauthorized');
      }
    } else {
      return next();
    }
  }
  console.log('User email not found in session:', req.session);
  res.redirect('/login');
};

// Show create product form
router.get('/create_product', isAuthenticated(), (req, res) => {
  res.render('./product/create', { error: null });
});

// Handle create product POST
router.post('/create_product', isAuthenticated(), async (req, res) => {
  const { name, stock } = req.body;
  const product = new Product({ name, stock });
  const validationError = product.validateSync();
  if (validationError) {
    return res.render('./product/create', { error: validationError.errors });
  }
  try {
    await product.save();
    res.redirect('/products/retrieve_product');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Retrieve products with search and pagination
router.get('/retrieve_product', isAuthenticated(), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const query = search ? { name: { $regex: search, $options: 'i' } } : {};
    const options = { page: parseInt(page, 10), limit: parseInt(limit, 10) };
    const result = await Product.paginate(query, options);
    res.render('./product/retrieve', { products: result.docs, pagination: result, search });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Show update product form
router.get('/update_product/:id', isAuthenticated(), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    res.render('./product/update', { product, error: null });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Handle update product POST
router.post('/update_product/:id', isAuthenticated(), async (req, res) => {
  const { name, stock } = req.body;
  const product = new Product({ name, stock });
  const validationError = product.validateSync();
  if (validationError) {
    return res.render('./product/update', { product, error: validationError.errors });
  }
  try {
    await Product.findByIdAndUpdate(req.params.id, { name, stock });
    res.redirect('/products/retrieve_product');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Show delete product confirmation page
router.get('/delete_product/:id', isAuthenticated(), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.render('./product/delete', { product });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Handle delete product POST
router.post('/delete_product/:id', isAuthenticated(), async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/products/retrieve_product');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Shop view with search and pagination
router.get('/shop', isAuthenticated(), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const query = search ? { name: { $regex: search, $options: 'i' } } : {};
    const options = { page: parseInt(page, 10), limit: parseInt(limit, 10) };
    const result = await Product.paginate(query, options);
    res.render('./product/shop', { products: result.docs, pagination: result, search });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
