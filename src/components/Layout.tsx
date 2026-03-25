import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Home, PieChart, ShoppingBag, LogOut, Package } from 'lucide-react';

export const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
                <div className="h-16 flex items-center px-6 border-b border-slate-200">
                    <Package className="w-6 h-6 text-blue-600 mr-2" />
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        TOCS CRM
                    </span>
                </div>

                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1 px-3">
                        <li>
                            <Link to="/" className="flex items-center px-3 py-2 text-blue-700 bg-blue-50 rounded-lg group">
                                <Home className="w-5 h-5 mr-3" />
                                <span className="font-medium">Dashboard</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/recipes" className="flex items-center px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg group transition-colors">
                                <PieChart className="w-5 h-5 mr-3" />
                                <span className="font-medium">Ficha Técnica & CMV</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/ingredients" className="flex items-center px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg group transition-colors">
                                <Package className="w-5 h-5 mr-3" />
                                <span className="font-medium">Estoque e Insumos</span>
                            </Link>
                        </li>
                        <li>
                            <a href="#" className="flex items-center px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg group transition-colors">
                                <ShoppingBag className="w-5 h-5 mr-3" />
                                <span className="font-medium">Vendas e Entradas</span>
                            </a>
                        </li>
                    </ul>
                </nav>

                <div className="p-4 border-t border-slate-200">
                    <button className="flex items-center w-full px-3 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <LogOut className="w-5 h-5 mr-3" />
                        <span className="font-medium">Sair</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-6 justify-between">
                    <button className="md:hidden text-slate-500 hover:text-slate-700">
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="flex items-center ml-auto">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                            A
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};
