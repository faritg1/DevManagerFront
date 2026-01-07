import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Eye, EyeOff, Hexagon } from 'lucide-react';

const LoginScreen: React.FC = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        navigate('/dashboard');
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-background-light dark:bg-background-dark overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-30 dark:opacity-20">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#325167] blur-[100px]"></div>
            </div>

            <div className="w-full max-w-[460px] relative z-10">
                <div className="mb-8 text-center sm:text-left flex flex-col gap-4">
                     <div className="size-12 text-primary mx-auto sm:mx-0">
                        <Hexagon fill="currentColor" className="w-full h-full" />
                    </div>
                    <div>
                        <h1 className="text-slate-900 dark:text-white text-3xl sm:text-4xl font-black leading-tight tracking-tight mb-2">Welcome Back</h1>
                        <p className="text-slate-500 dark:text-text-muted text-base">Enter your credentials to access your workspace.</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#192833] rounded-2xl shadow-xl border border-slate-200 dark:border-[#233948] p-6 sm:p-8 backdrop-blur-sm">
                    <form className="flex flex-col gap-5" onSubmit={handleLogin}>
                        <label className="flex flex-col w-full gap-2">
                            <span className="text-slate-700 dark:text-white text-sm font-semibold">Corporate Email</span>
                            <div className="relative group">
                                <input 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-[#325167] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white h-12 pl-11 pr-4 outline-none focus:border-primary dark:focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="name@company.com" 
                                    type="email"
                                    required
                                />
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                            </div>
                        </label>

                        <label className="flex flex-col w-full gap-2">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-700 dark:text-white text-sm font-semibold">Password</span>
                                <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
                            </div>
                            <div className="relative group">
                                <input 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-[#325167] bg-slate-50 dark:bg-[#111b22] text-slate-900 dark:text-white h-12 pl-11 pr-12 outline-none focus:border-primary dark:focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="••••••••" 
                                    type={showPassword ? "text" : "password"}
                                    required
                                />
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                    <div className="w-5 h-5 border-2 border-current rounded-md flex items-center justify-center text-[10px] font-bold">***</div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </label>

                        <button className="w-full h-12 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all active:scale-[0.98] mt-2">
                            Sign In
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-[#233948]"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white dark:bg-[#192833] px-4 text-xs font-medium text-slate-500 dark:text-text-muted uppercase tracking-wider">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center gap-2 h-11 rounded-xl border border-slate-200 dark:border-[#325167] bg-slate-50 dark:bg-[#111b22] hover:bg-slate-100 dark:hover:bg-[#233948] transition-colors text-slate-700 dark:text-white font-medium text-sm">
                            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                            <span>Google</span>
                        </button>
                        <button className="flex items-center justify-center gap-2 h-11 rounded-xl border border-slate-200 dark:border-[#325167] bg-slate-50 dark:bg-[#111b22] hover:bg-slate-100 dark:hover:bg-[#233948] transition-colors text-slate-700 dark:text-white font-medium text-sm">
                            <svg className="w-5 h-5" viewBox="0 0 23 23"><path fill="#f3f3f3" d="M0 0h11.377v11.372H0z"/><path fill="#f3f3f3" d="M11.733 0H23.11v11.372H11.733z"/><path fill="#f3f3f3" d="M0 11.732h11.377V23.105H0z"/><path fill="#f3f3f3" d="M11.733 11.732H23.11V23.105H11.733z"/></svg>
                            <span>Microsoft</span>
                        </button>
                    </div>

                    <div className="mt-8 text-center">
                        <Link to="/register" className="text-sm font-medium text-slate-500 dark:text-text-muted hover:text-primary dark:hover:text-white transition-colors">
                            Don't have an account? <span className="text-primary hover:underline">Register Organization</span>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default LoginScreen;
