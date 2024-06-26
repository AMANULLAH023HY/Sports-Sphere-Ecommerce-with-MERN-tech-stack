import fs from "fs";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";
import braintree from 'braintree'
import orderModel from "../models/orderModel.js";




// payment gateway
// var gateway = new braintree.BraintreeGateway({
//   environment: braintree.Environment.Sandbox,
//   merchantId: process.env.BRAINTREE_MERCHANT_ID,
//   publicKey: process.env.BRAINTREE_PUBLIC_KEY, // Ensure this is correct
//   privateKey: process.env.BRAINTREE_PRIVATE_KEY,
// })


var gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: "9fwqn4z5scf3hdv9",
  publicKey: "ny9tbdwhj3tjmmgj", // Ensure this is correct
  privateKey: "d26551a2e55cddd267dc69ac0c9257dc",
})

const createProductController = async (req, res) => {
  try {
    const { name, slug, description, price, category, quantity, shipping } =
      req.fields;

    const { photo } = req.files;

    //  validation

    switch (true) {
      case !name:
        return res.status(500).send({ error: "Name is required" });
      case !description:
        return res.status(500).send({ error: "Description is required" });
      case !price:
        return res.status(500).send({ error: "Price is required" });
      case !category:
        return res.status(500).send({ error: "Category is required" });
      case !quantity:
        return res.status(500).send({ error: "Quantity is required" });
      case !photo && photo.size > 1000000:
        return res
          .status(500)
          .send({ error: "Photo is required and should be less than 1MB" });
    }

    const products = new productModel({ ...req.fields, slug: slugify(name) });
    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.bufferContentType = photo.type;
    }
    await products.save();
    res.status(201).send({
      success: true,
      message: "product created successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in create product",
      error: error.message,
    });
  }
};

// Get product controller

const getProductContoller = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .populate("category")
      .select("-photo")
      .limit(12)
      .sort({ createAt: -1 });
    res.status(200).send({
      success: true,
      message: "All Product",
      totalProducts: products.length,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in get product",
      error: error.message,
    });
  }
};

// get single product

const getSingleProductContoller = async (req, res) => {
  try {
    const product = await productModel
      .findOne({ slug: req.params.slug })
      .select("-photo")
      .populate("category");
    res.status(200).send({
      success: true,
      message: "Get single product",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in get single product",
      error: error.message,
    });
  }
};

// product Photo Controller
const productPhotoController = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid).select("photo");
    if (product.photo.data) {
      res.set("Content-type", product.photo.contentType);
      return res.status(200).send(product.photo.data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in get product photo",
      error: error.message,
    });
  }
};

// delete product controller

const deleteProductController = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.params.pid).select("photo");
    res.status(201).send({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in delete product",
      error: error.message,
    });
  }
};

const updateProductController = async (req, res) => {
  try {
    const { name, slug, description, price, category, quantity, shipping } =
      req.fields;

    const { photo } = req.files;

    //  validation

    switch (true) {
      case !name:
        return res.status(500).send({ error: "Name is required" });
      case !description:
        return res.status(500).send({ error: "Description is required" });
      case !price:
        return res.status(500).send({ error: "Price is required" });
      case !category:
        return res.status(500).send({ error: "Category is required" });
      case !quantity:
        return res.status(500).send({ error: "Quantity is required" });
      case !photo && photo.size > 1000000:
        return res
          .status(500)
          .send({ error: "Photo is required and should be less than 1MB" });
    }

    const products = await productModel.findByIdAndUpdate(
      req.params.pid,
      { ...req.fields, slug: slugify(name) },
      { new: true }
    );
    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.bufferContentType = photo.type;
    }
    await products.save();
    res.status(201).send({
      success: true,
      message: "product update successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in update product",
      error: error.message,
    });
  }
};


const productFiltersController = async (req, res) => {
  try {
    const { checked, radio } = req.body;
    let args = {};
    if (checked.length > 0) args.category = checked;
    if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
    const products = await productModel.find(args);
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error WHile Filtering Products",
      error,
    });
  }
};

// product Count Controller

const productCountController = async (req, res) => {
  try {
    const total = await productModel.find({}).estimatedDocumentCount();

    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error in Products count",
      error,
    });
  }
};

// product list per page controller

const productListPageController = async (req, res) => {
  try {
    const perPage = 6;
    const page = req.params.page ? req.params.page : 1;
    const products = await productModel
      .find({})
      .select("-photo")
      .skip(page - 1)
      .limit(perPage)
      .sort({ createAt: -1 });

      res.status(200).send({
        success: true,
        products,
      });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error in Products list per page",
      error,
    });
  }
};


// search Product Controller

const searchProductController = async (req,res)=>{ 
  try {

    const {keyword} = req.params;
    const results = await productModel.find({
      $or:[
        {name:{$regex:keyword, $options: "i"}},
        {description:{$regex:keyword, $options: "i"}}

      ]
    }).select('-photo');

    res.json(results);
    
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error in search Products",
      error,
    });
  }
};



// releted Product Controller

const reletedProductController = async(req,res)=>{
try {
  const {pid,cid} = req.params;
  const products = await productModel.find({
    category:cid,
    _id:{$ne:pid}
  }).select('-photo').limit(3).populate("category")

  res.status(200).send({
    success:true,
    products
  })
  
} catch (error) {
  console.log(error);
    res.status(400).send({
      success: false,
      message: "Error in Related Products",
      error,
    });
}
};

// get product by category

const productCategoryController =async (req,res)=>{
  try {
    const category  = await categoryModel.findOne({slug:req.params.slug});
    const products = await productModel.find({category}).populate('category');

    res.status(200).send({
      success:true,
      message:"Single product get",
      category,
      products,
    })
    
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error in get Category by Products",
      error,
    });
    
  }

}
// braintree payment gateway Controller
// braintree Token
const braintreeTokenController = async(req,res)=>{
  try {

    gateway.clientToken.generate({}, function(err,response){
      if(err){
        res.status(500).send(err);
      }else{
        res.status(200).send(response)
      }
    })
    
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error in payment token",
      error,
    });
  }
};


// braintree payment 
const braintreePaymentController = async(req,res)=>{
  try {
    const {cart, nonce} = req.body;
    let total = 0;
    cart.map((i)=>{
      total += i.price;
    });

    let newTransation = gateway.transaction.sale({
      amount: total,
      paymentMethodNonce:nonce,
      options:{
        submitForSettlement:true
      }
    },
    function(error,result){
      if(result){
        const order = new orderModel({
          products:cart,
          payment:result,
          buyer:req.user._id,
        }).save();


        res.json({ok:true});
      }else{
        res.status(500).send(error)
      }
    }
    );
    
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error in payments",
      error,
    });
  }
}


// order status update 

const orderStatusController = async(req,res)=>{
  try {

    const {orderId} = req.params;
    const {status} = req.body;
    
    const orders = await  orderModel.findByIdAndUpdate(orderId, {status}, {new:true});


    res.json(orders);


    
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error while updating order",
      error,
    });
  }
}
export {
  createProductController,
  getProductContoller,
  getSingleProductContoller,
  productPhotoController,
  deleteProductController,
  updateProductController,
  productFiltersController,
  productCountController,
  productListPageController,
  searchProductController,
  reletedProductController,
  productCategoryController,
  braintreeTokenController,
  braintreePaymentController,
  orderStatusController
};
