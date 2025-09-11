
import React from 'react';

const StarIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${filled ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);


const ReviewCard: React.FC = () => {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Review</h3>
                <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">See all</button>
            </div>
            <div className="flex-grow flex flex-col items-center text-center">
                <img src="https://i.pravatar.cc/150?u=johnconnor" alt="John Connor" className="w-24 h-24 rounded-full mb-4 border-4 border-white dark:border-slate-800 shadow-lg" />
                <p className="text-gray-600 dark:text-gray-300 italic leading-relaxed">"Best Product I've been seen on market, best price, best quality! Overall Amazing!!!"</p>
                <div className="mt-4">
                    <div className="flex justify-center mb-1">
                        {[...Array(5)].map((_, i) => <StarIcon key={i} filled={i < 4} />)}
                        <StarIcon filled={false} />
                    </div>
                     <span className="text-sm text-gray-500 dark:text-gray-400">4.7</span>
                </div>
                 <p className="font-bold text-gray-800 dark:text-gray-100 mt-2">John Connor</p>
            </div>
        </div>
    );
};

export default ReviewCard;
