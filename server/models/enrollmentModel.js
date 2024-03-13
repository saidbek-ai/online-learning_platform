import { Schema, model } from "mongoose";

const enrollmentSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    completed: { type: Boolean, default: false },
    progress: {
      sections: [{ type: Schema.Types.ObjectId, ref: "Section" }],
      lessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
      lastAccessedLesson: { type: Schema.Types.ObjectId, ref: "Lesson" },
    },
  },
  { timestamps: true }
);

const Enrollment = model("Enrollment", enrollmentSchema);
export default Enrollment;
