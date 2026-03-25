import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Edit, UtensilsCrossed, ArrowRight } from 'lucide-react';

interface Ingredient {
    id: string;
    name: string;
    unit_type: string;
    avg_cost_per_unit: number;
}

interface Recipe {
    id: string;
    product_name: string;
    sale_price: number;
    category: string;
}

interface RecipeIngredient {
    id: string;
    ingredient_id: string;
    quantity_needed: number;
    ingredients: Ingredient; // joined data
}

export const Recipes = () => {
    const { user } = useAuth();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [recipeIngredients, setRecipeIngredients] = useState<Record<string, RecipeIngredient[]>>({});

    const [loading, setLoading] = useState(true);

    // Modals / Form states
    const [isAddingRecipe, setIsAddingRecipe] = useState(false);
    const [newRecipeName, setNewRecipeName] = useState('');
    const [newRecipePrice, setNewRecipePrice] = useState(0);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);

        // In a real multi-tenant we filter by the user's restaurant_id
        // But since RLS is enabled, Supabase does it automatically if configured well
        // Or we fetch the user's profile to get restaurant_id.
        // For MVP frontend, let's just fetch all (RLS will handle or we just fetch indiscriminately if dev mode)

        // Fetch Recipes
        const { data: recipesData } = await supabase.from('recipes').select('*');
        if (recipesData) setRecipes(recipesData);

        // Fetch Ingredients
        const { data: ingredientsData } = await supabase.from('ingredients').select('*');
        if (ingredientsData) setIngredients(ingredientsData);

        // Fetch Recipe Ingredients with join
        const { data: recipeIngData } = await supabase
            .from('recipe_ingredients')
            .select(`
        id, recipe_id, ingredient_id, quantity_needed,
        ingredients ( id, name, unit_type, avg_cost_per_unit )
      `);

        if (recipeIngData) {
            const grouped: Record<string, RecipeIngredient[]> = {};
            recipeIngData.forEach((item: any) => {
                if (!grouped[item.recipe_id]) grouped[item.recipe_id] = [];
                grouped[item.recipe_id].push(item);
            });
            setRecipeIngredients(grouped);
        }

        setLoading(false);
    };

    const handleCreateRecipe = async () => {
        if (!newRecipeName) return;

        // We need restaurant_id. Let's get it from the user's profile
        const { data: profileData } = await supabase.from('profiles').select('restaurant_id').eq('id', user?.id).single();
        const restaurantId = profileData?.restaurant_id;

        if (!restaurantId) {
            alert("Seu usuário não está vinculado a um restaurante. Em ambiente de teste, verifique o Supabase.");
            return;
        }

        const { data, error } = await supabase.from('recipes').insert([{
            restaurant_id: restaurantId,
            product_name: newRecipeName,
            sale_price: newRecipePrice,
            category: 'Lanche'
        }]).select();

        if (!error && data) {
            setRecipes([...recipes, data[0]]);
            setIsAddingRecipe(false);
            setNewRecipeName('');
            setNewRecipePrice(0);
        }
    };

    const calculateTotalCost = (recipeId: string) => {
        const items = recipeIngredients[recipeId] || [];
        return items.reduce((total, item) => {
            const costPerUnit = item.ingredients.avg_cost_per_unit || 0;
            return total + (costPerUnit * item.quantity_needed);
        }, 0);
    };

    if (loading) {
        return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-slate-200 rounded w-3/4"></div></div></div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                        <UtensilsCrossed className="w-6 h-6 mr-3 text-indigo-500" />
                        Fichas Técnicas
                    </h1>
                    <p className="text-slate-500 mt-1">Gerencie suas receitas, fator de conversão e precificação (CMV).</p>
                </div>
                <button
                    onClick={() => setIsAddingRecipe(true)}
                    className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Nova Ficha
                </button>
            </div>

            {isAddingRecipe && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Criar Nova Ficha Técnica</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Produto</label>
                            <input type="text" value={newRecipeName} onChange={e => setNewRecipeName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: Combo Simples" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Preço de Venda (R$)</label>
                            <input type="number" value={newRecipePrice} onChange={e => setNewRecipePrice(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: 25.90" />
                        </div>
                    </div>
                    <div className="mt-4 flex space-x-3">
                        <button onClick={handleCreateRecipe} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">Salvar Ficha</button>
                        <button onClick={() => setIsAddingRecipe(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium">Cancelar</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {recipes.map(recipe => {
                    const cost = calculateTotalCost(recipe.id);
                    const cmvPercentage = recipe.sale_price > 0 ? ((cost / recipe.sale_price) * 100).toFixed(1) : '0.0';
                    const items = recipeIngredients[recipe.id] || [];

                    return (
                        <div key={recipe.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{recipe.product_name}</h3>
                                    <div className="flex space-x-4 mt-1 text-sm">
                                        <span className="text-slate-600">Venda: <strong className="text-slate-900">R$ {recipe.sale_price.toFixed(2)}</strong></span>
                                        <span className="text-slate-600">Custo: <strong className="text-red-600">R$ {cost.toFixed(2)}</strong></span>
                                    </div>
                                </div>
                                <div className={`px-3 py-1.5 rounded-lg font-bold text-sm ${Number(cmvPercentage) < 30 ? 'bg-green-100 text-green-700' : Number(cmvPercentage) < 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                    CMV: {cmvPercentage}%
                                </div>
                            </div>

                            <div className="p-5 flex-1">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Composição (Insumos)</h4>
                                {items.length === 0 ? (
                                    <p className="text-sm text-slate-500 italic">Vazio. Adicione insumos para compor o custo.</p>
                                ) : (
                                    <ul className="space-y-3">
                                        {items.map(ing => (
                                            <li key={ing.id} className="flex justify-between items-center text-sm">
                                                <span className="font-medium text-slate-700">{ing.ingredients.name}</span>
                                                <div className="text-slate-500 flex items-center space-x-4">
                                                    <span>{ing.quantity_needed} {ing.ingredients.unit_type}</span>
                                                    <ArrowRight className="w-4 h-4 text-slate-300" />
                                                    <span className="font-semibold text-slate-700">R$ {(ing.ingredients.avg_cost_per_unit * ing.quantity_needed).toFixed(2)}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                <button className="mt-6 text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center">
                                    <Edit className="w-4 h-4 mr-1" />
                                    Editar Composição
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
