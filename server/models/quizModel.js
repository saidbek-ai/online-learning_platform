import { Schema, Types, model } from "mongoose";

const quizSchema = new Schema(
  {
    title: { type: String, required: [true, "A quiz must have title!"] },
    description: {
      type: String,
      required: [true, "A quiz must have description!"],
    },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },

    questions: [{}],

    isDeleted: { type: Boolean, default: false, select: false },
    deletedByWhom: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Quiz = model("Quiz", quizSchema);
export default Quiz;
