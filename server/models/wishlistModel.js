import { Schema, model } from "mongoose";

const wishlistItemSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
  },
  { timestamps: true }
);

const WishlistItem = model("WishlistItem", wishlistItemSchema);
export default Wishlist;
