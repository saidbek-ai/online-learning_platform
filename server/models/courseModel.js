import { Schema, model } from "mongoose";

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "A course must have title!"],
    },
    description: {
      type: String,
      required: [true, "A course must have description!"],
    },
    sectionsOrder: [{ type: String }],
    image: {
      type: String,
      // required: [true, "A course must have Thumbnail!"],
    },
    category: [String],
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A course must have author!"],
    },
    language: {
      type: String,
      required: [true, "Please enter language of the course!"],
    },
    rating: { type: Number },
    requirements: [String],
    price: { type: Number, required: [true, "A course must have price!"] },
    // editPermission: [{ type: SchemaType.ObjectId, ref: "User" }],
    isDeleted: { type: Boolean, default: false, select: false },
    deletedByWhom: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

courseSchema.pre(/^find/, function () {
  this.populate({
    path: "instructor",
    select: ["fName", "lName", "image"],
  });
});

const Course = model("Course", courseSchema);
export default Course;
