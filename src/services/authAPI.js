import axios from 'axios'

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8080') + '/api'

export const authAPI = {
    signup: async (userData) => {
        const res = await axios.post(`${API_URL}/auth/signup`, userData)
        return res.data
    },
    login: async (credentials) => {
        const res = await axios.post(`${API_URL}/auth/login`, credentials)
        return res.data
    },
}
