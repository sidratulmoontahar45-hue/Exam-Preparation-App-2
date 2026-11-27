import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

// Generating and grading use the AI, so they are allowed to take longer
const LONG = { timeout: 150000 };

const wrap = (fallback) => (error) => {
  throw error.response?.data || { error: fallback, message: fallback };
};

const getMockTests = () =>
  axiosInstance.get(API_PATHS.MOCK_TESTS.LIST).then((r) => r.data?.data || []).catch(wrap('Failed to load tests'));

const getActiveTest = () =>
  axiosInstance.get(API_PATHS.MOCK_TESTS.ACTIVE).then((r) => r.data?.data || null).catch(wrap('Failed to check active exam'));

const startMockTest = (documentId) =>
  axiosInstance.post(API_PATHS.MOCK_TESTS.START, { documentId }, LONG).then((r) => r.data?.data).catch(wrap('Failed to start exam'));

const getMockTest = (id) =>
  axiosInstance.get(API_PATHS.MOCK_TESTS.GET(id)).then((r) => r.data?.data).catch(wrap('Failed to load exam'));

const saveAnswers = (id, answers) =>
  axiosInstance.put(API_PATHS.MOCK_TESTS.SAVE_ANSWERS(id), { answers }).then((r) => r.data).catch(wrap('Failed to save answers'));

const submitMockTest = (id, answers) =>
  axiosInstance.post(API_PATHS.MOCK_TESTS.SUBMIT(id), { answers }, LONG).then((r) => r.data?.data).catch(wrap('Failed to submit exam'));

const gradeMockTest = (id) =>
  axiosInstance.post(API_PATHS.MOCK_TESTS.GRADE(id), {}, LONG).then((r) => r.data?.data).catch(wrap('Failed to grade exam'));

const abandonMockTest = (id) =>
  axiosInstance.post(API_PATHS.MOCK_TESTS.ABANDON(id)).then((r) => r.data).catch(wrap('Failed to end exam'));

const mockTestService = {
  getMockTests,
  getActiveTest,
  startMockTest,
  getMockTest,
  saveAnswers,
  submitMockTest,
  gradeMockTest,
  abandonMockTest,
};

export default mockTestService;
