// const catchAsync = (fn) => {
//   return (req, res, next) => {
//     try {
//       fn(req, res, next);
//     } catch (err) {
//       next(err);
//     }
//   };
// };
const catchAsync = (fn) => {
  return (req, res, next) => fn(req, res, next).catch(next);
};

export default catchAsync;
