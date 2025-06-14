import React, { useState } from 'react';

// Importaciones de shadcn/ui y lucide-react
// Asegúrate de que las rutas de importación coincidan con tu configuración de shadcn/ui y que Tailwind CSS esté configurado
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

// Importaciones de shadcn/ui y lucide-react
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, ChefHat, ListPlus, Trash2, Sparkles, Save, CheckCircle2, Search, XCircle, BookOpen } from 'lucide-react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Importación necesaria para remarkPlugins

// Importar helpers y tipos desde el nuevo archivo
import { generateRecipe, saveRecipe, searchRecipes, SearchedRecipe, USER_MESSAGES } from "@/lib/helpers.ts";

// Interfaz para la receta parseada
interface ParsedRecipeData {
    title: string;
    ingredients: string[];
    instructions: string;
}

// Función para parsear el markdown de la receta
const parseRecipeMarkdownToSave = (markdown: string): ParsedRecipeData | { error: string } => {
    const titleRegex = /## Title\s*\n([\s\S]*?)(?=\n## Ingredients|$)/;
    const ingredientsRegex = /## Ingredients\s*\n([\s\S]*?)(?=\n## Instructions|$)/;
    const instructionsRegex = /## Instructions\s*\n([\s\S]*)/;

    const titleMatch = markdown.match(titleRegex);
    const title = titleMatch ? titleMatch[1].trim() : '';
    if (!title) return { error: USER_MESSAGES.PARSING_ERROR_TITLE_MISSING || "Título no encontrado." };
    if (title.length < 3 || title.length > 50) {
        return { error: (USER_MESSAGES.PARSING_ERROR_TITLE_LENGTH && USER_MESSAGES.PARSING_ERROR_TITLE_LENGTH(title.length)) || `El título debe tener entre 3 y 50 caracteres. Actual: ${title.length}.` };
    }

    const ingredientsMatch = markdown.match(ingredientsRegex);
    const ingredientsText = ingredientsMatch ? ingredientsMatch[1].trim() : '';
    if (!ingredientsText) return { error: USER_MESSAGES.PARSING_ERROR_INGREDIENTS_MISSING || "Sección de ingredientes no encontrada." };
    const ingredients = ingredientsText.split('\n')
        .map(line => line.replace(/^- /, '').trim())
        .filter(ingredient => ingredient.length > 0);
    if (ingredients.length === 0) return { error: USER_MESSAGES.PARSING_ERROR_NO_INGREDIENTS_LISTED || "No se listaron ingredientes." };

    const instructionsMatch = markdown.match(instructionsRegex);
    const instructions = instructionsMatch ? instructionsMatch[1].trim() : '';
    if (!instructions) return { error: USER_MESSAGES.PARSING_ERROR_INSTRUCTIONS_MISSING || "Sección de instrucciones no encontrada." };

    return { title, ingredients, instructions };
};

const MasterChef = () => {
    const [currentIngredient, setCurrentIngredient] = useState('');
    const [ingredientsList, setIngredientsList] = useState<string[]>([]);
    const [recipeMarkdown, setRecipeMarkdown] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [inputError, setInputError] = useState('');
    // Estado para guardar receta
    const [isSavingRecipe, setIsSavingRecipe] = useState(false);
    const [saveRecipeError, setSaveRecipeError] = useState<string | null>(null);
    const [recipeSuccessfullySaved, setRecipeSuccessfullySaved] = useState(false);
    // Estado para búsqueda de recetas
    const [searchTitleInput, setSearchTitleInput] = useState(''); // Cambiado de searchIngredientsInput
    const [searchedRecipes, setSearchedRecipes] = useState<SearchedRecipe[]>([]);
    const [isSearchingRecipes, setIsSearchingRecipes] = useState(false);
    const [searchRecipesError, setSearchRecipesError] = useState<string | null>(null);
    const [selectedSearchedRecipe, setSelectedSearchedRecipe] = useState<SearchedRecipe | null>(null);


    const handleAddIngredient = () => {
        setInputError('');
        const trimmedIngredient = currentIngredient.trim();

        if (!trimmedIngredient) {
            setInputError(USER_MESSAGES.INGREDIENT_EMPTY_ERROR);
            return;
        }

        const isDuplicate = ingredientsList.some(
            (ing: string) => ing.toLowerCase() === trimmedIngredient.toLowerCase()
        );
        if (isDuplicate) {
            setInputError(USER_MESSAGES.INGREDIENT_DUPLICATE_ERROR);
            return;
        }

        // Validación adicional (ejemplo: longitud mínima)
        if (trimmedIngredient.length < 2) {
            setInputError(USER_MESSAGES.INGREDIENT_LENGTH_ERROR);
            return;
        }

        setIngredientsList([...ingredientsList, trimmedIngredient]);
        setCurrentIngredient('');
    };

    const handleDeleteIngredient = (ingredientToDelete: string) => {
        setIngredientsList(ingredientsList.filter((ing: string) => ing !== ingredientToDelete));
        // Si se elimina un ingrediente y la receta ya estaba generada,
        // podría ser buena idea limpiar la receta para evitar confusiones.
        if (recipeMarkdown) {
            setRecipeMarkdown('');
        }
    };

    // Refactored to use the helper function
    const handleGenerateRecipe = async () => {
        setIsLoading(true);
        setApiError(null);
        setRecipeMarkdown('');
        setRecipeSuccessfullySaved(false); // Reset save status when generating new recipe
        setSaveRecipeError(null);

        const result = await generateRecipe(ingredientsList);

        if (result.error) {
            setApiError(result.error);
        } else if (result.recipeMarkdown) {
            setRecipeMarkdown(result.recipeMarkdown);
        }

        setIsLoading(false);
    };

    // Refactored to use the helper function
    const handleSaveRecipe = async () => {
        setIsSavingRecipe(true);
        setSaveRecipeError(null);
        setRecipeSuccessfullySaved(false);

        if (!recipeMarkdown) {
            setSaveRecipeError(USER_MESSAGES.SAVE_RECIPE_NO_CONTENT_ERROR || "No hay contenido de receta para guardar.");
            setIsSavingRecipe(false);
            return;
        }

        const parsedRecipeResult = parseRecipeMarkdownToSave(recipeMarkdown);

        if ('error' in parsedRecipeResult) {
            setSaveRecipeError(parsedRecipeResult.error);
            setIsSavingRecipe(false);
            return;
        }

        // Se asume que saveRecipe en helpers.ts ahora espera un objeto ParsedRecipeData
        const saveResult = await saveRecipe(parsedRecipeResult);

        if (saveResult.error) {
            setSaveRecipeError(saveResult.error);
        } else if (saveResult.success) {
            setRecipeSuccessfullySaved(true);
        }
        setIsSavingRecipe(false);
    };
    // Refactored to use the helper function
    const handleSearchRecipes = async () => {
        setIsSearchingRecipes(true);
        setSearchRecipesError(null);
        setSearchedRecipes([]);
        setSelectedSearchedRecipe(null);

        const result = await searchRecipes(searchTitleInput);

        if (result.error) {
            setSearchRecipesError(result.error);
        }
        setSearchedRecipes(result.recipes || []); // Always set recipes, even if empty
        setIsSearchingRecipes(false);
    };

    const handleSelectSearchedRecipe = (recipe: SearchedRecipe) => {
        setSelectedSearchedRecipe(recipe);
    };
    const handleCloseSearchedRecipe = () => {
        setSelectedSearchedRecipe(null);
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-red-900 to-amber-800 p-4 sm:p-8 flex justify-center items-center">
            <div className="w-full max-w-2xl">
                <Card className="shadow-xl bg-white/80 dark:bg-slate-900/80"> {/* Cambiado bg-transparent a bg-white/80 y añadido soporte para modo oscuro */}
                <CardHeader className="shadow-xl bg-transparent p-6 rounded-t-lg border-b border-slate-200 text-center sm:text-left"> {/* Centrado en móvil, izquierda en sm+ */}
                    <div className="flex flex-col items-center sm:flex-row sm:items-center sm:space-x-3 relative">
                        <ChefHat size={32} className="text-green-600 mb-2 sm:mb-0" />
                        <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-800">Asistente Culinario IA</CardTitle>
                    </div>
                    <CardDescription className="text-slate-600 pt-1">
                        Ingresa tus ingredientes y descubre una nueva receta.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    {/* Sección de Ingreso de Ingredientes */}
                    <div className="space-y-2">
                        <label htmlFor="ingredient-input" className="block text-sm font-medium text-gray-700">
                            Añadir Ingrediente:
                        </label>
                        <div className="flex space-x-2">
                            <Input
                                id="ingredient-input"
                                type="text"
                                value={currentIngredient}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentIngredient(e.target.value)}
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleAddIngredient()}
                                placeholder={USER_MESSAGES.INGREDIENT_INPUT_PLACEHOLDER}
                                className="flex-grow"
                                aria-label="Nuevo ingrediente"
                            />
                            <Button onClick={handleAddIngredient} disabled={isLoading} aria-label="Agregar ingrediente">
                                <ListPlus className="mr-2 h-4 w-4" /> {USER_MESSAGES.ADD_INGREDIENT_BUTTON}
                            </Button>
                        </div>
                        {inputError && (
                            <Alert variant="destructive" className="mt-2 relative">
                                <AlertCircle className="h-4 w-4" />
                                <div className="flex-1"> {/* Wrap content */}
                                    <AlertTitle>{USER_MESSAGES.VALIDATION_ERROR_TITLE}</AlertTitle>
                                    <AlertDescription>{inputError}</AlertDescription>
                                </div>
                                {/* Close button */}
                                <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => setInputError('')} aria-label="Cerrar alerta de error de validación">
                                    <XCircle className="h-5 w-5" />
                                </Button>
                            </Alert>
                        )}
                    </div>

                    {/* Lista de Ingredientes */}
                    {ingredientsList.length > 0 ? (
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">{USER_MESSAGES.INGREDIENTS_ADDED_TITLE}</h3>
                            <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                {ingredientsList.map((ingredient) => ( 
                                    <li
                                        key={ingredient} // Cambiado de index a ingredient para una key más estable
                                        className="flex items-center justify-between p-3 bg-transparent rounded-md shadow-sm hover:bg-red-200 transition-colors"
                                    >
                                        <span className="text-gray-700">{ingredient}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteIngredient(ingredient)}
                                            disabled={isLoading}
                                            aria-label={USER_MESSAGES.DELETE_INGREDIENT_ARIA_LABEL(ingredient)}
                                        >
                                            <Trash2 className="h-5 w-5 text-red-500 hover:text-red-700" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ): (
                        <div className="bg-transparent text-center text-gray-500 italic p-4 rounded-md">
                            <p>Aún no has agregado ingredientes. ¡Empieza a crear tu lista!</p>
                        </div>
                    )}

                    {/* Botón Generar Receta y Errores API */}
                    <div className="space-y-4">
                        {ingredientsList.length >= 4 && (
                            <Button
                                onClick={handleGenerateRecipe}
                                disabled={isLoading}
                                className="w-full text-lg py-3 bg-green-600 hover:bg-green-700"
                                size="lg"
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <Sparkles className="mr-2 h-5 w-5" />
                                )}
                                {isLoading ? USER_MESSAGES.GENERATING_RECIPE_BUTTON : USER_MESSAGES.GENERATE_RECIPE_BUTTON}
                            </Button>
                        )}
                        {apiError && (
                            <Alert variant="destructive" className="relative">
                                <AlertCircle className="h-4 w-4" />
                                <div className="flex-1"> {/* Wrap content */}
                                    <AlertTitle>{USER_MESSAGES.GENERATING_RECIPE_ERROR_TITLE}</AlertTitle>
                                    <AlertDescription>{apiError}</AlertDescription>
                                </div>
                                {/* Close button */}
                                <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => setApiError(null)} aria-label="Cerrar alerta de error de generación de receta">
                                    <XCircle className="h-5 w-5" />
                                </Button>
                            </Alert>
                        )}
                    </div>

                    {/* Visualización de la Receta */}
                    {isLoading && !recipeMarkdown && (
                         <div className="flex justify-center items-center p-8">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="ml-4 text-lg text-gray-600">{USER_MESSAGES.LOADING_RECIPE_MESSAGE}</p>
                        </div>
                    )}

                    {recipeMarkdown && !isLoading && (
                        <Card className="mt-6 border-green-500 border-2 shadow-lg">
                            <CardHeader className="bg-green-50">
                                <CardTitle className="text-2xl text-green-700">{USER_MESSAGES.RECIPE_GENERATED_TITLE}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 prose max-w-none prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-4 prose-h2:mb-2 prose-li:my-1">
                                {/* 
                                    El componente ReactMarkdown renderizará el contenido Markdown.
                                    prose-*: Clases de Tailwind Typography para estilizar el Markdown.
                                    Asegúrate de tener @tailwindcss/typography instalado y configurado si quieres usar estas clases.
                                    Si no, el Markdown se renderizará sin estilos específicos de 'prose'.
                                */}
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {recipeMarkdown}
                                </ReactMarkdown>
                            </CardContent>
                            <CardFooter className="flex flex-col items-stretch gap-4 p-6 border-t">
                                <Button
                                    onClick={handleSaveRecipe}
                                    disabled={isSavingRecipe || recipeSuccessfullySaved}
                                    className={`w-full text-md py-2.5 ${recipeSuccessfullySaved ? 'bg-green-500 hover:bg-green-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                >
                                    {isSavingRecipe ? (
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    ) : recipeSuccessfullySaved ? (
                                        <CheckCircle2 className="mr-2 h-5 w-5" />
                                    ) : (
                                        <Save className="mr-2 h-5 w-5" />
                                    )}
                                    {isSavingRecipe ? USER_MESSAGES.SAVING_RECIPE_BUTTON : recipeSuccessfullySaved ? USER_MESSAGES.RECIPE_SAVED_BUTTON : USER_MESSAGES.SAVE_RECIPE_BUTTON}
                                </Button>
                                {saveRecipeError && (
                                    <Alert variant="destructive" className="mt-2 relative">
                                        <AlertCircle className="h-4 w-4" />
                                        <div className="flex-1"> {/* Wrap content */}
                                            <AlertTitle>{USER_MESSAGES.SAVING_RECIPE_ERROR_TITLE}</AlertTitle>
                                            <AlertDescription>{saveRecipeError}</AlertDescription>
                                        </div>
                                        {/* Close button */}
                                        <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => setSaveRecipeError(null)} aria-label="Cerrar alerta de error al guardar receta">
                                            <XCircle className="h-5 w-5" />
                                        </Button>
                                    </Alert>
                                )}
                                {recipeSuccessfullySaved && !saveRecipeError && (
                                    <Alert variant="default" className="mt-2 bg-green-50 border-green-300 text-green-700">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <AlertTitle>{USER_MESSAGES.SAVE_RECIPE_SUCCESS_TITLE}</AlertTitle>
                                        <AlertDescription>{USER_MESSAGES.SAVE_RECIPE_SUCCESS_DESCRIPTION}</AlertDescription>
                                    </Alert>
                                )}
                            </CardFooter>
                        </Card>
                    )}
                </CardContent>

                {/* Separador visual y comienzo de la sección de búsqueda integrada */}
                <hr className="mx-6 border-slate-300" /> 

                <CardContent className="p-6 space-y-6">
                    {/* Título de la sección de búsqueda */}
                    <div className="flex items-center space-x-3">
                        <Search size={24} className="text-blue-600" />
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">{USER_MESSAGES.SEARCH_RECIPES_TITLE}</h2>
                    </div>
                    {/* Contenido de la búsqueda: input, botón, resultados, etc. */}
                    <div className="flex space-x-2">
                        <Input
                            type="text"
                            value={searchTitleInput} // Cambiado
                            onChange={(e) => setSearchTitleInput(e.target.value)} // Cambiado
                            placeholder={USER_MESSAGES.SEARCH_INPUT_PLACEHOLDER}
                            className="flex-grow"
                            aria-label="Palabras del título para buscar recetas" // Cambiado
                            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearchRecipes()}
                        />
                        <Button onClick={handleSearchRecipes} disabled={isSearchingRecipes}>
                            {isSearchingRecipes ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="mr-2 h-4 w-4" />
                            )}
                            {isSearchingRecipes ? USER_MESSAGES.SEARCHING_BUTTON : USER_MESSAGES.SEARCH_BUTTON}
                        </Button>
                    </div>

                    {searchRecipesError && !isSearchingRecipes && (
                        <Alert variant="destructive" className="relative">
                            <AlertCircle className="h-4 w-4" />
                            <div className="flex-1"> {/* Wrap content */}
                                <AlertTitle>{USER_MESSAGES.SEARCH_ERROR_TITLE}</AlertTitle>
                                <AlertDescription>{searchRecipesError}</AlertDescription>
                            </div>
                            {/* Close button */}
                            <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => setSearchRecipesError(null)} aria-label="Cerrar alerta de error de búsqueda">
                                <XCircle className="h-5 w-5" />
                            </Button>
                        </Alert>
                    )}

                    {isSearchingRecipes && (
                        <div className="flex justify-center items-center p-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-3 text-gray-600">{USER_MESSAGES.SEARCHING_BUTTON}</p>
                        </div>
                    )}

                    {!isSearchingRecipes && searchedRecipes.length > 0 && !selectedSearchedRecipe && (
                        <div className="space-y-3">
                            <h4 className="text-md font-semibold border-b pb-2">Recetas Encontradas:</h4>
                            <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                {searchedRecipes.map((recipe) => (
                                    <li
                                        key={recipe.id}
                                        // Added border, slightly adjusted padding/bg
                                        className="p-3 bg-red-200 rounded-md border border-gray-200 shadow-sm hover:bg-red-100 transition-colors flex justify-between items-center"
                                    >
                                        <span className="text-gray-800 font-medium">{recipe.title}</span>
                                        <Button variant="ghost" size="sm" onClick={() => handleSelectSearchedRecipe(recipe)}>
                                            <BookOpen className="mr-2 h-4 w-4" /> {USER_MESSAGES.VIEW_RECIPE_DETAILS_BUTTON}
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {selectedSearchedRecipe && (
                        <Card className="mt-4 border-blue-500 border shadow-lg">
                            <CardHeader className="bg-blue-50 flex flex-row justify-between items-center">
                                <CardTitle className="text-xl text-blue-700">{selectedSearchedRecipe.title}</CardTitle>
                                <Button variant="ghost" size="icon" onClick={handleCloseSearchedRecipe} aria-label="Cerrar detalles de receta">
                                    <XCircle className="h-6 w-6 text-blue-600 hover:text-blue-800" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                <h5 className="font-semibold text-gray-700">Ingredientes:</h5>
                                <ul className="list-disc list-inside pl-4 text-sm text-gray-600">
                                    {selectedSearchedRecipe.ingredients.map((ing, idx) => <li key={idx}>{ing}</li>)}
                                </ul>
                                <h5 className="font-semibold text-gray-700 pt-2">Instrucciones:</h5>
                                <div className="prose prose-sm max-w-none text-gray-600">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedSearchedRecipe.instructions}</ReactMarkdown>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default MasterChef;