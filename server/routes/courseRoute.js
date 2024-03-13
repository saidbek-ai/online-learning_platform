import { Router } from "express";
import { protect, restrictTo } from "../controllers/authController.js";
import {
  getAllCourses,
  getCourse,
  createCourse,
  deleteCourse,
  updateCourse,
  getSectionsByCourse,
  createSection,
  updateSection,
  deleteSection,
  getLessons,
  createLesson,
  deleteLesson,
  getVideoFile,
  reformatVideoFile,
  videoUpload,
} from "../controllers/courseController.js";

const router = Router();

// router.get("/", (req, res) => {
//   res.send("Courses");
// });

router.use(protect);

router.get("/video", getVideoFile); // not checked!

router
  .route("/")
  .get(getAllCourses)
  .post(restrictTo("course-instructor"), createCourse);

router
  .route("/:courseId")
  .get(getCourse) // recheck after error handler
  .patch(restrictTo("course-instructor"), updateCourse)
  .delete(restrictTo("course-instructor"), deleteCourse); // not checked!

router
  .route("/modules/:courseId")
  .get(getSectionsByCourse)
  .post(restrictTo("course-instructor"), createSection);

router.get("/lesson", getLessons); // not checked

// Routes for course instructors
router.use(restrictTo("course-instructor"));
router.route("/modul/:sectionId").patch(updateSection).delete(deleteSection); // recheck delete route after full checking all routes!

router.post(
  "/lesson/:courseId/:sectionId",
  videoUpload,
  reformatVideoFile,
  createLesson
); // not checked

router.delete("/lesson/:lessonId", deleteLesson); // not checked!

{
  /* <form action="/upload" method="post" enctype="multipart/form-data">
  <input type="file" name="video" accept="video/*">
  <button type="submit">Upload</button>
</form> */
}

export default router;
