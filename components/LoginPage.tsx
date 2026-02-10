
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Icon } from './Icon';
import { User } from '../types';

const Spinner: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const LoginPage: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const { login, register } = useAuth();

    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', password: '', dob: '',
        likes: '', dislikes: '', allergies: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            if (isLoginView) {
                await login(formData.email, formData.password);
                window.location.hash = '#account'; // Only redirect immediately on login
            } else {
                const dietaryPreferences = {
                    likes: formData.likes ? formData.likes.split(",").map(s => s.trim()) : [],
                    dislikes: formData.dislikes ? formData.dislikes.split(",").map(s => s.trim()) : [],
                    allergies: formData.allergies ? formData.allergies.split(",").map(s => s.trim()) : [],
                };

                await register(
                    formData.name,
                    formData.email,
                    formData.phone,
                    formData.password,
                    formData.dob,
                    dietaryPreferences
                );
                // On successful registration, switch to login view and show success message
                setIsLoginView(true);
                setSuccess('Registration successful! Please log in with your new credentials.');
                setFormData(prev => ({ ...prev, password: '' })); // Clear password for security
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
            <div className="w-full max-w-md bg-gray-900 rounded-lg shadow-2xl p-8">
                <header className="text-center mb-8">
                    <Icon type="user" className="mx-auto h-12 w-12 text-cyan-400" />
                    <h1 className="text-4xl font-serif mt-4">{isLoginView ? 'Welcome Back' : 'Create Account'}</h1>
                    <p className="text-gray-400 mt-2">{isLoginView ? 'Sign in to continue' : 'Join us to start ordering'}</p>
                </header>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {success && <p className="p-3 bg-green-900/50 border border-green-600 text-green-200 rounded-md animate-fade-in text-center">{success}</p>}
                    {error && <p className="p-3 bg-red-900/50 border border-red-600 text-red-200 rounded-md animate-fade-in text-center">{error}</p>}

                    {!isLoginView && (
                        <>
                            <input type="text" name="name" placeholder="Your Name" required value={formData.name} onChange={handleChange} className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white" />
                            <input type="tel" name="phone" placeholder="Phone Number" required value={formData.phone} onChange={handleChange} className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white" />
                        </>
                    )}
                    <input type="email" name="email" placeholder="Your Email" required value={formData.email} onChange={handleChange} className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white" />
                    <input type="password" name="password" placeholder="Password" required value={formData.password} onChange={handleChange} className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white" />
                    {!isLoginView && (
                        <>
                            <div className="pt-2">
                                <label htmlFor="dob" className="block text-xs font-medium text-gray-400 mb-1">Date of Birth (Optional)</label>
                                <input type="date" name="dob" id="dob" value={formData.dob} onChange={handleChange} className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white" />
                            </div>
                            <div className="pt-2">
                                <label className="block text-xs font-medium text-gray-400 mb-1">Dietary Preferences (Optional)</label>
                                <textarea name="likes" placeholder="Likes (e.g., spicy, seafood)" value={formData.likes} onChange={handleChange} rows={2} className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white" />
                                <textarea name="dislikes" placeholder="Dislikes (e.g., cilantro, mushrooms)" value={formData.dislikes} onChange={handleChange} rows={2} className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white mt-2" />
                                <textarea name="allergies" placeholder="Allergies (e.g., peanuts, gluten)" value={formData.allergies} onChange={handleChange} rows={2} className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white mt-2" />
                            </div>
                        </>
                    )}
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center font-bold py-3 px-4 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-500 transition-colors">
                        {isLoading ? <Spinner /> : (isLoginView ? 'Login' : 'Register')}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <button onClick={() => { setIsLoginView(!isLoginView); setError(''); setSuccess(''); }} className="text-sm text-cyan-400 hover:underline">
                        {isLoginView ? 'Need an account? Register' : 'Already have an account? Login'}
                    </button>
                    <p className="mt-4">
                        <button onClick={() => handleNavigate('#')} className="text-sm text-gray-400 hover:underline bg-transparent border-none p-0 cursor-pointer">← Back to Main Site</button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
