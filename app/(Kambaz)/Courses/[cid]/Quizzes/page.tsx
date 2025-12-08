"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ListGroup, ListGroupItem, Dropdown } from "react-bootstrap";
import { FaEllipsisV, FaCheckCircle } from "react-icons/fa";
import * as client from "./client";
import QuizzesControls from "./QuizzesControls";

export default function Quizzes() {
  const { cid } = useParams();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quizzes, setQuizzes] = useState<any[]>([]);

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

  return (
    <div>
      <QuizzesControls />
      <br />
      <br />
      <br />
      {quizzes.length === 0 ? (
        <div className="text-center p-5">
          <p>No quizzes yet. Click the &quot;+ Quiz&quot; button to add a new quiz.</p>
        </div>
      ) : (
        <ListGroup className="rounded-0">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {quizzes.map((quiz: any) => (
            <ListGroupItem
              key={quiz._id}
              className="d-flex justify-content-between align-items-center"
            >
              <div className="d-flex align-items-center flex-grow-1">
                {quiz.published && (
                  <FaCheckCircle className="text-success me-2" />
                )}
                <div
                  className="flex-grow-1"
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(`/Courses/${cid}/Quizzes/${quiz._id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/Courses/${cid}/Quizzes/${quiz._id}`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <strong>{quiz.title}</strong>
                </div>
              </div>
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
            </ListGroupItem>
          ))}
        </ListGroup>
      )}
    </div>
  );
}
