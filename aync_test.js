// import async from "async";
let async = require("async");

// Using Promises
// async
//   .each(fileList, deleteFile)
//   .then(() => {
//     console.log("All files have been deleted successfully");
//   })
//   .catch((err) => {
//     console.log(err);
//   });

let arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
let arr2 = [];
async
  .eachOfLimit(arr, 2, (arr_el, arr_index, callback) => {
    arr2.push(arr_el * 2);
    // return arr_el * 3;
    callback();
  })
  .then(() => {
    console.log("A", arr2);
  })
  .catch((err) => {
    console.log(err);
  });
// console.log(arr2);
