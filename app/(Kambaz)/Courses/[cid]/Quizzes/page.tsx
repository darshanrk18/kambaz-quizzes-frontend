"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ListGroup, ListGroupItem, Dropdown, Form } from "react-bootstrap";
import { FaEllipsisV, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useSelector } from "react-redux";
import * as client from "./client";
import QuizzesControls from "./QuizzesControls";

export default function Quizzes() {
  const { cid } = useParams();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { currentUser } = useSelector((state: any) => state.accountReducer);
  const isFaculty = currentUser?.role === "FACULTY";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dropdownStates, setDropdownStates] = useState<Record<string, boolean>>({});

  const fetchQuizzes = useCallback(async () => {
    try {
      const quizzesData = await client.findQuizzesForCourse(cid as string);
      // Sort by availableDate (ascending - earliest dates first)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sorted = quizzesData.sort((a: any, b: any) => {
        const dateA = a.availableDate ? new Date(a.availableDate).getTime() : 0;
        const dateB = b.availableDate ? new Date(b.availableDate).getTime() : 0;
        return dateA - dateB;
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

  // Force Popper position update when dropdowns open
  useEffect(() => {
    const openDropdownId = Object.keys(dropdownStates).find(id => dropdownStates[id]);
    if (openDropdownId) {
      // Trigger a resize event to force Popper to recalculate position
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [dropdownStates]);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Filter quizzes by search query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredQuizzes = quizzes.filter((quiz: any) => {
    if (!searchQuery.trim()) return true;
    return quiz.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div>
      {isFaculty && <QuizzesControls />}
      {/* Search Bar */}
      <div className="mb-3 mt-3">
        <Form.Control
          type="text"
          placeholder="Search quizzes by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-0"
        />
      </div>
      {quizzes.length === 0 ? (
        <div className="text-center p-5">
          <p>
            {isFaculty
              ? 'No quizzes yet. Click the "+ Quiz" button to add a new quiz.'
              : "No quizzes available."}
          </p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="text-center p-5">
          <p>No quizzes match your search: &quot;{searchQuery}&quot;</p>
        </div>
      ) : (
        <div style={{ maxHeight: "70vh", overflowY: "auto", position: "relative" }}>
          <ListGroup className="rounded-0">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {filteredQuizzes.map((quiz: any) => {
            const availabilityStatus = getAvailabilityStatus(quiz);
            
            return (
              <ListGroupItem
                key={quiz._id}
                className="d-flex justify-content-between align-items-center"
              >
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
                  <Dropdown 
                    align="end"
                    show={dropdownStates[quiz._id] || false}
                    onToggle={(isOpen) => {
                      setDropdownStates(prev => ({ ...prev, [quiz._id]: isOpen }));
                    }}
                  >
                    <Dropdown.Toggle
                      variant="link"
                      id={`quiz-menu-${quiz._id}`}
                      className="text-dark"
                    >
                      <FaEllipsisV />
                    </Dropdown.Toggle>
                    <Dropdown.Menu
                      popperConfig={{
                        strategy: "fixed",
                        modifiers: [
                          {
                            name: "computeStyles",
                            options: {
                              adaptive: true,
                            },
                          },
                          {
                            name: "offset",
                            options: {
                              offset: [0, 4],
                            },
                          },
                          {
                            name: "preventOverflow",
                            options: {
                              boundary: "viewport",
                              padding: 8,
                            },
                          },
                          {
                            name: "flip",
                            enabled: true,
                            options: {
                              fallbackPlacements: ["top-end", "bottom-start", "top-start"],
                            },
                          },
                        ],
                      }}
                    >
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
              </ListGroupItem>
            );
          })}
          </ListGroup>
        </div>
      )}
    </div>
  );
}
