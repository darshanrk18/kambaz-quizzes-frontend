"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ListGroup, ListGroupItem, Dropdown } from "react-bootstrap";
import { FaEllipsisV, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useSelector } from "react-redux";
import * as client from "./client";
import QuizzesControls from "./QuizzesControls";

export default function Quizzes() {
  const { cid } = useParams();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quizzes, setQuizzes] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { currentUser } = useSelector((state: any) => state.accountReducer);
  const isFaculty = currentUser?.role === "FACULTY";

  const fetchQuizzes = useCallback(async () => {
    try {
      const quizzesData = await client.findQuizzesForCourse(cid as string);
      // Sort by availableDate
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sorted = quizzesData.sort((a: any, b: any) => {
        const dateA = a.availableDate || "";
        const dateB = b.availableDate || "";
        return dateA.localeCompare(dateB);
      });
      setQuizzes(sorted);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      setQuizzes([]);
    }
  }, [cid]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  // Note: Quiz creation is handled in QuizzesControls component

  const handleDeleteQuiz = async (quizId: string) => {
    if (globalThis.confirm("Are you sure you want to delete this quiz?")) {
      try {
        await client.deleteQuiz(quizId);
        fetchQuizzes();
      } catch (error) {
        console.error("Error deleting quiz:", error);
      }
    }
  };

  const handlePublishToggle = async (quizId: string, currentPublished: boolean) => {
    try {
      await client.publishQuiz(quizId, !currentPublished);
      fetchQuizzes();
    } catch (error) {
      console.error("Error toggling publish status:", error);
    }
  };

  const getAvailabilityStatus = (quiz: any) => {
    if (!quiz.availableDate) return "Available";
    const now = new Date();
    const available = new Date(quiz.availableDate);
    const until = quiz.untilDate ? new Date(quiz.untilDate) : null;

    if (now < available) {
      return `Not available until ${quiz.availableDate}`;
    }
    if (until && now > until) {
      return "Closed";
    }
    return "Available";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div>
      {isFaculty && <QuizzesControls />}
      <br />
      <br />
      <br />
      {quizzes.length === 0 ? (
        <div className="text-center p-5">
          <p>
            {isFaculty
              ? 'No quizzes yet. Click the "+ Quiz" button to add a new quiz.'
              : "No quizzes available."}
          </p>
        </div>
      ) : (
        <ListGroup className="rounded-0">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {quizzes.map((quiz: any) => {
            const availabilityStatus = getAvailabilityStatus(quiz);
            
            return (
              <ListGroupItem
                key={quiz._id}
                className="d-flex flex-column"
              >
                <div className="d-flex justify-content-between align-items-start w-100 mb-2">
                  <div className="d-flex align-items-center flex-grow-1">
                    {quiz.published ? (
                      <FaCheckCircle
                        className="text-success me-2"
                        onClick={() => isFaculty && handlePublishToggle(quiz._id, quiz.published)}
                        style={{ cursor: isFaculty ? "pointer" : "default" }}
                        title={isFaculty ? "Click to unpublish" : "Published"}
                      />
                    ) : (
                      <FaTimesCircle
                        className="text-secondary me-2"
                        onClick={() => isFaculty && handlePublishToggle(quiz._id, quiz.published)}
                        style={{ cursor: isFaculty ? "pointer" : "default" }}
                        title={isFaculty ? "Click to publish" : "Unpublished"}
                      />
                    )}
                    <div className="flex-grow-1">
                      <button
                        type="button"
                        className="btn btn-link text-start p-0 text-decoration-none fw-bold"
                        style={{ cursor: "pointer", border: "none", background: "none" }}
                        onClick={() => router.push(`/Courses/${cid}/Quizzes/${quiz._id}`)}
                      >
                        {quiz.title}
                      </button>
                      <div className="small text-muted">
                        {availabilityStatus}
                        {quiz.dueDate && ` • Due ${formatDate(quiz.dueDate)}`}
                        {quiz.points !== undefined && ` • ${quiz.points} pts`}
                        {quiz.questions && ` • ${quiz.questions.length} questions`}
                      </div>
                    </div>
                  </div>
                  {isFaculty && (
                    <Dropdown>
                      <Dropdown.Toggle
                        variant="link"
                        id={`quiz-menu-${quiz._id}`}
                        className="text-dark"
                      >
                        <FaEllipsisV />
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item
                          onClick={() => router.push(`/Courses/${cid}/Quizzes/${quiz._id}/Editor`)}
                        >
                          Edit
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() =>
                            handlePublishToggle(quiz._id, quiz.published)
                          }
                        >
                          {quiz.published ? "Unpublish" : "Publish"}
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => handleDeleteQuiz(quiz._id)}
                          className="text-danger"
                        >
                          Delete
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  )}
                </div>
              </ListGroupItem>
            );
          })}
        </ListGroup>
      )}
    </div>
  );
}
