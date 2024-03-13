import { Schema, model } from "mongoose";

const lessonSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "A lesson must have title!"],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "A lesson must in course!"],
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: "Section",
      required: [true, "A lesson must in section!"],
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A lesson must have instructor!"],
    },
    lessonType: {
      type: String,
      required: [true, "A lesson must have type"],
      enum: ["video", "quiz"],
      default: "video",
    },
    videoUrl: {
      type: String,
    },
    contentDuration: {
      type: Number,
      required: [true, "A lesson must have duration!"],
    },
    quiz: {
      questions: [{}],
      answers: [{}],
    },
    isDeleted: { type: Boolean, default: false, select: false },
    deletedByWhom: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Lesson = model("Lesson", lessonSchema);
export default Lesson;
