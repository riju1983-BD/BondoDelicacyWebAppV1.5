import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Icon } from './Icon';

const Spinner: React.FC<{className?: string}> = ({ className = "h-5 w-5" }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const AdminLoginPage: React.FC = () => {
    const { login } = useAuth();

    const [formData, setFormData] = useState({ email: 'admin@bongodelicacy.com', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const user = await login(formData.email, formData.password);
            if (user.isAdmin) {
                window.location.hash = '#admin'; // Redirect to admin dashboard on success
            } else {
                setError('Access Denied. You do not have administrator privileges.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleNavigate = (route: string) => {
        window.location.hash = route;
    };

    return (
        <div className="min-h-screen bg-gray-800 text-white p-4 sm:p-6 lg:p-8 flex items-center justify-center">
            <div className="w-full max-w-sm bg-gray-900 rounded-lg shadow-2xl p-8">
                <header className="text-center mb-8">
                    <Icon type="user" className="mx-auto h-12 w-12 text-red-400" />
                    <h1 className="text-4xl font-serif mt-4">Admin Access</h1>
                    <p className="text-gray-400 mt-2">Please log in to continue.</p>
                </header>
                
                <form className="space-y-4" onSubmit={handleSubmit}>
                    {error && <p className="p-3 bg-red-900/50 border border-red-600 text-red-200 rounded-md animate-fade-in text-center text-sm">{error}</p>}
                    
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                        <input type="email" name="email" id="email" required value={formData.email} onChange={handleChange} className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-red-500 focus:outline-none text-white"/>
                    </div>
                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <input type="password" name="password" id="password" placeholder="Default: admin123" required value={formData.password} onChange={handleChange} className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-red-500 focus:outline-none text-white"/>
                    </div>
                    
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center font-bold py-3 px-4 rounded-md bg-red-600 hover:bg-red-500 disabled:bg-gray-500 transition-colors">
                        {isLoading ? <Spinner/> : 'Login'}
                    </button>
                </form>

                <div className="text-center mt-6">
                     <p className="mt-4">
                         <button onClick={() => handleNavigate('#')} className="text-sm text-gray-400 hover:underline bg-transparent border-none p-0 cursor-pointer">← Back to Main Site</button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;