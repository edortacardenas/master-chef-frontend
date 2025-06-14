// --- Constantes de Mensajes al Usuario ---
export const USER_MESSAGES = {
    // Input y validación de ingredientes
    INGREDIENT_INPUT_PLACEHOLDER: "Ej: Tomate, Cebolla, Arroz...",
    ADD_INGREDIENT_BUTTON: "Agregar",
    INGREDIENT_EMPTY_ERROR: 'El ingrediente no puede estar vacío.',
    INGREDIENT_DUPLICATE_ERROR: 'Este ingrediente ya está en la lista.',
    INGREDIENT_LENGTH_ERROR: 'El ingrediente debe tener al menos 2 caracteres.',
    INGREDIENTS_ADDED_TITLE: "Ingredientes Agregados:",
    DELETE_INGREDIENT_ARIA_LABEL: (ingredient: string) => `Eliminar ${ingredient}`,
    VALIDATION_ERROR_TITLE: "Error de Validación",

    // Generación de recetas
    GENERATE_RECIPE_BUTTON: "Generar Receta",
    GENERATING_RECIPE_BUTTON: "Generando...",
    MIN_INGREDIENTS_ERROR: "Necesitas al menos 4 ingredientes para generar una receta.",
    GENERATING_RECIPE_ERROR_TITLE: "Error al Generar Receta",
    UNEXPECTED_RESPONSE_GENERATING_ERROR: "Respuesta inesperada del servidor al generar la receta. No se encontró la receta.",
    HUGGING_FACE_QUOTA_EXCEEDED_ERROR: "¡Ups! Parece que has agotado tus créditos gratuitos para generar recetas este mes. Puedes esperar al próximo ciclo de facturación o considerar una mejora en tu plan para seguir creando sin límites. ¡Gracias por tu comprensión!",
    PAYMENT_REQUIRED_GENERIC_ERROR: (details: string) => `Error de Pago (402): ${details || "Se requiere una acción relacionada con el pago o la suscripción para continuar."}`,
    LOADING_RECIPE_MESSAGE: "Buscando la receta perfecta...",
    RECIPE_GENERATED_TITLE: "¡Receta Generada!",

    // Guardado de recetas
    SAVE_RECIPE_BUTTON: "Guardar Receta",
    SAVING_RECIPE_BUTTON: "Guardando...",
    RECIPE_SAVED_BUTTON: "¡Receta Guardada!",
    NO_RECIPE_TO_SAVE_ERROR: "No hay receta para guardar.",
    SAVING_RECIPE_ERROR_TITLE: "Error al Guardar",
    SAVE_RECIPE_SUCCESS_TITLE: "Éxito",
    SAVE_RECIPE_SUCCESS_DESCRIPTION: "La receta ha sido guardada correctamente en tu recetario.",
    ERROR_SAVING_RECIPE_DETAILS: (status: number, message?: string) => message || `Error ${status} al guardar la receta.`,
    RECIPE_DEFAULT_TITLE_ERROR: "No se pudo extraer un título válido para la receta. Asegúrate de que el formato del markdown sea correcto o que el título no esté vacío.",
    RECIPE_TITLE_LENGTH_ERROR: "El título de la receta debe tener entre 3 y 50 caracteres.",
    RECIPE_NO_INGREDIENTS_ERROR: "La receta debe incluir al menos un ingrediente.",
    RECIPE_NO_INSTRUCTIONS_ERROR: "La receta debe incluir instrucciones.",

    // Búsqueda de recetas
    SEARCH_RECIPES_TITLE: "Buscar Recetas",
    SEARCH_INPUT_PLACEHOLDER: "Escribe palabras del título (ej: apple pie, chicken soup)",
    SEARCH_BUTTON: "Buscar",
    SEARCHING_BUTTON: "Buscando...",
    NO_RECIPES_FOUND_SEARCH: "No se encontraron recetas con las palabras clave especificadas en el título.",
    SEARCH_ERROR_TITLE: "Error en la Búsqueda",
    VIEW_RECIPE_DETAILS_BUTTON: "Ver Detalles",
    CLOSE_RECIPE_DETAILS_BUTTON: "Cerrar Detalles",
    
    // Errores de Procesamiento/Parseo de Receta (usados antes de llamar a saveRecipe)
    PARSING_ERROR_TITLE_MISSING: "Error al procesar la receta: Título no encontrado.",
    PARSING_ERROR_TITLE_LENGTH: (longitud: number) => `El título debe tener entre 3 y 90 caracteres. Longitud actual: ${longitud}.`,
    PARSING_ERROR_INGREDIENTS_MISSING: "Error al procesar la receta: Sección de ingredientes no encontrada o vacía.",
    PARSING_ERROR_NO_INGREDIENTS_LISTED: "Error al procesar la receta: No se listaron ingredientes válidos.",
    PARSING_ERROR_INSTRUCTIONS_MISSING: "Error al procesar la receta: Sección de instrucciones no encontrada o vacía.",
    SAVE_RECIPE_NO_CONTENT_ERROR: "No hay contenido de receta para guardar.",

    // Generales
    DEFAULT_RECIPE_TITLE: "Receta sin Título",
    UNKNOWN_API_ERROR: "Ocurrió un error desconocido al conectar con el servidor. Intenta de nuevo más tarde.",
    UNEXPECTED_SERVER_ERROR: "Ocurrió un error inesperado en el servidor. Por favor, inténtalo de nuevo más tarde.",
};

// Interfaces for API responses and errors
interface ApiRecipeResponse {
    recipe: string;
}

interface ApiErrorDetail {
    path?: string;
    msg: string;
}
interface ApiErrorResponse {
    message?: string;
    errors?: ApiErrorDetail[];
    error?: string;
}

// Interface for the structured recipe data expected by the saveRecipe function
export interface RecipeInputData {
    title: string;
    ingredients: string[];
    instructions: string;
}
// Interface for searched recipes
interface SearchedRecipe {
    id: number; // or string, depending on your DB
    title: string;
    ingredients: string[];
    instructions: string;
    createdAt?: string; // Optional
    updatedAt?: string; // Optional
}

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

// --- Custom Error Class for API ---
export class ApiError extends Error {
    constructor(public status: number, public data: ApiErrorResponse, message?: string) {
        super(message || `API Error: ${status}`);
        this.name = 'ApiError';
        // Maintain correct stack trace for custom errors
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}

// --- Helper for API Calls ---
async function makeApiRequest<TResponse, TBody = Record<string, any>>(endpoint: string, method: 'POST' | 'GET', body?: TBody): Promise<TResponse> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });

    const responseData = await response.json();

    if (!response.ok) {
        throw new ApiError(response.status, responseData as ApiErrorResponse, responseData.message || responseData.error);
    }
    return responseData as TResponse;
}

// --- Helper to parse Markdown recipe ---
// Moved from master-chef.tsx as it's tightly coupled with the recipe structure
export const parseRecipeMarkdown = (markdown: string): { title: string; ingredients: string[]; instructions: string } => {
    let title = USER_MESSAGES.DEFAULT_RECIPE_TITLE;
    let ingredients: string[] = [];
    let instructions = "";

    // Regex to find titles like "## Title\nSome Title Text"
    const titleRegex = /^##\s*Title\s*?\r?\n([\s\S]*?)(?=\r?\n##\s*Ingredients|\r?\n##\s*Instructions|$)/im;
    const ingredientsRegex = /^##\s*Ingredients\s*?\r?\n([\s\S]*?)(?=\r?\n##\s*Instructions|$)/im;
    const instructionsRegex = /^##\s*Instructions\s*?\r?\n([\s\S]*?)$/im;

    const titleMatch = markdown.match(titleRegex);
    if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
    }

    const ingredientsMatch = markdown.match(ingredientsRegex);
    if (ingredientsMatch && ingredientsMatch[1]) {
        ingredients = ingredientsMatch[1]
            .trim()
            .split(/\r?\n/) // Split by new line
            .map(line => line.trim().replace(/^-\s*|^\*\s*/, '')) // Remove markdown list markers
            .filter(line => line.length > 0); // Remove empty lines
    }

    const instructionsMatch = markdown.match(instructionsRegex);
    if (instructionsMatch && instructionsMatch[1]) {
        instructions = instructionsMatch[1].trim();
    } else if (!ingredientsMatch && !titleMatch && markdown.trim()) {
        // If no sections are found, assume the whole markdown is instructions (or a fallback)
        instructions = markdown.trim();
    }

    return { title, ingredients, instructions };
};

// --- Helper to generate recipe ---
// Accepts ingredients list, returns recipe markdown or error
export const generateRecipe = async (ingredientsList: string[]): Promise<{ recipeMarkdown?: string; error?: string }> => {
    if (ingredientsList.length < 4) {
        return { error: USER_MESSAGES.MIN_INGREDIENTS_ERROR };
    }

    const ingredientsString = ingredientsList.join(', ');

    try {
        const data = await makeApiRequest<ApiRecipeResponse>('/api/hf-chat-completion', 'POST', { ingredientsString });
        if (data.recipe) {
            return { recipeMarkdown: data.recipe };
        } else {
            return { error: USER_MESSAGES.UNEXPECTED_RESPONSE_GENERATING_ERROR };
        }
    } catch (error) {
        console.error("Error al generar receta:", error);
        if (error instanceof ApiError) {
            if (error.status === 402) {
                const hfErrorText = error.data.message || error.data.error || "";
                const lowerHfErrorText = hfErrorText.toLowerCase();
                if (lowerHfErrorText.includes("exceeded your monthly included credits") ||
                    lowerHfErrorText.includes("exceeded your current quota") ||
                    lowerHfErrorText.includes("quota exceeded")) {
                    return { error: USER_MESSAGES.HUGGING_FACE_QUOTA_EXCEEDED_ERROR };
                } else {
                    return { error: USER_MESSAGES.PAYMENT_REQUIRED_GENERIC_ERROR(hfErrorText) };
                }
            } else {
                let detailedMessage = `Error ${error.status}: `;
                if (error.data.message) {
                    detailedMessage += error.data.message;
                } else if (error.data.errors && Array.isArray(error.data.errors)) {
                    detailedMessage += error.data.errors.map(e => `${e.path ? e.path + ': ' : ''}${e.msg}`).join('; ');
                } else if (error.data.error) {
                    detailedMessage += error.data.error;
                } else {
                    detailedMessage += USER_MESSAGES.UNEXPECTED_SERVER_ERROR;
                }
                return { error: detailedMessage };
            }
        } else if (error instanceof Error) {
            return { error: error.message };
        } else {
            return { error: USER_MESSAGES.UNKNOWN_API_ERROR };
        }
    }
};

// --- Helper to save recipe ---
// Accepts structured recipe data, returns success status or error
export const saveRecipe = async (recipeData: RecipeInputData): Promise<{ success: boolean; error?: string }> => {
    const { title, ingredients, instructions } = recipeData;

    // Validaciones específicas basadas en el modelo del backend
    // Estas validaciones se aplican a los datos ya parseados.
    if (title === USER_MESSAGES.DEFAULT_RECIPE_TITLE || title.length === 0) {
        // El título no debe ser el por defecto o estar vacío.
        return { success: false, error: USER_MESSAGES.RECIPE_DEFAULT_TITLE_ERROR };
    }
    if (title.length < 3 || title.length > 90) {
        return { success: false, error: USER_MESSAGES.RECIPE_TITLE_LENGTH_ERROR };
    }
    if (ingredients.length === 0) {
        return { success: false, error: USER_MESSAGES.RECIPE_NO_INGREDIENTS_ERROR };
    }
    if (instructions.length === 0) {
        return { success: false, error: USER_MESSAGES.RECIPE_NO_INSTRUCTIONS_ERROR };
    }
    
    try {
        // Assuming the save endpoint doesn't return a significant body on success
        await makeApiRequest<unknown>('/api/recipes', 'POST', { title, ingredients, instructions });
        return { success: true };
    } catch (error) {
        console.error("Error al guardar receta:", error);
        if (error instanceof ApiError) {
            return { success: false, error: USER_MESSAGES.ERROR_SAVING_RECIPE_DETAILS(error.status, error.data.message || error.data.error) };
        } else if (error instanceof Error) {
            return { success: false, error: error.message };
        } else {
            return { success: false, error: USER_MESSAGES.UNKNOWN_API_ERROR };
        }
    }
};

// --- Helper to search recipes ---
// Accepts search input, returns list of recipes or error
export const searchRecipes = async (searchTitleInput: string): Promise<{ recipes?: SearchedRecipe[]; error?: string }> => {
    if (!searchTitleInput.trim()) {
        return { recipes: [], error: "Por favor, ingresa algunas palabras del título para buscar." };
    }

    try {
        const searchTerm = searchTitleInput.trim();
        // Endpoint expects title as part of the path
        const data = await makeApiRequest<SearchedRecipe[]>(`/api/recipes/by-name/${encodeURIComponent(searchTerm)}`, 'GET');

        if (data && data.length > 0) {
            return { recipes: data };
        } else {
            // Return empty array and the specific "not found" message
            return { recipes: [], error: USER_MESSAGES.NO_RECIPES_FOUND_SEARCH };
        }
    } catch (error) {
        console.error("Error al buscar recetas:", error);
        if (error instanceof ApiError) {
            if (error.status === 404) {
                 // Handle 404 specifically to show the "not found" message
                 return { recipes: [], error: USER_MESSAGES.NO_RECIPES_FOUND_SEARCH };
            } else {
                return { recipes: [], error: error.data.message || error.data.error || USER_MESSAGES.UNKNOWN_API_ERROR };
            }
        } else if (error instanceof Error) {
            return { recipes: [], error: error.message };
        } else {
            return { recipes: [], error: USER_MESSAGES.UNKNOWN_API_ERROR };
        }
    }
};

// Export interfaces if they are needed elsewhere
export type { ApiRecipeResponse, ApiErrorDetail, ApiErrorResponse, SearchedRecipe };