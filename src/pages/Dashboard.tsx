import React from 'react';
import { TrendingDown, TrendingUp, AlertCircle, UtensilsCrossed } from 'lucide-react';

export const Dashboard = () => {
    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Visão Geral do Restaurante</h1>
                <p className="text-slate-500">Métricas atualizadas de CMV e Vendas diárias.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Metric Card 1 */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <h3 className="text-slate-500 font-medium text-sm">CMV Geral (Mês)</h3>
                        <span className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <TrendingDown className="w-5 h-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <span className="text-3xl font-bold text-slate-900">28.4%</span>
                        <div className="mt-1 text-sm text-green-600 flex items-center">
                            <span>-2.1% desde o último mês</span>
                        </div>
                    </div>
                </div>

                {/* Metric Card 2 */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <h3 className="text-slate-500 font-medium text-sm">Receita Estimada</h3>
                        <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <TrendingUp className="w-5 h-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <span className="text-3xl font-bold text-slate-900">R$ 48.250</span>
                        <div className="mt-1 text-sm text-blue-600 flex items-center">
                            <span>+14.5% proj. mês anterior</span>
                        </div>
                    </div>
                </div>

                {/* Metric Card 3 */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <h3 className="text-slate-500 font-medium text-sm">Alertas de Estoque</h3>
                        <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <AlertCircle className="w-5 h-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <span className="text-3xl font-bold text-slate-900">4 Itens</span>
                        <div className="mt-1 text-sm text-amber-600 flex items-center">
                            <span>Abaixo do limite de compra</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center">
                        <UtensilsCrossed className="w-5 h-5 mr-2 text-indigo-500" />
                        Top Produtos com Melhor Margem
                    </h2>
                </div>
                <div className="divide-y divide-slate-100">
                    {/* Dummy Lists */}
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="py-4 flex items-center justify-between group">
                            <div>
                                <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">Combo Duplo Premium {item}</p>
                                <p className="text-sm text-slate-500">CMV: 24.5% • Custo: R$ 12,80</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-slate-900">Venda: R$ 52,00</p>
                                <p className="text-sm text-green-600">Margem: R$ 39,20</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
