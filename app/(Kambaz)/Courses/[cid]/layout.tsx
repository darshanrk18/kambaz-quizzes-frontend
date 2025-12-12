"use client";
import { ReactNode, useEffect, useState } from "react";
import CourseNavigation from "./Navigation";
import { useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import { FaAlignJustify } from "react-icons/fa6";
import * as courseClient from "../client";
import * as userClient from "../../Account/client";

export default function CoursesLayout({ children }: { children: ReactNode }) {
  const { cid } = useParams();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [course, setCourse] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { currentUser } = useSelector((state: any) => state.accountReducer);
  const { enrollments } = useSelector(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state: any) => state.enrollmentsReducer
  );

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const courses = await courseClient.fetchAllCourses();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const foundCourse = courses.find((c: any) => c._id === cid);
        setCourse(foundCourse);
      } catch (error) {
        console.error("Error fetching course:", error);
      }
    };

    fetchCourse();
  }, [cid]);

  useEffect(() => {
    console.log("=== COURSE LAYOUT ===");
    console.log("User:", currentUser);
    console.log("User ID:", currentUser?._id);
    console.log("User Role:", currentUser?.role);
    console.log("Course ID:", cid);
    console.log("Enrollments (Redux):", enrollments);
    console.log("Enrollments length:", enrollments?.length || 0);

    if (!currentUser) {
      console.log("No current user, redirecting to Signin");
      router.push("/Account/Signin");
      return;
    }

    // Faculty can access all courses
    if (currentUser.role === "FACULTY") {
      console.log("User is FACULTY, allowing access");
      return;
    }

    // For students, check enrollment by fetching their courses from backend
    // This matches how Dashboard checks enrollment
    const checkEnrollment = async () => {
      try {
        console.log("Fetching user's enrolled courses from backend...");
        const enrolledCourses = await userClient.findMyCourses();
        console.log("User's enrolled courses:", enrolledCourses);
        
        // Check if current course is in enrolled courses
        const isEnrolled = enrolledCourses?.some(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (course: any) => {
            const courseMatch = 
              String(course._id) === String(cid) ||
              course._id === cid;
            return courseMatch;
          }
        );

        console.log("Is enrolled (backend check)?", isEnrolled);
        
        if (!isEnrolled) {
          console.log("Student not enrolled, redirecting to Dashboard");
          console.log("Enrollment check details:");
          console.log("- Looking for course ID:", cid);
          console.log("- User's enrolled courses:", enrolledCourses);
          router.push("/Dashboard");
        } else {
          console.log("Student is enrolled, allowing access");
        }
      } catch (error) {
        console.error("Error checking enrollment:", error);
        // On error, don't block access - let user try
        console.log("Error fetching enrollment, allowing access (will fail gracefully if not enrolled)");
      }
    };

    checkEnrollment();
  }, [currentUser, cid, router]);

  return (
    <div id="wd-courses">
      <h2 className="text-danger">
        <FaAlignJustify className="me-4 fs-4 mb-1" />
        {course?.name} &gt; {course?.number}
      </h2>
      <hr />
      <div className="d-flex">
        <div className="d-none d-md-block">
          <CourseNavigation />
        </div>
        <div className="flex-fill">{children}</div>
      </div>
    </div>
  );
}