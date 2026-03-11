import api from './axios'

// Policies
export const getPolicies = () => api.get('/policies').then(r => r.data)
export const getPolicy = id => api.get(`/policies/${id}`).then(r => r.data)
export const createPolicy = data => api.post('/policies', data).then(r => r.data)
export const updatePolicy = (id, data) => api.put(`/policies/${id}`, data).then(r => r.data)
export const deletePolicy = id => api.delete(`/policies/${id}`).then(r => r.data)

// Rules
export const getRules = (policyId) => api.get('/rules', { params: policyId ? { policy_id: policyId } : {} }).then(r => r.data)
export const getRule = id => api.get(`/rules/${id}`).then(r => r.data)
export const createRule = data => api.post('/rules', data).then(r => r.data)
export const updateRule = (id, data) => api.put(`/rules/${id}`, data).then(r => r.data)
export const deleteRule = id => api.delete(`/rules/${id}`).then(r => r.data)

// Evaluations
export const runEvaluation = data => api.post('/evaluations/run', data).then(r => r.data)
export const getEvaluations = (policyId) => api.get('/evaluations', { params: policyId ? { policy_id: policyId } : {} }).then(r => r.data)
export const getEvaluationStats = () => api.get('/evaluations/stats').then(r => r.data)
export const getEvaluation = id => api.get(`/evaluations/${id}`).then(r => r.data)

// Logs
export const getLogs = (entityType) => api.get('/logs', { params: entityType ? { entity_type: entityType } : {} }).then(r => r.data)

// ML Smart Rule Suggestions
export const getMLSuggestions = (policyId) => api.get('/ml/suggest', { params: policyId ? { policy_id: policyId } : {} }).then(r => r.data)
export const getMLStatus      = ()          => api.get('/ml/status').then(r => r.data)

// AI Policy Generator
export const generatePolicy  = (data) => api.post('/ai/generate-policy', data).then(r => r.data)
export const previewPolicy   = (data) => api.post('/ai/preview-policy',  { ...data, save_to_db: false }).then(r => r.data)