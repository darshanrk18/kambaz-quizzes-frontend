import Link from "next/link";
import { Button, Container, Card } from "react-bootstrap";

export default function LandingPage() {
  return (
    <Container className="mt-5">
      <div className="text-center mb-5">
        <h1 className="display-4 text-danger mb-3">Kambaz Quizzes</h1>
        <p className="lead">
          A comprehensive Learning Management System with Quiz functionality
        </p>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-8">
          <Card className="shadow-sm">
            <Card.Body className="p-5">
              <h2 className="mb-4">Welcome to Kambaz</h2>
              <p className="mb-4">
                Kambaz is a Learning Management System inspired by Canvas, featuring
                course management, assignments, modules, and a comprehensive quiz system.
              </p>
              
              <div className="d-flex flex-column gap-3">
                <Link href="/Project">
                  <Button variant="danger" size="lg" className="w-100">
                    View Project Information
                  </Button>
                </Link>
                <Link href="/Account/Signin">
                  <Button variant="outline-danger" size="lg" className="w-100">
                    Sign In
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </Container>
  );
}

