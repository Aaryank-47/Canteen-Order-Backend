import foodModel from '../models/foodModel.js';

export const calculateTotalPrice = async (foodItems) => {
  let totalPrice = 0;

  for (const item of foodItems) {
    const food = await foodModel.findById(item.foodId).lean(); // use lean() for faster read
    if (food) {
      totalPrice += food.foodPrice * item.foodQuantity;
    }
  }

    return totalPrice;
}





// import foodModel from '../models/foodModel.js';

// export const calculateTotalPrice = async (foodItems) => {
//   let totalPrice = 0;
//   foodItems.map((item) => {
//     const food = await foodModel.find((food) => food._id === item.foodId);
//     if (food) {
//       totalPrice += food.foodPrice * item.foodQuantity;
//     }
//   });
//   return totalPrice;
// }