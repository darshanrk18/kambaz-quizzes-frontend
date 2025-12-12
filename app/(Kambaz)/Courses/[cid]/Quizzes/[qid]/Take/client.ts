import axios from "axios";

const axiosWithCredentials = axios.create({ withCredentials: true });

const HTTP_SERVER = process.env.NEXT_PUBLIC_HTTP_SERVER;
const ATTEMPTS_API = `${HTTP_SERVER}/api/attempts`;
const QUIZZES_API = `${HTTP_SERVER}/api/quizzes`;

export const createAttempt = async (quizId: string) => {
  const response = await axiosWithCredentials.post(
    `${QUIZZES_API}/${quizId}/attempts`
  );
  return response.data;
};

export const updateAttempt = async (attemptId: string, attempt: any) => {
  const response = await axiosWithCredentials.put(
    `${ATTEMPTS_API}/${attemptId}`,
    attempt
  );
  return response.data;
};

export const submitAttempt = async (
  attemptId: string,
  answers: any,
  score: number,
  totalPoints: number
) => {
  const response = await axiosWithCredentials.post(
    `${ATTEMPTS_API}/${attemptId}/submit`,
    { answers, score, totalPoints }
  );
  return response.data;
};

export const findLatestAttempt = async (userId: string, quizId: string) => {
  const response = await axiosWithCredentials.get(
    `${HTTP_SERVER}/api/users/${userId}/quizzes/${quizId}/attempts/latest`
  );
  return response.data;
};

export const getAttemptHistory = async (userId: string, quizId: string) => {
  const response = await axiosWithCredentials.get(
    `${HTTP_SERVER}/api/users/${userId}/quizzes/${quizId}/attempts`
  );
  return response.data;
};

