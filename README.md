# helenshop-ecomm
A server-side rendered eCommerce app for viewing, editing, and purchasing a variety of products. Users can create an account in order to add their products to the store, though no account is necessary to start shopping with an anonymous shopping cart. 

## Live Demo: https://helenshop.herokuapp.com/

### Install Instructions
Currently, download the src folder and run the index.js file to run the app locally. Connect to localhost:3000 in the browser. Not ideal certainly. I plan to break apart index.js into multiple files with a server.js file for better organization.

### Architecture
Since I'm already comfortable with JavaScript, I decided to use NodeJS to gain additional practice with backend JS. 
I also used:
- Crypto module (scrypt) of the Node standard library to encrypt and store passwords
- Express.js for easy RESTful routing and CRUD functionality
- Passport and Passport-local for secure authentication middleware to signup and signin users
- Express-Session and Express-MySQL-Session to store session information serverside using a unique sessionID in a MySQL table; anonymous users can maintain a shopping cart associated with the sessionID so they start shopping right away without creating an account
- Connect-Flash for session-based flash messages for the user regarding successes and failures during application use
- Express-Validator to sanitize user inputs at signup and provide specific feedback about input field errors and requirements
- MySQL to gain practice in using a relational database and SQL instead of MongoDB; practice in creating and maintaining SQL tables and utilizing the MySQL reference manual
- Pug.js to generate HTML templates including JavaScript functionality; different HTML is shown depending on user and session data

### Design
No CSS framework here; I wrote all of the CSS myself. Everything is designed to be mobile-friendly and responsive to window size changes. 

### To-Dos
- Add app functionality: 
  - product reviews
  - seller info for each product
  - user comments and questions
  - user profiles
  - ability to search and sort products
  - add keywords and genres to products to enable sorting
  - checkout functionality to purchase items and empty the cart
  - timeout on cart, return product to inventory if not purchased
  - way for user to change their password or recover a forgotten password via email or two-factor authentication
  - type in quantity wanted of product instead of clicking +1 button many times
- Add more authentication types than local; perhaps OAuth, 2-factor
- Nicer CSS and design, fix footer that doesn't stay at the bottom of the page
- Add hashes to URL to prevent scrolling back to the top of page on any redirect
- Clean up the file organization; break into multiple files, remove comments and incomplete code

### Limitations
- Sessions table is not automatically cleared out
- Session-based carts are never deleted and their items are not returned to inventory
- Products in carts that are never checked out remove product from total inventory
- There is no checkout or payment functionality
- User cannot change their password or recover forgotten password

### Screenshots
##### Dashboard for a new user:
![Screenshot of App](https://github.com/halbird/images/blob/master/dashboard.png)


##### Products page for a signed in user; other users' products can be added to cart, or user can edit their own products:
![Screenshot of App](https://github.com/halbird/images/blob/master/products.png)


##### Account page for a signed in user; account info can be changed and user can view and edit all of their products currently available:
![Screenshot of App](https://github.com/halbird/images/blob/master/account.png)


##### Shopping cart page; quantity of each product can be increased or decreased by 1; available for signed in and anonymous users:
![Screenshot of App](https://github.com/halbird/images/blob/master/cart.png)


##### Signup form for a new user; very similar to the signin form for existing users:
![Screenshot of App](https://github.com/halbird/images/blob/master/signup.png)


##### Mobile version of the products page with closed toggle menu:
![Screenshot of App](https://github.com/halbird/images/blob/master/mobileproducts.png)


##### Mobile version of dashboard with open toggle menu:
![Screenshot of App](https://github.com/halbird/images/blob/master/mobilemenu.png)
