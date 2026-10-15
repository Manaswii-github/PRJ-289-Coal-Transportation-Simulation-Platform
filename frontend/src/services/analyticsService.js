import api from "./api";


export const getAnalyticsSummary = async () => {
    const response = await api.get(
        "/analytics/summary"
    );

    return response.data;
};