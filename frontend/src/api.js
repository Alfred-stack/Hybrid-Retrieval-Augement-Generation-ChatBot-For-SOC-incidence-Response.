import axios from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 120000
});

export const sendMessage = async (
  question,
  sessionId = 'default'
) => {
  try {
    const response = await api.post('/chat', {
      question,
      sessionId
    });

    return {
      answer: response.data.answer || 'No response received.',
      sessionId:
        response.data.sessionId || sessionId
    };
  } catch (error) {
    console.error(
      'Chat request error:',
      error.response?.data || error.message
    );

    throw new Error(
      error.response?.data?.error ||
      'Failed to get response from server. Please try again.'
    );
  }
};

export const fetchMessages = async (
  sessionId = 'default'
) => {
  try {
    const response = await api.get(
      `/chat/messages/${encodeURIComponent(sessionId)}`
    );

    return response.data;
  } catch (error) {
    console.error(
      'Fetch messages error:',
      error.response?.data || error.message
    );

    throw new Error(
      'Failed to load conversation history.'
    );
  }
};

export const fetchSessions = async () => {
  try {
    const response = await api.get('/chat/sessions');

    return response.data;
  } catch (error) {
    console.error(
      'Fetch sessions error:',
      error.response?.data || error.message
    );

    throw new Error(
      'Failed to load conversation sessions.'
    );
  }
};

export const checkBackendHealth = async () => {
  try {
    const backendBaseURL =
      API_URL.replace(/\/api\/?$/, '');

    const response = await axios.get(
      `${backendBaseURL}/api/health`,
      {
        timeout: 10000
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      'Backend health check error:',
      error.response?.data || error.message
    );

    throw new Error(
      'Backend is not available.'
    );
  }
};