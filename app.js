const express = require('express');
const path = require('path');
//requerimos la dependencia de mongoose
const mongoose = require('mongoose');
const session = require('express-session');
const expressValidator = require('express-validator');
const fileUpload = require('express-fileupload');
const passport = require('passport');

//realizamos la conexion a la base de datos.
mongoose.connect('mongodb://Localhost:27017/ecommerceCMS');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'error de conexion: '));
db.once('open',()=>{
    console.log("Conectados a MongoDB 🔥🔥🔥🔥");
});

//Iniciar la app
const app = express();

//Configurar el motor de vistas (Template)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//Configurar la capeta public
app.use(express.static(path.join(__dirname, 'public')));

//Set gloabl errors varibale 
app.locals.errors = null;

//get page model - obtener el modelo de las paginas
var Page = require('./models/page');

//get all pages to pass ti header.ejs
Page.find({}).sort({ sorting: 1 }).then((pages) => {
    app.locals.pages = pages;
}).catch((err)=>{
    console.log(err);
});

//get Category model - obtener el modelo de Categorias
var Category = require('./models/category');

//get all categories to pass to header.ejs
Category.find({}).then((categories) => {
    app.locals.categories = categories;
}).catch((err)=>{
    console.log(err);
});

//Express file Upload middlewre
app.use(fileUpload());

//configurando parseo application/x-www-form-urlencoded
app.use(express.urlencoded({extended:false}));
//Configurando parseo application/JSON
app.use(express.json());

//express session midleware
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    // cookie: { secure: true }
  }));

//express validator middleware
app.use(expressValidator({
    errorFormatter: function(param, msg, value){
        var namespace = param.split('.')
        , root = namespace.shift()
        ,formParam = root;

    while(namespace.length){
        formParam +='['+ namespace.shift() +']';        
    }
    return{
        param: formParam,
        msg: msg,
        value: value
    };
    },
    customValidators: {
        isImage: function(value, filename){
            var extension = (path.extname(filename)).toLowerCase();
            switch (extension) {
                case '.jpg':
                    return '.jpg';                    
                case '.jpeg':
                    return '.jpeg';                    
                case '.png':
                    return '.png';                    
                case '':
                    return '.jpg';   
                default:
                    return false;
            }
            
        }
    }
}));

//express messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();   
});

//passport middleware
require('./config/passport')(passport); 
app.use(passport.initialize());
app.use(passport.session());

app.get('*', function(req,res,next){
    res.locals.cart = req.session.cart;
    res.locals.users = req.user || null;
    next();
})

//asignar rutas
const pages = require('./routes/pages');
const products = require('./routes/products');
const cart = require('./routes/cart');
const users = require('./routes/users');
const adminPage = require('./routes/admin_pages')
const adminCategories = require('./routes/admin_categories')
const adminProducts = require('./routes/admin_products')

const { ExpressValidator } = require('express-validator');
const { name } = require('ejs');

app.use('/admin/pages',adminPage);
app.use('/admin/categories',adminCategories);
app.use('/admin/products',adminProducts);
app.use('/products',products);
app.use('/cart',cart);
app.use('/users',users);
app.use('/',pages);

//Inciar el servidor
const port = process.env.PORT || 3000
app.listen(port, ()=>{
    console.log(`Server started on port ${port}`);
});