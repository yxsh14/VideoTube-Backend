// 1ST way
const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}


//2ND way
// const asyncHandler = (fn) => { }
// const asyncHandler = (fn) => { () => {} }
// const asyncHandler = (fn) => () => {}


// const asyncHandler = (fn) =>async (req,res,next) => {
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success:false,
//             message:err.message
//         })
//     }
// }

export { asyncHandler }