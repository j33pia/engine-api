import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://localhost:3001',
});

import { getSession } from 'next-auth/react';

// Interceptor de Requisição: Injeta o Token JWT se existir sessão ativa
api.interceptors.request.use(async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
});

// Interceptor de Resposta: Trata erros
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('API Error Response:', {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers,
            });
        } else if (error.request) {
            // The request was made but no response was received
            console.error('API No Response:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('API Setup Error:', error.message);
        }
        return Promise.reject(error);
    }
);
