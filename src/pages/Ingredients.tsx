import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PackageSearch, Plus, Filter, FileSpreadsheet } from 'lucide-react';
import { ExcelImporter } from '../components/ExcelImporter';

interface Ingredient {
    id: string;
    name: string;
    unit_type: string;
    stock_quantity: number;
    avg_cost_per_unit: number;
}

export const Ingredients = () => {
    const { user } = useAuth();
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [showImporter, setShowImporter] = useState(false);

    useEffect(() => {
        if (user) {
            fetchIngredients();
        }
    }, [user]);

    const fetchIngredients = async () => {
        setLoading(true);
        const { data } = await supabase.from('ingredients').select('*').order('name');
        if (data) setIngredients(data);
        setLoading(false);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                        <PackageSearch className="w-6 h-6 mr-3 text-indigo-500" />
                        Insumos e Preparos Base
                    </h1>
                    <p className="text-slate-500 mt-1">Gerencie a matéria-prima do seu restaurante e acompanhe o Custo Médio.</p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                    <button
                        onClick={() => setShowImporter(!showImporter)}
                        className="flex items-center px-4 py-2 bg-green-50 text-green-700 font-medium rounded-lg hover:bg-green-100 transition-colors border border-green-200 shadow-sm"
                    >
                        <FileSpreadsheet className="w-5 h-5 mr-2" />
                        {showImporter ? 'Ocultar Importador' : 'Importar Excel'}
                    </button>
                    <button className="flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                        <Plus className="w-5 h-5 mr-2" />
                        Novo Insumo
                    </button>
                </div>
            </div>

            {showImporter && (
                <ExcelImporter onComplete={() => {
                    fetchIngredients();
                }} />
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div className="relative w-72">
                        <Filter className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar insumos..."
                            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <span className="text-sm font-medium text-slate-500">{ingredients.length} Itens cadastrados</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                <th className="p-4 font-bold">Nome do Insumo</th>
                                <th className="p-4 font-bold">Unidade (Medida)</th>
                                <th className="p-4 font-bold text-right">Quantidade em Estoque</th>
                                <th className="p-4 font-bold text-right">Custo Médio Unitário</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500 animate-pulse">
                                        Carregando estoque...
                                    </td>
                                </tr>
                            ) : ingredients.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">
                                        <PackageSearch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        Nenhum insumo encontrado. Importe sua planilha para começar.
                                    </td>
                                </tr>
                            ) : (
                                ingredients.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-medium text-slate-900">{item.name}</td>
                                        <td className="p-4 text-slate-600">
                                            <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold border border-slate-200">
                                                {item.unit_type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className={`font-medium ${item.stock_quantity <= 0 ? 'text-red-600' : 'text-slate-900'}`}>
                                                {item.stock_quantity}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-semibold text-slate-900">
                                            R$ {item.avg_cost_per_unit.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
