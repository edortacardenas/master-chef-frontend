// The API key is now handled by the backend.
const BACKEND_NEWS_URL = `${import.meta.env.VITE_BACKEND_URL}/api/top-headlines`; // URL for your backend endpoint


export interface Article {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: Article[];
  message?: string; // Para errores de la API
  code?: string; // Para errores de la API
}

// Interface for error responses from your backend
interface BackendErrorResponse {
  message: string;
  code?: string;
  details?: string;
}

export const getNewsFetch = async (page = 1, pageSize = 10): Promise<Article[]> => {
  // API_KEY is no longer needed here as the backend handles it.
  
  const params = new URLSearchParams({
    country: 'us', // Puedes cambiar el país o hacerlo configurable
    page: String(page),
    pageSize: String(pageSize),
  });

  const response = await fetch(`${BACKEND_NEWS_URL}?${params.toString()}`);

  if (!response.ok) {
    let errorMessage = `Error HTTP: ${response.status} ${response.statusText}`;
    try {
      // Errors from your backend will have a specific structure
      const errorData: BackendErrorResponse = await response.json();
      if (errorData.message) {
        errorMessage = `Error desde el backend: ${errorData.message}`;
        if (errorData.code) errorMessage += ` (código: ${errorData.code})`;
        if (errorData.details) errorMessage += ` (detalles: ${errorData.details})`;
      }
    } catch (e) {
      console.warn('No se pudo parsear el JSON de error del backend. Usando mensaje HTTP por defecto.', e);
    }
    console.error('Error al obtener noticias:', errorMessage);
    throw new Error(errorMessage);
  }

  const data: NewsApiResponse = await response.json();

  // Your backend forwards the NewsAPI response structure, including the 'status' field.
  if (data.status === 'ok') {
    return data.articles;
  } else {
    // This handles cases where NewsAPI (via your backend) returns a 2xx HTTP status
    // but the response body indicates an error (e.g., { status: "error", message: "..." })
    const apiErrorMessage = data.message || 'Error desconocido de la API (o backend) al obtener noticias.';
    console.error('La API (o el backend) devolvió un estado de error en los datos:', apiErrorMessage, data.code ? `Código: ${data.code}` : '');
    throw new Error(apiErrorMessage);
  }
};

export const checkNewsApiConnectionFetch = async (): Promise<boolean> => {
  try {
    await getNewsFetch(1, 1); // Intenta obtener un artículo para verificar la conexión
    return true;
  } catch (error) {
    // El error ya se loguea en getNewsFetch
    return false;
  }
};