
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDownIcon } from './icons';

interface Category {
  id: string;
  name: string;
  subCategories?: Category[];
}

const CategoryItem: React.FC<{ category: Category; level: number }> = ({ category, level }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasSub = category.subCategories && category.subCategories.length > 0;

    return (
        <div>
            <div className={`flex items-center justify-between p-2 rounded-md ${level > 0 ? 'hover:bg-gray-100 dark:hover:bg-slate-700' : ''}`}>
                <div className="flex items-center">
                    {hasSub && (
                        <button type="button" onClick={() => setIsExpanded(!isExpanded)} className="mr-2 p-1">
                            <ChevronDownIcon className={`w-5 h-5 transition-transform text-gray-500 dark:text-gray-400 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                        </button>
                    )}
                    <span className={`font-medium ${level === 0 ? 'text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>{category.name}</span>
                </div>
                <div>
                     <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm mx-1">Edit</button>
                     <button className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm mx-1">Delete</button>
                </div>
            </div>
            {hasSub && isExpanded && (
                <div style={{ paddingLeft: `${(level + 1) * 20}px` }}>
                    {category.subCategories?.map(subCat => <CategoryItem key={subCat.id} category={subCat} level={level + 1} />)}
                </div>
            )}
        </div>
    )
}

const CategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mockCategories: Category[] = [
        { id: '1', name: 'Kabel', subCategories: [
            { id: '1-1', name: 'Kabel Tembaga' },
            { id: '1-2', name: 'Kabel Fiber Optik' },
        ]},
        { id: '2', name: 'Aksesoris' },
        { id: '3', name: 'Network', subCategories: [
            { id: '3-1', name: 'Switch' },
            { id: '3-2', name: 'Router' },
        ]}
    ];
    setCategories(mockCategories);
    setLoading(false);
    setError(null);
  }, []);

  const topLevelCategories = useMemo(() => categories.map(c => c.name), [categories]);

  return (
    <div className="p-8 bg-gray-50 dark:bg-slate-900 min-h-full">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Product Categories</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1">Organize your product categories and sub-categories.</p>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Category Tree</h3>
            <div className="space-y-2">
                {loading ? (
                    <p className="text-gray-500 dark:text-gray-400">Loading categories...</p>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : (
                    categories.map(cat => <CategoryItem key={cat.id} category={cat} level={0} />)
                )}
            </div>
          </div>
        </div>
        <div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Add New Category</h3>
                <form className="space-y-4">
                    <div>
                        <label htmlFor="cat-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category Name</label>
                        <input type="text" id="cat-name" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200" placeholder="e.g., Homeware" />
                    </div>
                    <div>
                        <label htmlFor="parent-cat" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Parent Category</label>
                        <select id="parent-cat" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200">
                            <option>None (Top-level)</option>
                            {topLevelCategories.map(catName => (
                               <option key={catName}>{catName}</option>
                            ))}
                        </select>
                    </div>
                     <div className="pt-2">
                        <button type="submit" className="w-full px-4 py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700">Add Category</button>
                    </div>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
