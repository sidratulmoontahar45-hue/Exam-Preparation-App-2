import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const getProfessors = async () => {
  try {
    const response = await axiosInstance.get(API_PATHS.PROFESSORS.GET_PROFESSORS);
    return response.data?.data || [];
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch professors' };
  }
};

const createProfessor = async (professor) => {
  try {
    const response = await axiosInstance.post(API_PATHS.PROFESSORS.CREATE, professor);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to save professor' };
  }
};

const updateProfessor = async (id, professor) => {
  try {
    const response = await axiosInstance.put(API_PATHS.PROFESSORS.UPDATE(id), professor);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update professor' };
  }
};

const deleteProfessor = async (id) => {
  try {
    const response = await axiosInstance.delete(API_PATHS.PROFESSORS.DELETE(id));
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete professor' };
  }
};

const professorService = { getProfessors, createProfessor, updateProfessor, deleteProfessor };

export default professorService;
