const Product = require("../models/product");
const Order = require("../models/order");

require("dotenv").config();

//STRIPEfor Paymnets
const stripe = require("stripe")(process.env.STRIPE_KEY);

const fs = require("fs");
const path = require("path");

//PDFKIT to Download the History
const PDFDocument = require("pdfkit");

const ITEMS_PER_PAGE = 8;

//GET Products Controller With Pagination
exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  //Count all Documents
  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;

      //Find Products and Display using the Pagination
      Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .then((products) => {
          res.render("shop/product-list", {
            prods: products,
            message: ``,
            pageTitle: "products",
            path: "/products",
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
          });
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//GET Product Controller
exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;

  //Find Product by Id and display
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//GET Index Controller with Pagination
//Similar to GET Products Controller
exports.getIndex = (req, res, next) => {
  res.render("shop/index", {
    pageTitle: "Shop",
    path: "/",
  });
};

//GET Cart Controller
exports.getCart = (req, res, next) => {
  //Getting user Cart
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items;
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//POST Cart Controller
exports.postCart = async (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  const prodId = req.body.productId;
  const prod = await Product.findById(prodId);
  req.user.addToCart(prod);
  console.log(prod);

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;

      //Find Products and Display using the Pagination
      Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .then((products) => {
          res.render("shop/product-list", {
            prods: products,
            message: `${prod.title} was added to cart!`,
            pageTitle: "products",
            path: "/products",
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
          });
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//Post Delete Product From Cart
exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;

  //user removeFromCart Function to remove Item

  /*
  //models/user.js
  userSchema.methods.removeFromCart = function (productId) {
  const updatedCartItems = this.cart.items.filter((item) => {
    return item.productId.toString() !== productId.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
};
  */

  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//GET Checkout Controller
exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;

  //Get Total from users cart
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      products = user.cart.items;
      products.forEach((p) => {
        total += p.quantity * p.productId.price;
        console.log(total, " TOTAL!");
      });

      //Use Stripe for Payment
      return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: products.map((p) => {
          return {
            price_data: {
              currency: "cad",
              product_data: {
                name: p.productId.title,
              },
              unit_amount: Math.round(p.productId.price * 100),
            },
            quantity: p.quantity,
          };
        }),
        mode: "payment",
        success_url: `${req.protocol}://${req.get("host")}/checkout/success`,
        cancel_url: `${req.protocol}://${req.get("host")}/checkout/cancel`,
      });
    })
    .then((session) => {
      res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "Checkout",
        STRIPE_PK: process.env.STRIPE_PK,
        products: products,
        totalSum: total,
        sessionId: session.id,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//GET Checkout Success Controller
exports.getCheckoutSuccess = (req, res, next) => {
  //Get users Items
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      //Create New Order and Add it to the User
      const order = new Order({
        user: {
          email: req.session.user.email,
          userId: req.session.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      //Remove Purchased items from cart
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//GET Orders Controller
exports.getOrders = (req, res, next) => {
  //Find User and display orders
  Order.find({ "user.userId": req.user })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//GET Invoice Controller
exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  const invoiceName = "invoice-" + orderId + ".pdf";
  const invoicePath = path.join("data", "invoices", invoiceName);

  //Find Order by Id
  Order.findById(orderId)
    .then((order) => {
      //Valdiation
      if (!order) {
        return next(new Error("No order found!"));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized"));
      }

      //Set Headers for PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'inline; filename="' + invoiceName + '"'
      );

      //Create PDF
      const pdfDoc = new PDFDocument();
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text("Invoice", {
        underline: true,
      });
      pdfDoc.text("-----------------------");
      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc.fontSize(14).text(`
          ${prod.product.title} - ${prod.quantity} x $${prod.product.price}`);
      });
      pdfDoc.text("---");
      pdfDoc.text(`Total Price: $${totalPrice}`);
      pdfDoc.end();

      //Stream
      // const file = fs.createReadStream(invoicePath);
      // file.pipe(res);

      //Memory
      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err);
      //   }

      //   res.send(data);
      // });
    })
    .catch((err) => {
      next(err);
    });
};
