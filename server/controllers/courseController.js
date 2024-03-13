import path from "node:path";
import fs from "fs";
import multer from "multer";
import Course from "../models/courseModel.js";
import Lesson from "../models/lessonModel.js";
import Section from "../models/sectionModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import ffmpeg from "fluent-ffmpeg";

const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, "uploads/courses/");
  },
  filename: (req, res, cb) => {
    cb(
      null,
      `course-${req.user._id}-${Date.now()}-${path.extname(file.originalname)}`
    );
  },
});

const videoFilter = (req, file, cb) => {
  console.log(file.mimetype);
  // if (file.mimetype.startsWith("video")) {
  //   cb(null, true);
  // } else {
  //   cb(new AppError("Uploaded file is not image!", 400), false);
  // }
};

const upload = multer({ storage, fileFilter: videoFilter });

export const videoUpload = upload.single("videoUrl");

export const reformatVideoFile = async (req, res, next) => {
  if (!req.file) return next();

  try {
    req.file.filename = `course-${req.user._id}-${Date.now()}.mp4`;
    const outputPath = `uploads/courses/${req.file.filename}`;

    const video = ffmpeg(req.file.path);

    video
      .videoCodec("libx264")
      .audioCodec("aac")
      .on("error", (err) => {
        console.log("FFmpeg error:", err);
        return next(new AppError(err.message, 400));
      })
      .duration((err, duration) => {
        req.file.duration = duration;
      })
      .save(outputPath);

    next();
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

export const getVideoFile = catchAsync(async (req, res, next) => {
  const { videoName } = req.params;

  const __filename = url.fileURLToPath(import.meta.url);
  const videoPath = path.join(
    path.dirname(__filename),
    "./../uploads/courses",
    videoName
  );

  if (!fs.existsSync(videoPath)) {
    return next(new AppError("Video not found!"));
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const videoType = "video/mp4";

  res.writeHead(200, {
    "Content-Type": videoType,
    "Content-Length": fileSize,
    "Accept-Ranges": "bytes",
  });

  const videoStream = fs.createReadStream(videoPath);

  videoStream.on("error", (err) => {
    console.log("Error streaming video !!!!");
    return next(new AppError(`Error streaming: ${err.message}`, 500));
  });

  videoStream.pipe(res);
});

export const getAllCourses = catchAsync(async (req, res, next) => {
  const courses = await Course.find({ isDeleted: { $ne: true } }).select(
    "+isDeleted"
  );

  if (!courses) return next(new AppError("Courses not found!", 404));

  res.status(200).json({
    results: courses.length,
    courses,
  });
});

export const getCourse = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId);

  if (!course || course.isDeleted === true) {
    return next(new AppError("Course not found!", 404));
  }

  res.status(200).json({ course });
});

export const createCourse = catchAsync(async (req, res, next) => {
  const { _id: instructor } = req.user;

  const { title, description, image, requirements, language, price } = req.body;

  const course = await Course.create({
    title,
    description,
    image,
    requirements,
    language,
    price,
    instructor,
  });

  if (!course) {
    return next(new AppError("Cannot create course!", 400));
  }

  res.status(201).json({ course });
});

export const updateCourse = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;
  const currentUserId = req.user._id;
  const { title, description, image, requirements, language, price } = req.body;

  const course = await Course.findById(courseId);

  if (!course) {
    return next(new AppError("Course not found!", 404));
  }

  //Check course instructor isEqual with current user if not throw new Error!
  if (!course.instructor.equals(currentUserId)) {
    return next(new AppError("You can edit only your own courses!"));
  }

  const updatedCourse = await Course.findByIdAndUpdate(
    courseId,
    {
      title,
      description,
      image,
      requirements,
      language,
      price,
    },
    { new: true, runValidators: true }
  );

  if (!updateCourse) {
    return next(
      new AppError("Something went wrong! Cannot update course!", 400)
    );
  }

  res.status(201).json({
    course: updatedCourse,
  });
});

export const deleteCourse = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;
  const currentUserId = req.user._id;

  const lessons = await Lesson.updateMany(
    { courseId },
    { isDeleted: true, deletedByWhom: currentUserId }
  );

  const sections = await Section.updateMany(
    { courseId },
    { isDeleted: true, deletedByWhom: currentUserId }
  );

  const course = await Course.findByIdAndUpdate(courseId, {
    isDeleted: true,
    deletedByWhom: currentUserId,
  });

  if (!course) return next(new AppError("Course not found!", 400));

  res.status(200).json({ message: "Course deleted successfully!" });
});

export const createSection = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;
  const { sectionTitle: title } = req.body;
  const currentUserId = req.user._id;

  const course = await Course.findById(courseId);

  if (!course) return next(new AppError("Course not found!", 404));

  if (!course.instructor.equals(currentUserId)) {
    return next(
      new AppError(
        "You don't have permission to create section in this course!"
      )
    );
  }

  const section = await Section.create({
    courseId,
    title,
    instructor: currentUserId,
  });

  if (!section) return next(new AppError("Cannot create course!", 400));

  course.sectionsOrder.push(section._id);
  await course.save();

  res.status(201).json({ section });
});

export const getSectionsByCourse = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;

  const section = await Section.find({ courseId });

  if (!section) return next(new AppError("Section not found!", 404));

  res.status(200).json({ results: section.length, section });
});

export const updateSection = catchAsync(async (req, res, next) => {
  const { sectionId } = req.params;
  const currentUserId = req.user._id;
  const { sectionTitle: title, lessonsOrder } = req.body;

  const section = await Section.findById(sectionId);

  if (!section) {
    return next(new AppError("Section not found!", 404));
  }

  if (!section.instructor.equals(currentUserId)) {
    return next(
      new AppError(
        "You don't have permission to update section in this course!",
        403
      )
    );
  }

  const updatedSection = await Section.findByIdAndUpdate(
    sectionId,
    { title, lessonsOrder },
    { new: true, runValidators: true }
  );

  if (!updatedSection) {
    return next(new AppError("Cannot update Course!", 400));
  }

  res.status(201).json({
    section: updatedSection,
  });
});

export const deleteSection = catchAsync(async (req, res, next) => {
  const { sectionId } = req.params;
  const currentUserId = req.user._id;

  const section = await Section.findById(sectionId);

  if (!section) return next(new AppError("Section not found!"));

  if (!section.instructor.equals(currentUserId)) {
    return next(new AppError("You can only delete your own courses!", 400));
  }

  const lessons = await Lesson.updateMany(
    { courseId: section.courseId },
    { isDeleted: true, deletedByWhom: currentUserId }
  );

  await Section.findByIdAndUpdate(sectionId, {
    isDeleted: true,
    deletedByWhom: currentUserId,
  });

  res.status(203).json({ message: "Section Deleted successfully!" });
});

export const createLesson = catchAsync(async (req, res, next) => {
  const { courseId, sectionId } = req.params;
  const { title, lessonType, quiz } = req.body;
  const currentUserId = req.user._id;
  const videoUrl = req.file.filename;
  const contentDuration = req.file.duration;
  const section = await Section.findById(sectionId);

  if (!section) return next(new AppError("Section not found!", 404));

  if (section.instructor !== currentUserId)
    return next(new AppError("You don't have permission to this route!"));

  if (!videoUrl || !quiz) {
    return next(new AppError("There is no content for lesson!"));
  }

  const lesson = await Lesson.create({
    title,
    courseId,
    sectionId,
    videoUrl,
    contentDuration,
    lessonType,
    quiz,
  });

  if (!lesson) return next(new AppError("Cannot create lesson!"));

  section.lessonsOrder.push(lesson._id);
  await section.save();

  res.status(201).json({ lesson });
});

export const getLessons = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;

  const pipeline = [
    {
      $match: { courseId: { $eq: courseId } },
    },
    {
      $group: {
        _id: "sectionId",
      },
    },
  ];

  const lessons = await Lesson.aggregate(pipeline);

  if (!lessons) return next(new AppError("Lesson not found!", 404));

  res.status(200).json({ lessons });
});

export const deleteLesson = catchAsync(async (req, res, next) => {
  const { lessonId } = req.params;
  const currentUserId = req.user._id;

  const lesson = await Lesson.findById(lessonId);

  if (!lesson) {
    return next(new AppError("Lesson not found!", 400));
  }

  if (lesson.instructor !== currentUserId) {
    return next(
      new AppError("You don't have permission to delete this lesson!", 400)
    );
  }

  lesson = { ...lesson, isDeleted: true, deletedByWhom: currentUserId };
  await lesson.save();

  res.status(200).json({
    message: "Lesson deleted successfully!",
  });
});
