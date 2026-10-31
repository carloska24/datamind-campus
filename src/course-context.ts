import { createContext, useContext } from "react";
import { course, secondCourse } from "./data/course";

export const CourseContext = createContext<typeof course | typeof secondCourse>(
  course,
);
export const useCourse = () => useContext(CourseContext);
