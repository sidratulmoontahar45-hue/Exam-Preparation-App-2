import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const getExams = async () => {
  try {
    const response = await axiosInstance.get(API_PATHS.EXAMS.GET_EXAMS);
    return response.data?.data || [];
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch exams' };
  }
};

const createExam = async (exam) => {
  try {
    const response = await axiosInstance.post(API_PATHS.EXAMS.CREATE, exam);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to save exam' };
  }
};

const updateExam = async (id, exam) => {
  try {
    const response = await axiosInstance.put(API_PATHS.EXAMS.UPDATE(id), exam);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update exam' };
  }
};

const deleteExam = async (id) => {
  try {
    const response = await axiosInstance.delete(API_PATHS.EXAMS.DELETE(id));
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete exam' };
  }
};

const examService = { getExams, createExam, updateExam, deleteExam };

export default examService;
