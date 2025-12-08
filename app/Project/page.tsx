"use client";

import Link from "next/link";
import { Card, ListGroup, ListGroupItem } from "react-bootstrap";
import { FaGithub, FaUser, FaCode } from "react-icons/fa";

export default function ProjectPage() {
  return (
    <div className="container mt-5 mb-5">
      <div className="text-center mb-5">
        <h1 className="display-4 text-danger mb-3">Kambaz Quizzes Project</h1>
        <p className="lead">Final Project - Web Development</p>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-10">
          {/* Team Information */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-danger text-white">
              <h3 className="mb-0">
                <FaUser className="me-2" />
                Team Members
              </h3>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroupItem>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>Darshan Ravindra Konnur</strong>
                      <br />
                      <small className="text-muted">Section: 05 (Online)</small>
                    </div>
                    <div>
                      <strong>Vikas Neriyanuru</strong>
                      <br />
                      <small className="text-muted">Section: 05 (Online)</small>
                    </div>
                  </div>
                </ListGroupItem>
              </ListGroup>
            </Card.Body>
          </Card>

          {/* Repository Links */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-danger text-white">
              <h3 className="mb-0">
                <FaCode className="me-2" />
                GitHub Repositories
              </h3>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroupItem>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>Frontend Repository</strong>
                      <br />
                      <small className="text-muted">
                        Next.js React application deployed on Netlify
                      </small>
                    </div>
                    <a
                      href="https://github.com/darshanrk18/kambaz-quizzes-frontend"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-danger"
                    >
                      <FaGithub className="me-2" />
                      View on GitHub
                    </a>
                  </div>
                </ListGroupItem>
                <ListGroupItem>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>Backend Repository</strong>
                      <br />
                      <small className="text-muted">
                        Node.js Express server with MongoDB deployed on Render
                      </small>
                    </div>
                    <a
                      href="https://github.com/darshanrk18/kambaz-quizzes-backend"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-danger"
                    >
                      <FaGithub className="me-2" />
                      View on GitHub
                    </a>
                  </div>
                </ListGroupItem>
              </ListGroup>
            </Card.Body>
          </Card>

          {/* Project Description */}
          <Card className="shadow-sm">
            <Card.Header className="bg-danger text-white">
              <h3 className="mb-0">Project Description</h3>
            </Card.Header>
            <Card.Body>
              <p>
                Kambaz Quizzes is a comprehensive Learning Management System
                that extends the Kambaz platform with a full-featured quiz
                system. The project includes:
              </p>
              <ul>
                <li>
                  User authentication and role-based access control
                  (Faculty/Student)
                </li>
                <li>Course management and enrollment</li>
                <li>Quiz creation and management for faculty</li>
                <li>
                  Multiple question types: Multiple Choice, True/False, Fill in
                  the Blank
                </li>
                <li>Quiz taking interface for students</li>
                <li>Automatic scoring and results display</li>
                <li>Quiz attempt tracking and multiple attempts support</li>
              </ul>
              <div className="mt-4">
                <Link href="/Account/Signin">
                  <button className="btn btn-danger">
                    Get Started - Sign In
                  </button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}

