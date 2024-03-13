import { Schema, model } from "mongoose";

const sectionSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A section must have course id!"],
    },
    title: {
      type: String,
      required: [true, "A section must have title!"],
    },
    instructor: { type: Schema.Types.ObjectId, ref: "User" },
    lessonsOrder: [{ type: String }],
    isDeleted: { type: Boolean, default: false, select: false },
    deletedByWhom: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Section = model("Section", sectionSchema);
export default Section;
