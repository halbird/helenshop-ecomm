// document.querySelector()

// select the delete button, make function assign to onclick, true if want request, false if no

window.onload = function() {

const body = document.querySelector("body");
const mobileNav = document.querySelector(".mobileNav");
const mobileMenu = document.querySelector(".mobileMenu");
const menuToggle = document.querySelector(".menuToggle");
const products = document.querySelector(".products");
const cover = document.querySelector(".cover");

// const increaseQuantityBtn = document.querySelector()

menuToggle.addEventListener("click", e => {
  e.preventDefault();
  if (mobileMenu.style.display === "block") {
    mobileMenu.style.display = "none";
    cover.style.display = "none";
    // body.style.overflow = "auto";
  } else {
    mobileMenu.style.display = "block";
    cover.style.display = "block";
    // body.style.overflow = "hidden"; 
  }
});

menuToggle.addEventListener("click", e => {
  e.preventDefault();
  mobileNav.classList.toggle("open");
  mobileNav.classList.toggle("closed");
});

window.addEventListener("resize", e => {
  cover.style.display = "none";
  mobileMenu.style.display = "none";
  mobileNav.classList.add("closed");
  mobileNav.classList.remove("open");
  body.style.overflow = "auto";
});



// reload page with updated quantity and hash location of the product on the page
  // window.location.hash = "#hash"
  // this.location.reload();
}


// const burgerMenu = document.querySelector("#burger");
// const links = document.querySelector("#menuLinks");



// window.onload = function() {

// }
// function toggleMenu() {
//   links.classList.toggle("displayBlock");
// }

// burgerMenu.addEventListener("click", toggleMenu);


// function myFunction() {
//   if(links.style.display === "block") {
//     links.style.display = "none"
//   } else {
//     links.style.display = "block"
//   }
// }

// function myFunction() {
//   const x = document.getElementById("myLinks");
//   if (x.style.display === "block") {
//     x.style.display = "none";
//   } else {
//     x.style.display = "block";
//   }
// }