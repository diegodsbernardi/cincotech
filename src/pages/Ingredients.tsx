import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PackageSearch, Plus, Filter, FileSpreadsheet, Trash2, X, Pencil, PlusCircle } from 'lucide-react';
import { ExcelImporter } from '../components/ExcelImporter';
import type { Ingredient, IngredientTipo } from '../lib/types';

const UNIT_OPTIONS = ['kg', 'g', 'l', 'ml', 'un', 'cx', 'pct', 'fardo'];

const TIPO_OPTIONS: { value: IngredientTipo; label: string; desc: string }[] = [
    { value: 'insumo_base',   label: 'Insumo Base',   desc: 'Vem da NF-e, entra em Preparos' },
    { value: 'insumo_direto', label: 'Insumo Direto', desc: 'Vai direto para a Ficha Final' },
];

const TIPO_BADGE: Record<IngredientTipo, string> = {
    insumo_base:   'bg-slate-100 text-slate-600',
    insumo_direto: 'bg-blue-100 text-blue-700',
};

export const Ingredients = () => {
    const { user, restauranteId } = useAuth();
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [showImporter, setShowImporter] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState('Todos');
    const [searchQuery, setSearchQuery] = useState('');

    // New ingredient modal
    const [showNewModal, setShowNewModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newUnit, setNewUnit] = useState('kg');
    const [newTipo, setNewTipo] = useState<IngredientTipo>('insumo_base');
    const [newCost, setNewCost] = useState<number | ''>('');
    const [newStock, setNewStock] = useState<number | ''>(0);
    const [savingNew, setSavingNew] = useState(false);

    // Edit modal
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
    const [editName, setEditName] = useState('');
    const [editUnit, setEditUnit] = useState('kg');
    const [editTipo, setEditTipo] = useState<IngredientTipo>('insumo_base');
    const [editCost, setEditCost] = useState<number | ''>('');
    const [editStock, setEditStock] = useState<number | ''>('');
    const [savingEdit, setSavingEdit] = useState(false);

    // Stock entry modal
    const [stockEntryIngredient, setStockEntryIngredient] = useState<Ingredient | null>(null);
    const [stockEntryQty, setStockEntryQty] = useState<number | ''>('');
    const [stockEntryCost, setStockEntryCost] = useState<number | ''>('');
    const [savingStockEntry, setSavingStockEntry] = useState(false);

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

    const handleCreateIngredient = async () => {
        if (!newName.trim() || !restauranteId) return;
        setSavingNew(true);

        const { data, error } = await supabase.from('ingredients').insert([{
            restaurant_id: restauranteId,
            name: newName.trim(),
            unit_type: newUnit,
            tipo: newTipo,
            avg_cost_per_unit: Number(newCost) || 0,
            stock_quantity: Number(newStock) || 0,
            use_in_recipes: newTipo === 'insumo_base',
        }]).select().single();

        if (!error && data) {
            setIngredients([...ingredients, data].sort((a, b) => a.name.localeCompare(b.name)));
            setShowNewModal(false);
            setNewName(''); setNewUnit('kg'); setNewTipo('insumo_base'); setNewCost(''); setNewStock(0);
            toast.success('Insumo criado com sucesso!');
        } else {
            toast.error('Erro ao criar insumo: ' + error?.message);
        }
        setSavingNew(false);
    };

    const handleEditIngredient = async () => {
        if (!editingIngredient || !editName.trim()) return;
        setSavingEdit(true);
        const { error } = await supabase.from('ingredients').update({
            name: editName.trim(),
            unit_type: editUnit,
            tipo: editTipo,
            avg_cost_per_unit: Number(editCost) || 0,
            stock_quantity: Number(editStock) || 0,
            use_in_recipes: editTipo === 'insumo_base',
        }).eq('id', editingIngredient.id);

        if (!error) {
            setIngredients(ingredients.map(i =>
                i.id === editingIngredient.id
                    ? { ...i, name: editName.trim(), unit_type: editUnit, tipo: editTipo, avg_cost_per_unit: Number(editCost) || 0, stock_quantity: Number(editStock) || 0 }
                    : i
            ));
            setEditingIngredient(null);
            toast.success('Insumo atualizado com sucesso!');
        } else {
            toast.error('Erro ao editar: ' + error.message);
        }
        setSavingEdit(false);
    };

    const handleStockEntry = async () => {
        if (!stockEntryIngredient || stockEntryQty === '' || Number(stockEntryQty) <= 0) return;
        setSavingStockEntry(true);

        const currentQty = stockEntryIngredient.stock_quantity;
        const currentCost = stockEntryIngredient.avg_cost_per_unit;
        const addedQty = Number(stockEntryQty);
        const newQty = currentQty + addedQty;

        // Custo médio ponderado: só recalcula se preço de compra foi informado
        const updates: { stock_quantity: number; avg_cost_per_unit?: number } = { stock_quantity: newQty };
        let newAvgCost = currentCost;
        if (stockEntryCost !== '' && Number(stockEntryCost) > 0) {
            newAvgCost = ((currentQty * currentCost) + (addedQty * Number(stockEntryCost))) / newQty;
            updates.avg_cost_per_unit = newAvgCost;
        }

        const { error } = await supabase.from('ingredients').update(updates).eq('id', stockEntryIngredient.id);

        if (!error) {
            setIngredients(ingredients.map(i =>
                i.id === stockEntryIngredient.id
                    ? { ...i, stock_quantity: newQty, avg_cost_per_unit: newAvgCost }
                    : i
            ));
            setStockEntryIngredient(null);
            setStockEntryQty('');
            setStockEntryCost('');
            toast.success('Entrada de estoque registrada!');
        } else {
            toast.error('Erro ao registrar entrada: ' + error.message);
        }
        setSavingStockEntry(false);
    };

    const handleDeleteIngredient = async (id: string) => {
        if (!confirm('Deseja realmente excluir este insumo?')) return;
        const { error } = await supabase.from('ingredients').delete().eq('id', id);
        if (!error) {
            setIngredients(ingredients.filter(i => i.id !== id));
            setSelectedIds(selectedIds.filter(selId => selId !== id));
            toast.success('Insumo excluído.');
        } else {
            toast.error('Erro ao excluir: ' + error.message);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Deseja realmente excluir ${selectedIds.length} insumo(s)?`)) return;
        setLoading(true);
        const { error } = await supabase.from('ingredients').delete().in('id', selectedIds);
        if (!error) {
            setIngredients(ingredients.filter(i => !selectedIds.includes(i.id)));
            setSelectedIds([]);
            toast.success(`${selectedIds.length} insumo(s) excluído(s).`);
        } else {
            toast.error('Erro ao excluir: ' + error.message);
        }
        setLoading(false);
    };

    const filteredIngredients = ingredients.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'Todos' ||
            (activeTab === 'Insumo Base' && item.tipo === 'insumo_base') ||
            (activeTab === 'Insumo Direto' && item.tipo === 'insumo_direto');
        return matchesSearch && matchesTab;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                        <PackageSearch className="w-6 h-6 mr-3 text-indigo-500" />
                        Insumos e Receitas
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
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors border border-red-200 shadow-sm"
                        >
                            <Trash2 className="w-5 h-5 mr-2" />
                            Excluir ({selectedIds.length})
                        </button>
                    )}
                    <button onClick={() => setShowNewModal(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
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
                <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex space-x-1 p-1 bg-slate-200/50 rounded-xl">
                            {['Todos', 'Insumo Base', 'Insumo Direto'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab
                                            ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center space-x-4 w-full sm:w-auto">
                            <div className="relative w-full sm:w-72">
                                <Filter className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar insumos..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                                />
                            </div>
                            <span className="text-sm font-medium text-slate-500 whitespace-nowrap">
                                {filteredIngredients.length} Itens
                            </span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                <th className="p-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        checked={ingredients.length > 0 && selectedIds.length === ingredients.length}
                                        onChange={(e) => setSelectedIds(e.target.checked ? ingredients.map(i => i.id) : [])}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                </th>
                                <th className="p-4 font-bold">Nome do Insumo</th>
                                <th className="p-4 font-bold">Categoria</th>
                                <th className="p-4 font-bold">Unidade (Medida)</th>
                                <th className="p-4 font-bold text-right">Quantidade em Estoque</th>
                                <th className="p-4 font-bold text-right">Custo Médio Unitário</th>
                                <th className="p-4 font-bold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500 animate-pulse">
                                        Carregando estoque...
                                    </td>
                                </tr>
                            ) : filteredIngredients.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">
                                        <PackageSearch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        Nenhum insumo encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredIngredients.map((item) => (
                                    <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(item.id) ? 'bg-indigo-50/50' : ''}`}>
                                        <td className="p-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(item.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedIds([...selectedIds, item.id]);
                                                    else setSelectedIds(selectedIds.filter(id => id !== item.id));
                                                }}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <span className="font-medium text-slate-900">{item.name}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${TIPO_BADGE[item.tipo] ?? 'bg-slate-100 text-slate-500'}`}>
                                                {TIPO_OPTIONS.find(t => t.value === item.tipo)?.label ?? item.tipo}
                                            </span>
                                        </td>
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
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => {
                                                        setEditingIngredient(item);
                                                        setEditName(item.name);
                                                        setEditUnit(item.unit_type);
                                                        setEditTipo(item.tipo ?? 'insumo_base');
                                                        setEditCost(item.avg_cost_per_unit);
                                                        setEditStock(item.stock_quantity);
                                                    }}
                                                    className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                                    title="Editar Insumo"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => { setStockEntryIngredient(item); setStockEntryQty(''); setStockEntryCost(''); }}
                                                    className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-colors"
                                                    title="Entrada de Estoque"
                                                >
                                                    <PlusCircle className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteIngredient(item.id)}
                                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                    title="Excluir Insumo"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Novo Insumo */}
            {showNewModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">Novo Insumo</h2>
                            <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Ex: Farinha de Trigo"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                    <select value={newTipo} onChange={e => setNewTipo(e.target.value as IngredientTipo)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white">
                                        {TIPO_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                                    <select value={newUnit} onChange={e => setNewUnit(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white">
                                        {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Custo Médio (R$)</label>
                                    <input
                                        type="number"
                                        value={newCost}
                                        onChange={e => setNewCost(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Inicial</label>
                                    <input
                                        type="number"
                                        value={newStock}
                                        onChange={e => setNewStock(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="0"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                                {TIPO_OPTIONS.find(t => t.value === newTipo)?.desc}
                            </p>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors text-sm">Cancelar</button>
                            <button
                                onClick={handleCreateIngredient}
                                disabled={savingNew || !newName.trim()}
                                className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm shadow-sm"
                            >
                                {savingNew ? 'Salvando...' : 'Salvar Insumo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Editar Insumo */}
            {editingIngredient && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">Editar Insumo</h2>
                            <button onClick={() => setEditingIngredient(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                    <select value={editTipo} onChange={e => setEditTipo(e.target.value as IngredientTipo)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                                        {TIPO_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                                    <select value={editUnit} onChange={e => setEditUnit(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                                        {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Custo Médio (R$)</label>
                                    <input
                                        type="number"
                                        value={editCost}
                                        onChange={e => setEditCost(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Atual</label>
                                    <input
                                        type="number"
                                        value={editStock}
                                        onChange={e => setEditStock(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                                {TIPO_OPTIONS.find(t => t.value === editTipo)?.desc}
                            </p>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setEditingIngredient(null)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors text-sm">Cancelar</button>
                            <button
                                onClick={handleEditIngredient}
                                disabled={savingEdit || !editName.trim()}
                                className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm shadow-sm"
                            >
                                {savingEdit ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Entrada de Estoque */}
            {stockEntryIngredient && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Entrada de Estoque</h2>
                                <p className="text-sm text-slate-500 mt-0.5">{stockEntryIngredient.name}</p>
                            </div>
                            <button onClick={() => setStockEntryIngredient(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-600">
                                Estoque atual: <strong className="text-slate-900">{stockEntryIngredient.stock_quantity} {stockEntryIngredient.unit_type}</strong>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade a Adicionar</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={stockEntryQty}
                                        onChange={e => setStockEntryQty(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="0"
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                                        autoFocus
                                    />
                                    <span className="text-sm font-bold text-slate-500 px-2 py-2 bg-slate-100 rounded-lg border border-slate-200">
                                        {stockEntryIngredient.unit_type}
                                    </span>
                                </div>
                                {stockEntryQty !== '' && Number(stockEntryQty) > 0 && (
                                    <p className="mt-2 text-xs text-emerald-600">
                                        Novo estoque: <strong>{stockEntryIngredient.stock_quantity + Number(stockEntryQty)} {stockEntryIngredient.unit_type}</strong>
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Custo desta compra (R$/{stockEntryIngredient.unit_type}){' '}
                                    <span className="text-slate-400 font-normal">(opcional)</span>
                                </label>
                                <input
                                    type="number"
                                    value={stockEntryCost}
                                    onChange={e => setStockEntryCost(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder={stockEntryIngredient.avg_cost_per_unit.toFixed(2)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                                />
                                {stockEntryCost !== '' && Number(stockEntryCost) > 0 && stockEntryQty !== '' && Number(stockEntryQty) > 0 && (() => {
                                    const currentQty = stockEntryIngredient.stock_quantity;
                                    const addedQty = Number(stockEntryQty);
                                    const newAvg = ((currentQty * stockEntryIngredient.avg_cost_per_unit) + (addedQty * Number(stockEntryCost))) / (currentQty + addedQty);
                                    return (
                                        <p className="mt-2 text-xs text-blue-600">
                                            Novo custo médio: <strong>R$ {newAvg.toFixed(4)}</strong>
                                            <span className="text-slate-400 ml-1">(era R$ {stockEntryIngredient.avg_cost_per_unit.toFixed(4)})</span>
                                        </p>
                                    );
                                })()}
                                {stockEntryCost === '' && (
                                    <p className="mt-1 text-xs text-slate-400">Se não informado, o custo médio atual é mantido.</p>
                                )}
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => { setStockEntryIngredient(null); setStockEntryCost(''); }} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors text-sm">Cancelar</button>
                            <button
                                onClick={handleStockEntry}
                                disabled={savingStockEntry || stockEntryQty === '' || Number(stockEntryQty) <= 0}
                                className="px-5 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm shadow-sm"
                            >
                                {savingStockEntry ? 'Registrando...' : 'Confirmar Entrada'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
