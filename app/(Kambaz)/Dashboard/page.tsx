"use client";
import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import * as userClient from "../Account/client";
import * as courseClient from "../Courses/client";
import * as enrollmentClient from "../Courses/enrollmentsClient";
import Link from "next/link";

export default function Dashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [courses, setCourses] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(true); // ← NEW STATE
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [course, setCourse] = useState<any>({
    name: "New Course",
    number: "New Number",
    startDate: "2023-09-10",
    endDate: "2023-12-15",
    description: "New Description",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { currentUser } = useSelector((state: any) => state.accountReducer);
  const router = useRouter();

  // Track render count for diagnostics
  const renderCount = useRef(0);
  renderCount.current++;
  console.log("=== DASHBOARD RENDER #" + renderCount.current + " ===");

  // Check if user is faculty
  const isFaculty = currentUser?.role === "FACULTY";

  // Add new course (Faculty only)
  const addNewCourse = async () => {
    try {
      const newCourse = await userClient.createCourse(course);
      setCourses([...courses, newCourse]);
      // Reset course form
      setCourse({
        name: "New Course",
        number: "New Number",
        startDate: "2023-09-10",
        endDate: "2023-12-15",
        description: "New Description",
      });
    } catch (error) {
      console.error("Error adding course:", error);
    }
  };

  // Update course (Faculty only)
  const updateCourse = async () => {
    try {
      if (!course._id) return; // Can't update without _id
      await courseClient.updateCourse(course);
      setCourses(courses.filter(c => c !== null && c !== undefined).map((c) => (c._id === course._id ? course : c)));
    } catch (error) {
      console.error("Error updating course:", error);
    }
  };

  // Delete course (Faculty only)
  const deleteCourse = async (courseId: string) => {
    try {
      await courseClient.deleteCourse(courseId);
      setCourses(courses.filter((c) => c !== null && c !== undefined && c._id !== courseId));
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  // Fetch courses function - moved inside useEffect to prevent infinite loop
  useEffect(() => {
    console.log("=== DASHBOARD useEffect TRIGGERED ===");
    console.log("currentUser exists:", !!currentUser);
    console.log("currentUser._id:", currentUser?._id);
    console.log("currentUser object:", currentUser);
    
    const fetchCourses = async () => {
      if (!currentUser?._id) {
        console.log("No user ID, skipping fetch");
        return;
      }
      
      try {
        console.log("Fetching courses for user:", currentUser._id);
        const rawEnrolledCourses = (await userClient.findMyCourses()) || [];
        console.log("Raw fetched enrolled courses:", rawEnrolledCourses);
        
        // Filter out null/undefined courses
        const validEnrolledCourses = rawEnrolledCourses.filter(
          (course) => course !== null && course !== undefined
        );
        
        console.log("Valid enrolled courses after filtering:", validEnrolledCourses);
        setCourses(validEnrolledCourses); // Use filtered array

        const rawAllCourses = (await courseClient.fetchAllCourses()) || [];
        console.log("Raw fetched all courses:", rawAllCourses);
        
        // Filter out null/undefined courses
        const validAllCourses = rawAllCourses.filter(
          (course) => course !== null && course !== undefined
        );
        
        console.log("Valid all courses after filtering:", validAllCourses);
        setAllCourses(validAllCourses); // Use filtered array
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, [currentUser?._id]); // Only run when user ID changes, not on every render

  // Enroll in course (Student)
  const enrollInCourse = async (courseId: string) => {
    try {
      await enrollmentClient.enrollInCourse("current", courseId);
      // Refetch courses after enrollment
      const rawEnrolledCourses = (await userClient.findMyCourses()) || [];
      // Filter out null/undefined courses
      const validEnrolledCourses = rawEnrolledCourses.filter(
        (course) => course !== null && course !== undefined
      );
      setCourses(validEnrolledCourses);
      
      const rawAllCourses = (await courseClient.fetchAllCourses()) || [];
      // Filter out null/undefined courses
      const validAllCourses = rawAllCourses.filter(
        (course) => course !== null && course !== undefined
      );
      setAllCourses(validAllCourses);
    } catch (error) {
      console.error(error);
    }
  };

  // Unenroll from course (Student)
  const unenrollFromCourse = async (courseId: string) => {
    try {
      await enrollmentClient.unenrollFromCourse("current", courseId);
      // Refetch courses after unenrollment
      const rawEnrolledCourses = (await userClient.findMyCourses()) || [];
      // Filter out null/undefined courses
      const validEnrolledCourses = rawEnrolledCourses.filter(
        (course) => course !== null && course !== undefined
      );
      setCourses(validEnrolledCourses);
      
      const rawAllCourses = (await courseClient.fetchAllCourses()) || [];
      // Filter out null/undefined courses
      const validAllCourses = rawAllCourses.filter(
        (course) => course !== null && course !== undefined
      );
      setAllCourses(validAllCourses);
    } catch (error) {
      console.error(error);
    }
  };

  const isEnrolled = (courseId: string) => {
    return courses.filter(c => c !== null && c !== undefined).some((c) => c._id === courseId);
  };

  // ← NEW: Determine which courses to display
  const displayedCourses = showEnrolledOnly ? courses : allCourses;
  const displayCount = displayedCourses.length;

  return (
    <div id="wd-dashboard">
      <h1 id="wd-dashboard-title">Dashboard</h1>

      {/* Add Course Button (Faculty Only) */}
      {isFaculty && (
        <>
          <h5>
            New Course
            <button
              className="btn btn-primary float-end"
              id="wd-add-new-course-click"
              onClick={addNewCourse}
            >
              Add
            </button>
            <button
              className="btn btn-warning float-end me-2"
              onClick={updateCourse}
              id="wd-update-course-click"
            >
              Update
            </button>
          </h5>
          <br />
          <input
            value={course.name}
            className="form-control mb-2"
            onChange={(e) => setCourse({ ...course, name: e.target.value })}
          />
          <textarea
            value={course.description}
            className="form-control"
            onChange={(e) =>
              setCourse({ ...course, description: e.target.value })
            }
          />
          <hr />
        </>
      )}

      {/* ← NEW: Toggle Button */}
      <h2 id="wd-dashboard-published">
        Published Courses ({displayCount})
        <button
          className="btn btn-primary float-end"
          onClick={() => setShowEnrolledOnly(!showEnrolledOnly)}
        >
          {showEnrolledOnly ? "All Courses" : "My Courses"}
        </button>
      </h2>
      <hr />

      <div className="row row-cols-1 row-cols-md-5 g-4">
        {displayedCourses
          .filter((course) => course !== null && course !== undefined)
          .map((course) => {
          const enrolled = isEnrolled(course._id);
          
          return (
            <div key={course._id} className="col" style={{ width: "300px" }}>
              <div className="card rounded-3 overflow-hidden">
                <Link
                  href={`/Courses/${course._id}/Home`}
                  className="wd-dashboard-course-link text-decoration-none text-dark"
                >
                  <img
                    src="/images/reactjs.jpg"
                    width="100%"
                    height={160}
                    alt={course.name}
                  />
                  <div className="card-body">
                    <h5 className="wd-dashboard-course-title card-title">
                      {course.name}
                    </h5>
                    <p
                      className="wd-dashboard-course-title card-text overflow-y-hidden"
                      style={{ maxHeight: 100 }}
                    >
                      {course.description}
                    </p>
                    <button 
                      className="btn btn-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("=== GO BUTTON CLICKED ===");
                        console.log("Course ID:", course._id);
                        console.log("Course name:", course.name);
                        console.log("Navigating to:", `/Courses/${course._id}/Home`);
                        router.push(`/Courses/${course._id}/Home`);
                      }}
                    > 
                      Go 
                    </button>

                    {/* Faculty Controls */}
                    {isFaculty && (
                      <>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            deleteCourse(course._id);
                          }}
                          className="btn btn-danger float-end"
                          id="wd-delete-course-click"
                        >
                          Delete
                        </button>
                        <button
                          id="wd-edit-course-click"
                          onClick={(e) => {
                            e.preventDefault();
                            setCourse(course);
                          }}
                          className="btn btn-warning float-end me-2"
                        >
                          Edit
                        </button>
                      </>
                    )}

                    {/* Student Controls - Show Enroll/Unenroll based on enrollment status */}
                    {/* Only show Enroll/Unenroll buttons when viewing "All Courses", not "My Courses" */}
                    {!isFaculty && !showEnrolledOnly && (
                      <>
                        {enrolled ? (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              unenrollFromCourse(course._id);
                            }}
                            className="btn btn-danger float-end"
                          >
                            Unenroll
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              enrollInCourse(course._id);
                            }}
                            className="btn btn-success float-end"
                          >
                            Enroll
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}